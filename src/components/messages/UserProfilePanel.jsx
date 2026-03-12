import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Mail, CalendarDays, User } from "lucide-react";

export default function UserProfilePanel({ open, onClose, email, lang }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!open || !email) { setProfile(null); return; }
    base44.entities.User.filter({ email }).then(r => setProfile(r[0] || null)).catch(() => {});
  }, [open, email]);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : email?.[0]?.toUpperCase() || "?";

  const displayName = profile?.full_name || email?.split("@")[0];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-72 p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-gray-100">
          <SheetTitle className="text-sm font-semibold text-gray-700">
            {lang === "ar" ? "معلومات المستخدم" : lang === "fr" ? "Profil utilisateur" : "User Profile"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 p-5 flex flex-col items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mt-2">
            <span className="text-2xl font-bold text-emerald-700">{initials}</span>
          </div>

          <div className="text-center">
            <p className="font-semibold text-gray-900 text-base">{displayName}</p>
            {profile?.full_name && (
              <p className="text-xs text-gray-400 mt-0.5">{email}</p>
            )}
          </div>

          {/* Info rows */}
          <div className="w-full space-y-2">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 truncate">{email}</span>
            </div>

            {profile?.created_date && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <CalendarDays className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">
                    {lang === "ar" ? "عضو منذ" : lang === "fr" ? "Membre depuis" : "Member since"}
                  </p>
                  <p className="text-xs font-medium text-gray-700">
                    {new Date(profile.created_date).toLocaleDateString(
                      lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-DZ" : "en",
                      { month: "long", year: "numeric" }
                    )}
                  </p>
                </div>
              </div>
            )}

            {profile?.role && (
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 capitalize">{profile.role}</span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}