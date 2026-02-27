import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "../components/LanguageContext";

export default function MessagesPage() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    if (me) {
      const data = await base44.entities.Message.list("-created_date", 50);
      setMessages(data.filter(m => m.recipient_email === me.email || m.sender_email === me.email));
    }
    setLoading(false);
  }

  async function markRead(msg) {
    if (!msg.is_read && msg.recipient_email === user?.email) {
      await base44.entities.Message.update(msg.id, { is_read: true });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> {t.messages}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white h-16 rounded-xl animate-pulse border" />)}</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="text-lg">{lang === "ar" ? "لا توجد رسائل" : lang === "fr" ? "Aucun message" : "No messages yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => markRead(msg)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${!msg.is_read && msg.recipient_email === user?.email ? "border-emerald-300 bg-emerald-50" : "border-gray-100"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {lang === "ar" ? "إعلان" : lang === "fr" ? "Annonce" : "Listing"}: {msg.listing_id?.slice(-6)}
                      </span>
                      {!msg.is_read && msg.recipient_email === user?.email && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {msg.sender_email === user?.email ? (lang === "ar" ? "أنت" : lang === "fr" ? "Vous" : "You") : msg.sender_email} •{" "}
                      {new Date(msg.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}