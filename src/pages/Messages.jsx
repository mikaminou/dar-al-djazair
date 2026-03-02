import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, ArrowLeft, User, ExternalLink, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "../components/LanguageContext";

// --------------- helpers ---------------
function getThreadId(listingId, emailA, emailB) {
  return [listingId, ...[emailA, emailB].sort()].join("__");
}

function groupConversations(messages, userEmail) {
  const threads = {};
  messages.forEach(msg => {
    const tid = msg.thread_id || getThreadId(msg.listing_id, msg.sender_email, msg.recipient_email);
    if (!threads[tid]) {
      threads[tid] = {
        thread_id: tid,
        messages: [],
        listing_id: msg.listing_id,
        other: msg.sender_email === userEmail ? msg.recipient_email : msg.sender_email,
      };
    }
    threads[tid].messages.push(msg);
  });
  // sort each thread's messages oldest→newest, then sort threads by latest msg
  return Object.values(threads)
    .map(t => ({ ...t, messages: t.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)) }))
    .sort((a, b) => {
      const la = a.messages[a.messages.length - 1];
      const lb = b.messages[b.messages.length - 1];
      return new Date(lb.created_date) - new Date(la.created_date);
    });
}

// unread = messages sent TO me that I haven't read yet
function countUnread(conv, userEmail) {
  return conv.messages.filter(m => !m.is_read && m.recipient_email === userEmail).length;
}

// --------------- typing presence via a simple entity-like key in localStorage broadcast
// We'll use a localStorage + storage event approach for cross-tab, 
// but for same-session (realistic case) we store typing state in a ref and broadcast via a custom event.
const TYPING_KEY = "dari_typing";

function broadcastTyping(threadId, email, isTyping) {
  try {
    const payload = JSON.stringify({ threadId, email, isTyping, ts: Date.now() });
    localStorage.setItem(TYPING_KEY, payload);
    // trigger storage event on same tab listeners (won't fire for same tab normally)
    window.dispatchEvent(new StorageEvent("storage", { key: TYPING_KEY, newValue: payload }));
  } catch {}
}

// --------------- browser notification helper ---------------
async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function showBrowserNotification(senderEmail, content) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return; // app is in focus, no need
  const senderName = senderEmail?.split("@")[0] || senderEmail;
  new Notification(`💬 ${senderName}`, {
    body: content.length > 80 ? content.slice(0, 80) + "…" : content,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "dari-message",
    renotify: true,
  });
}

// --------------- component ---------------
export default function MessagesPage() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingBroadcastRef = useRef(null);
  const activeThreadRef = useRef(null);
  const userRef = useRef(null);

  // keep refs in sync
  useEffect(() => { activeThreadRef.current = activeThread; }, [activeThread]);
  useEffect(() => { userRef.current = user; }, [user]);

  // ---- load data ----
  useEffect(() => { load(); }, []);

  // ---- real-time message subscription ----
  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === "create") {
        const m = event.data;
        if (m.recipient_email === user.email || m.sender_email === user.email) {
          setMessages(prev => {
            if (prev.find(p => p.id === m.id)) return prev;
            return [...prev, m];
          });
          // If this message is in the active thread and I'm the recipient → mark read
          const tid = m.thread_id || getThreadId(m.listing_id, m.sender_email, m.recipient_email);
          if (m.recipient_email === user.email && activeThreadRef.current?.thread_id === tid) {
            markThreadRead([m]);
          }
        }
      }
      if (event.type === "update") {
        setMessages(prev => prev.map(p => p.id === event.id ? { ...p, ...event.data } : p));
      }
    });
    return unsub;
  }, [user]);

  // ---- typing detection from storage events ----
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== TYPING_KEY) return;
      try {
        const { threadId, email, isTyping, ts } = JSON.parse(e.newValue);
        const me = userRef.current;
        const active = activeThreadRef.current;
        if (!me || !active) return;
        if (email === me.email) return; // my own broadcast
        if (threadId !== active.thread_id) return;
        if (Date.now() - ts > 5000) return; // stale
        setOtherIsTyping(isTyping);
        if (isTyping) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherIsTyping(false), 4000);
        }
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const messagesContainerRef = useRef(null);

  // ---- scroll to bottom of messages container only ----
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeThread, messages, otherIsTyping]);

  // ---- mark messages read when opening a thread ----
  async function markThreadRead(msgs) {
    const unreadMsgs = msgs.filter(m => !m.is_read && m.recipient_email === userRef.current?.email);
    if (unreadMsgs.length === 0) return;
    await Promise.all(unreadMsgs.map(m => base44.entities.Message.update(m.id, { is_read: true })));
    setMessages(prev => prev.map(p => unreadMsgs.find(u => u.id === p.id) ? { ...p, is_read: true } : p));
  }

  function openThread(conv) {
    setActiveThread(conv);
    setOtherIsTyping(false);
    // Mark all unread messages in this thread as read
    markThreadRead(conv.messages);
  }

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    if (me) {
      const data = await base44.entities.Message.list("-created_date", 300);
      const mine = data.filter(m => m.recipient_email === me.email || m.sender_email === me.email);
      setMessages(mine);
    }
    setLoading(false);
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    if (!activeThread || !user) return;
    // broadcast typing start
    broadcastTyping(activeThread.thread_id, user.email, true);
    clearTimeout(typingBroadcastRef.current);
    typingBroadcastRef.current = setTimeout(() => {
      broadcastTyping(activeThread.thread_id, user.email, false);
    }, 2000);
  }

  async function sendReply() {
    if (!input.trim() || !activeThread || !user) return;
    setSending(true);
    // stop typing broadcast
    broadcastTyping(activeThread.thread_id, user.email, false);
    clearTimeout(typingBroadcastRef.current);
    const msg = await base44.entities.Message.create({
      listing_id: activeThread.listing_id,
      sender_email: user.email,
      recipient_email: activeThread.other,
      content: input.trim(),
      thread_id: activeThread.thread_id,
      is_read: false,
    });
    setMessages(prev => prev.find(p => p.id === msg.id) ? prev : [...prev, msg]);
    setInput("");
    setSending(false);
  }

  // ---- derived state ----
  const conversations = groupConversations(messages, user?.email || "");

  const threadMessages = activeThread
    ? messages
        .filter(m => (m.thread_id || getThreadId(m.listing_id, m.sender_email, m.recipient_email)) === activeThread.thread_id)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  // total unread across all convs
  const totalUnread = conversations.reduce((sum, c) => sum + countUnread(c, user?.email || ""), 0);

  const labels = {
    en: { noMsg: "No conversations yet", send: "Send", placeholder: "Type a message...", typing: "is typing...", delivered: "Delivered", read: "Read" },
    fr: { noMsg: "Aucune conversation", send: "Envoyer", placeholder: "Écrire un message...", typing: "est en train d'écrire...", delivered: "Envoyé", read: "Lu" },
    ar: { noMsg: "لا توجد محادثات", send: "إرسال", placeholder: "اكتب رسالة...", typing: "يكتب...", delivered: "مُرسل", read: "مقروء" },
  };
  const l = labels[lang] || labels.fr;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 gap-3">
      <MessageSquare className="w-10 h-10 opacity-20" />
      <span>{lang === "ar" ? "يرجى تسجيل الدخول" : lang === "fr" ? "Veuillez vous connecter" : "Please sign in"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-emerald-800 text-white py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          {activeThread && (
            <button onClick={() => setActiveThread(null)} className="md:hidden p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <MessageSquare className="w-5 h-5" />
          <h1 className="text-lg font-bold">{t.messages}</h1>
          {totalUnread > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalUnread}</span>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full flex shadow-sm bg-white border border-gray-100 rounded-xl my-4 overflow-hidden" style={{ minHeight: "70vh" }}>
        {/* Conversations list */}
        <div className={`w-full md:w-80 border-r border-gray-100 flex-shrink-0 flex flex-col ${activeThread ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">
              {lang === "ar" ? "المحادثات" : lang === "fr" ? "Conversations" : "Conversations"}
              {totalUnread > 0 && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
            </h2>
          </div>

          {conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm">{l.noMsg}</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {conversations.map(conv => {
                const last = conv.messages[conv.messages.length - 1];
                const u = countUnread(conv, user.email);
                const isActive = activeThread?.thread_id === conv.thread_id;
                const hasUnread = u > 0;
                return (
                  <button
                    key={conv.thread_id}
                    onClick={() => openThread(conv)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-gray-50 hover:bg-emerald-50 transition-colors ${isActive ? "bg-emerald-50 border-l-2 border-l-emerald-500" : ""}`}
                  >
                    <div className="relative w-10 h-10 flex-shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-semibold text-gray-700"}`}>
                          {conv.other?.split("@")[0]}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                          {new Date(last.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                        {last.sender_email === user.email ? "✓ " : ""}{last.content}
                      </p>
                    </div>
                    {u > 0 && (
                      <span className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-1">{u}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col ${!activeThread ? "hidden md:flex" : "flex"}`}>
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <MessageSquare className="w-16 h-16 opacity-20 mb-3" />
              <p className="text-sm">{lang === "ar" ? "اختر محادثة" : lang === "fr" ? "Sélectionnez une conversation" : "Select a conversation"}</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{activeThread.other?.split("@")[0]}</p>
                  <p className="text-xs text-gray-400">
                    {otherIsTyping
                      ? <span className="text-emerald-500 font-medium animate-pulse">{l.typing}</span>
                      : activeThread.other}
                  </p>
                </div>
                <Link
                  to={createPageUrl("ListingDetail") + `?id=${activeThread.listing_id}`}
                  className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 flex-shrink-0 transition-colors font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {lang === "ar" ? "الإعلان" : lang === "fr" ? "Voir l'annonce" : "View listing"}
                </Link>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMessages.map((msg, idx) => {
                  const isMe = msg.sender_email === user.email;
                  const isLastMine = isMe && idx === threadMessages.map(m => m.sender_email === user.email).lastIndexOf(true);
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                      )}
                      <div className="flex flex-col items-end max-w-xs md:max-w-sm">
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-emerald-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 text-xs ${isMe ? "text-gray-400 justify-end" : "text-gray-400 justify-start"}`}>
                          <span>{new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {isMe && (
                            msg.is_read
                              ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" title={l.read} />
                              : <Check className="w-3.5 h-3.5 text-gray-400" title={l.delivered} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {otherIsTyping && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 bg-white flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
                  placeholder={l.placeholder}
                  rows={1}
                  className="flex-1 resize-none text-sm rounded-xl"
                />
                <Button onClick={sendReply} disabled={!input.trim() || sending} className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}