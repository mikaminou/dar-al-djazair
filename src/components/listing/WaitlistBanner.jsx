import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WaitlistBanner({ listing, user, lang }) {
  const [entry, setEntry] = useState(null); // existing waitlist entry
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user || listing.status !== "reserved") { setLoading(false); return; }
    base44.entities.Waitlist.filter({ listing_id: listing.id, user_email: user.email }, null, 1)
      .then(res => { setEntry(res[0] || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [listing.id, user]);

  if (listing.status !== "reserved") return null;

  const label = {
    title: { en: "This property is currently reserved.", fr: "Ce bien est actuellement réservé.", ar: "هذا العقار محجوز حالياً." },
    subtitle: { en: "Join the waitlist to be contacted if it becomes available again.", fr: "Rejoignez la liste d'attente pour être contacté s'il redevient disponible.", ar: "انضم لقائمة الانتظار لتُخطر إذا أصبح متاحاً مجدداً." },
    join: { en: "Join Waitlist", fr: "Rejoindre la liste d'attente", ar: "انضم لقائمة الانتظار" },
    position: (n) => ({ en: `You are #${n} on the waitlist.`, fr: `Vous êtes #${n} sur la liste d'attente.`, ar: `أنت رقم ${n} في قائمة الانتظار.` }),
    login: { en: "Sign in to join the waitlist", fr: "Connectez-vous pour rejoindre la liste d'attente", ar: "سجّل دخولك للانضمام" },
    withdrawn: { en: "You withdrew from this waitlist.", fr: "Vous avez quitté cette liste d'attente.", ar: "لقد انسحبت من قائمة الانتظار." },
  };
  const t = (k, ...args) => typeof label[k] === "function" ? (label[k](...args)[lang] || label[k](...args).en) : (label[k][lang] || label[k].en);

  async function joinWaitlist() {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }
    setJoining(true);
    // Count existing entries to get position
    const existing = await base44.entities.Waitlist.filter({ listing_id: listing.id }, "position", 500).catch(() => []);
    const active = existing.filter(e => e.status !== "withdrawn");
    const position = active.length + 1;
    const created = await base44.entities.Waitlist.create({
      listing_id: listing.id,
      listing_title: listing.title,
      listing_wilaya: listing.wilaya,
      owner_email: listing.created_by,
      user_email: user.email,
      user_name: user.full_name || "",
      position,
      joined_at: new Date().toISOString(),
      status: "waiting",
    });
    setEntry(created);
    setJoining(false);
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-2">
        <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">{t("title")}</p>
          {(!entry || entry.status === "withdrawn") && (
            <p className="text-xs text-amber-700 mt-0.5">{t("subtitle")}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-amber-600 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" /> ...
        </div>
      ) : !user ? (
        <button
          onClick={() => base44.auth.redirectToLogin(window.location.pathname + window.location.search)}
          className="w-full text-center text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2 px-3 font-medium transition-colors"
        >
          {t("login")}
        </button>
      ) : entry && entry.status === "waiting" ? (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          {t("position", entry.position)}
        </div>
      ) : entry && entry.status === "contacted" ? (
        <div className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          {lang === "ar" ? "تم التواصل معك من قبل المالك." : lang === "fr" ? "Le propriétaire vous a contacté." : "The owner has contacted you."}
        </div>
      ) : (
        <Button
          size="sm"
          onClick={joinWaitlist}
          disabled={joining}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2 text-xs"
        >
          {joining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
          {t("join")}
        </Button>
      )}
    </div>
  );
}