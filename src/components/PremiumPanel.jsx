import React, { useState, useEffect } from "react";
import { X, Check, Crown, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const MONTHLY = 7500;
const YEARLY  = MONTHLY * 11;

const HIGHLIGHTS = [
  { en: "Unlimited listings",             fr: "Annonces illimitées",            ar: "إعلانات غير محدودة" },
  { en: "Unlimited photos per listing",   fr: "Photos illimitées par annonce",  ar: "صور غير محدودة" },
  { en: "Leads & analytics dashboard",    fr: "Tableau de bord leads & analytics", ar: "لوحة تحليلات وعملاء" },
  { en: "AI buyer recommendations",       fr: "Recommandations IA acheteurs",   ar: "توصيات مشترين بالذكاء الاصطناعي" },
  { en: "CRM tools & client management",  fr: "Outils CRM & gestion clients",   ar: "أدوات CRM وإدارة العملاء" },
  { en: "Boost & featured placement",     fr: "Boost & mise en avant",          ar: "تعزيز وتصدر النتائج" },
  { en: "Verified Partner badge",         fr: "Badge Partenaire Vérifié",       ar: "شارة الشريك الموثق" },
  { en: "Rental management & income",     fr: "Gestion locative & revenus",     ar: "إدارة الإيجار والدخل" },
];

export default function PremiumPanel({ lang, user, onClose }) {
  const [plan, setPlan]         = useState("monthly");
  const [message, setMessage]   = useState("");
  const [status, setStatus]     = useState("idle"); // idle | loading | sent | already
  const isRtl = lang === "ar";

  useEffect(() => {
    if (!user) return;
    base44.entities.UpgradeRequest.filter({ user_email: user.email, status: "pending" }, null, 1)
      .then(res => { if (res.length > 0) setStatus("already"); })
      .catch(() => {});
  }, [user]);

  const t = (en, fr, ar) => lang === "fr" ? fr : lang === "ar" ? ar : en;
  const price = plan === "monthly" ? MONTHLY : YEARLY;
  const fmt   = v => new Intl.NumberFormat("fr-FR").format(v);

  async function handleRequest() {
    if (!user) { base44.auth.redirectToLogin(); return; }
    setStatus("loading");
    await base44.entities.UpgradeRequest.create({
      user_email: user.email,
      user_name:  user.full_name || user.email,
      plan,
      message: message.trim() || undefined,
    });
    setStatus("sent");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-20 px-4"
      dir={isRtl ? "rtl" : "ltr"}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">Premium</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <h2 className="text-white text-xl font-bold leading-tight">
                {t("Unlock Professional Tools", "Débloquez les outils Pro", "أدوات الاحتراف الكاملة")}
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                {t("For agencies, developers & agents", "Pour agences, promoteurs & agents", "للوكالات والمطورين والوكلاء")}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Left: Features */}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                {t("What you get", "Ce que vous obtenez", "ما تحصل عليه")}
              </p>
              <ul className="space-y-2">
                {HIGHLIGHTS.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {t(f.en, f.fr, f.ar)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Pricing + CTA */}
            <div className="flex flex-col">
              {/* Plan toggle */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1 mb-4">
                {[
                  { key: "monthly", en: "Monthly", fr: "Mensuel", ar: "شهري" },
                  { key: "yearly",  en: "Annual",  fr: "Annuel",  ar: "سنوي", badge: true },
                ].map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPlan(p.key)}
                    className={`relative flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      plan === p.key ? "bg-emerald-500 text-white shadow" : "text-white/50 hover:text-white"
                    }`}
                  >
                    {t(p.en, p.fr, p.ar)}
                    {p.badge && (
                      <span className="absolute -top-2 -right-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        -8%
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Price display */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center">
                <div className="text-3xl font-extrabold text-white">{fmt(price)} <span className="text-base font-medium text-white/50">DA</span></div>
                <div className="text-white/50 text-sm mt-0.5">
                  {plan === "monthly"
                    ? t("/ month", "/ mois", "/ شهر")
                    : <>/ {t("year", "an", "سنة")} — <span className="text-emerald-400 font-semibold">{t("1 month free!", "1 mois offert!", "شهر مجاني!")}</span></>
                  }
                </div>
                {plan === "yearly" && (
                  <div className="text-white/40 text-xs mt-1">≈ {fmt(Math.round(YEARLY / 12))} DA / {t("month", "mois", "شهر")}</div>
                )}
              </div>

              {/* Optional message */}
              {status === "idle" && (
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t("Optional message to admin…", "Message optionnel à l'admin…", "رسالة اختيارية للمسؤول...")}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 resize-none placeholder-white/30 focus:outline-none focus:border-emerald-500 mb-4"
                />
              )}

              {/* CTA */}
              {status === "sent" && (
                <div className="flex-1 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                  <div>
                    <div className="text-emerald-400 text-2xl mb-1">✓</div>
                    <p className="text-emerald-300 font-semibold text-sm">
                      {t("Request sent!", "Demande envoyée!", "تم إرسال الطلب!")}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {t("Admin will contact you shortly.", "L'admin vous contactera bientôt.", "سيتواصل معك المسؤول قريبًا.")}
                    </p>
                  </div>
                </div>
              )}
              {status === "already" && (
                <div className="flex-1 flex items-center justify-center bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                  <div>
                    <div className="text-amber-400 text-2xl mb-1">⏳</div>
                    <p className="text-amber-300 font-semibold text-sm">
                      {t("Request pending", "Demande en cours", "الطلب قيد المراجعة")}
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                      {t("Admin will contact you shortly.", "L'admin vous contactera bientôt.", "سيتواصل معك المسؤول قريبًا.")}
                    </p>
                  </div>
                </div>
              )}
              {(status === "idle" || status === "loading") && (
                <Button
                  onClick={handleRequest}
                  disabled={status === "loading"}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold gap-2 py-5 rounded-xl text-base shadow-lg shadow-emerald-500/20"
                >
                  {status === "loading"
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <>
                        {t("Request Upgrade", "Demander l'offre Premium", "طلب الترقية")}
                        <ArrowRight className="w-5 h-5" />
                      </>
                  }
                </Button>
              )}

              <p className="text-white/25 text-xs text-center mt-3">
                {t("Admin reviews & activates manually", "L'admin examine et active manuellement", "يراجع المسؤول ويفعّل يدويًا")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}