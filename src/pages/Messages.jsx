import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, ArrowLeft, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "../components/LanguageContext";

function getThreadId(listingId, emailA, emailB) {
  return [listingId, ...[emailA, emailB].sort()].join("__");
}

function groupConversations(messages, userEmail) {
  const threads = {};
  messages.forEach(msg => {
    const tid = msg.thread_id || getThreadId(msg.listing_id, msg.sender_email, msg.recipient_email);
    if (!threads[tid]) threads[tid] = { thread_id: tid, messages: [], listing_id: msg.listing_id, other: msg.sender_email === userEmail ? msg.recipient_email : msg.sender_email };
    threads[tid].messages.push(msg);
  });
  return Object.values(threads).sort((a, b) => {
    const la = a.messages[a.messages.length - 1];
    const lb = b.messages[b.messages.length - 1];
    return new Date(lb.created_date) - new Date(la.created_date);
  });
}

export default function MessagesPage() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.type === "create") {
        const m = event.data;
        if (m.recipient_email === user.email || m.sender_email === user.email) {
          setMessages(prev => [...prev, m]);
        }
      }
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread, messages]);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    if (me) {
      const data = await base44.entities.Message.list("-created_date", 200);
      const mine = data.filter(m => m.recipient_email === me.email || m.sender_email === me.email);
      setMessages(mine);
    }
    setLoading(false);
  }

  async function sendReply() {
    if (!input.trim() || !activeThread || !user) return;
    setSending(true);
    const msg = await base44.entities.Message.create({
      listing_id: activeThread.listing_id,
      sender_email: user.email,
      recipient_email: activeThread.other,
      content: input.trim(),
      thread_id: activeThread.thread_id,
      is_read: false,
    });
    setMessages(prev => [...prev, msg]);
    setInput("");
    setSending(false);
  }

  const conversations = groupConversations(messages, user?.email || "");

  const threadMessages = activeThread
    ? messages
        .filter(m => (m.thread_id || getThreadId(m.listing_id, m.sender_email, m.recipient_email)) === activeThread.thread_id)
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    : [];

  const unread = (conv) => conv.messages.filter(m => !m.is_read && m.recipient_email === user?.email).length;

  const labels = {
    en: { noMsg: "No conversations yet", back: "Back", send: "Send", placeholder: "Type a message..." },
    fr: { noMsg: "Aucune conversation", back: "Retour", send: "Envoyer", placeholder: "Écrire un message..." },
    ar: { noMsg: "لا توجد محادثات", back: "رجوع", send: "إرسال", placeholder: "اكتب رسالة..." },
  };
  const l = labels[lang] || labels.fr;

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <MessageSquare className="w-10 h-10 opacity-20 mr-3" />
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
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full flex shadow-sm bg-white border border-gray-100 rounded-xl my-4 overflow-hidden" style={{ minHeight: "70vh" }}>
        {/* Conversations list */}
        <div className={`w-full md:w-80 border-r border-gray-100 flex-shrink-0 flex flex-col ${activeThread ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">{lang === "ar" ? "المحادثات" : lang === "fr" ? "Conversations" : "Conversations"}</h2>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm">{l.noMsg}</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {conversations.map(conv => {
                const last = conv.messages[conv.messages.length - 1];
                const u = unread(conv);
                const isActive = activeThread?.thread_id === conv.thread_id;
                return (
                  <button
                    key={conv.thread_id}
                    onClick={() => setActiveThread(conv)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-gray-50 hover:bg-emerald-50 transition-colors ${isActive ? "bg-emerald-50" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800 truncate">{conv.other?.split("@")[0]}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{new Date(last.created_date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{last.content}</p>
                      <p className="text-xs text-emerald-600 mt-0.5 font-medium">#{conv.listing_id?.slice(-6)}</p>
                    </div>
                    {u > 0 && (
                      <span className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{u}</span>
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
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{activeThread.other?.split("@")[0]}</p>
                  <p className="text-xs text-gray-400">{activeThread.other} · #{activeThread.listing_id?.slice(-6)}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMessages.map(msg => {
                  const isMe = msg.sender_email === user.email;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      {!isMe && (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <User className="w-4 h-4 text-emerald-600" />
                        </div>
                      )}
                      <div className={`max-w-xs md:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-emerald-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                        {msg.content}
                        <div className={`text-xs mt-1 ${isMe ? "text-emerald-200" : "text-gray-400"}`}>
                          {new Date(msg.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 bg-white flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
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