import React, { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, MessageSquare, Users, Calendar, Home, CheckCheck, X, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";
import { fr, ar } from "date-fns/locale";

const TYPE_CONFIG = {
  message:              { Icon: MessageSquare, color: "text-blue-600",   bg: "bg-blue-50"   },
  lead_new:             { Icon: Users,         color: "text-emerald-600",bg: "bg-emerald-50"},
  lead_high_priority:   { Icon: Users,         color: "text-red-600",    bg: "bg-red-50"    },
  appointment_proposal: { Icon: Calendar,      color: "text-purple-600", bg: "bg-purple-50" },
  appointment_accepted: { Icon: Calendar,      color: "text-emerald-600",bg: "bg-emerald-50"},
  appointment_declined: { Icon: Calendar,      color: "text-red-600",    bg: "bg-red-50"    },
  appointment_reminder: { Icon: Calendar,      color: "text-amber-600",  bg: "bg-amber-50"  },
  listing_match:        { Icon: Home,          color: "text-indigo-600", bg: "bg-indigo-50" },
  tenant_renewal:       { Icon: AlertCircle,   color: "text-amber-600",  bg: "bg-amber-50"  },
};

function notifHref(url) {
  if (!url) return "#";
  const [page, params] = url.split("?");
  return createPageUrl(page) + (params ? "?" + params : "");
}

function timeAgo(dateStr, lang) {
  const locale = lang === "fr" ? fr : lang === "ar" ? ar : undefined;
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale });
}

export default function NotificationPanel({ notifications, onClose, onChange, lang }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  async function handleClick(notif) {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true });
      onChange(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    const href = notifHref(notif.url);
    if (href && href !== "#") window.location.href = href;
    onClose();
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    onChange(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const label = {
    title:     { en: "Notifications",   fr: "Notifications",   ar: "الإشعارات"     },
    markAll:   { en: "Mark all read",   fr: "Tout marquer lu", ar: "قراءة الكل"    },
    empty:     { en: "No notifications",fr: "Aucune notification", ar: "لا توجد إشعارات" },
  };
  const t = k => label[k]?.[lang] || label[k]?.en;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-[200] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="font-semibold text-gray-800 text-sm">{t("title")}</span>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t("markAll")}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300">
            <Bell className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          notifications.map(notif => {
            const cfg  = TYPE_CONFIG[notif.type] || TYPE_CONFIG.message;
            const Icon = cfg.Icon;
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!notif.is_read ? "bg-blue-50/50" : ""}`}
              >
                <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!notif.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {timeAgo(notif.created_date, lang)}
                  </p>
                </div>
                {!notif.is_read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}