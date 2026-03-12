import React, { useState, useEffect } from "react";
import { Bell, MessageSquare, Users, AlertCircle, Calendar, CheckCircle2, XCircle, Home } from "lucide-react";
import { base44 } from "@/api/base44Client";
import NotificationPanel from "./NotificationPanel";

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Could not play sound:', e.message);
  }
};

export default function NotificationBell({ user, lang }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    base44.entities.Notification.filter(
      { user_email: user.email }, "-created_date", 50
    ).then(setNotifications).catch(() => {});

    const unsub = base44.entities.Notification.subscribe(event => {
      if (event.data?.user_email !== user.email) return;
      if (event.type === "create") {
        setNotifications(prev => [event.data, ...prev]);
        // Play sound for message notifications
        if (event.data?.type === 'message') {
          playNotificationSound();
        }
      } else if (event.type === "update") {
        setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
      }
    });

    return unsub;
  }, [user?.email]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setOpen(false)}
          onChange={setNotifications}
          lang={lang}
        />
      )}
    </div>
  );
}