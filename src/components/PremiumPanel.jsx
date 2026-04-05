import React, { useState, useEffect } from "react";
import { X, Check, Crown, Sparkles, ArrowRight, Loader2, Image, Bot, Users, Calendar, Home, Bell, Star, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONTHLY = 7500;
const YEARLY  = MONTHLY * 11;

const CATEGORIES = [
  {
    icon: Image, key: "media",
    en: "Listings & Media", fr: "Annonces & Médias", ar: "الإعلانات",
    color: "#60a5fa", glow: "rgba(96,165,250,0.15)",
    items: [
      { en: "30 images & 5 videos per listing", fr: "30 photos & 5 vidéos par annonce", ar: "30 صورة و5 فيديوهات لكل إعلان" },
      { en: "Auto-post to all connected social media", fr: "Publication auto sur tous vos réseaux sociaux", ar: "نشر تلقائي على جميع شبكات التواصل" },
      { en: "DAR EL DJAZAIR watermark auto-applied to photos", fr: "Filigrane DAR EL DJAZAIR automatique sur photos", ar: "علامة مائية تُضاف تلقائياً على صورك" },
      { en: "Exclusivity protection — single-agency per property", fr: "Protection exclusivité — une seule agence par bien", ar: "حماية الحصرية — وكيل واحد لكل عقار" },
      { en: "Verified Partner badge on profile & listings", fr: "Badge Partenaire Vérifié sur profil & annonces", ar: "شارة الشريك الموثق على الملف والإعلانات" },
      { en: "Boost & featured placement in search results", fr: "Boost & mise en avant dans les résultats", ar: "تعزيز وتصدر نتائج البحث" },
    ]
  },
  {
    icon: Bot, key: "ai",
    en: "AI & Automation", fr: "IA & Automation", ar: "الذكاء الاصطناعي",
    color: "#c084fc", glow: "rgba(192,132,252,0.15)",
    items: [
      { en: "AI chatbot — buyers close deals from social media", fr: "Chatbot IA — closing directement depuis les réseaux", ar: "چاتبوت ذكي — إتمام الصفقات من السوشيال ميديا" },
      { en: "AI-generated leads from buyer behaviour analysis", fr: "Leads IA depuis l'analyse comportementale", ar: "عملاء محتملون بالذكاء الاصطناعي" },
      { en: "Smart user-to-agency matching & redirection", fr: "Redirection intelligente vers votre agence", ar: "توجيه ذكي للمستخدمين نحو وكالتك" },
      { en: "Automated email follow-ups per lead status", fr: "Séquences email automatisées par statut de lead", ar: "متابعة بريد إلكتروني تلقائية حسب حالة كل عميل" },
    ]
  },
  {
    icon: Users, key: "crm",
    en: "CRM & Leads", fr: "CRM & Leads", ar: "CRM والعملاء",
    color: "#34d399", glow: "rgba(52,211,153,0.15)",
    items: [
      { en: "Analytics dashboard — export PDF & CSV", fr: "Tableau de bord analytiques — export PDF & CSV", ar: "لوحة تحليلات مع تصدير PDF و CSV" },
      { en: "CRM tools & bulk listing management", fr: "Outils CRM & gestion en masse des annonces", ar: "أدوات CRM وإدارة الإعلانات بالجملة" },
      { en: "Client profiles with instant new-match alerts", fr: "Profils clients avec alertes de nouveaux biens", ar: "ملفات عملاء مع تنبيهات فورية للعقارات المطابقة" },
      { en: "High-priority lead alerts in real time", fr: "Alertes leads haute priorité en temps réel", ar: "تنبيهات فورية للعملاء ذوي الأولوية العالية" },
    ]
  },
  {
    icon: Calendar, key: "visits",
    en: "Bookings & Visits", fr: "Réservations", ar: "الحجوزات",
    color: "#fbbf24", glow: "rgba(251,191,36,0.15)",
    items: [
      { en: "Visit management with availability calendar", fr: "Gestion des visites avec calendrier de dispo", ar: "إدارة الزيارات مع تقويم التوفر" },
      { en: "Multiple visitors per time slot", fr: "Plusieurs visiteurs simultanément par créneau", ar: "عدة زوار في نفس الفترة الزمنية" },
      { en: "Waitlist — buyers queue if property is reserved", fr: "Liste d'attente si le bien est réservé", ar: "قائمة انتظار إذا كان العقار محجوزاً" },
    ]
  },
  {
    icon: Home, key: "rental",
    en: "Landlord & Rental", fr: "Gestion Locative", ar: "إدارة الإيجار",
    color: "#fb923c", glow: "rgba(251,146,60,0.15)",
    items: [
      { en: "Full rental & landlord management tools", fr: "Gestion locative complète pour bailleurs", ar: "أدوات إدارة إيجار متكاملة للملاك" },
      { en: "Tenant payment tracker + PDF receipts", fr: "Suivi paiements locataires + reçus PDF", ar: "متابعة مدفوعات المستأجرين مع مولد وصل PDF" },
      { en: "Renewal reminders 2 months before expiry", fr: "Rappels renouvellement 2 mois avant expiration", ar: "تنبيهات التجديد قبل شهرين من انتهاء العقد" },
      { en: "Rental income dashboard with annual projections", fr: "Tableau de revenus locatifs avec projection annuelle", ar: "لوحة دخل الإيجار مع توقعات الإيرادات السنوية" },
    ]
  },
  {
    icon: Bell, key: "alerts",
    en: "Alerts & Reviews", fr: "Alertes & Avis", ar: "التنبيهات",
    color: "#f87171", glow: "rgba(248,113,113,0.15)",
    items: [
      { en: "Targeted push notifications to matched buyers", fr: "Notifications push acheteurs ciblés", ar: "إشعارات push مستهدفة للمشترين المطابقين" },
      { en: "Email alert on listing approval / rejection", fr: "Email dès qu'une annonce est approuvée / refusée", ar: "بريد إلكتروني فور الموافقة على إعلانك أو رفضه" },
      { en: "Exclusivity conflict alert if your listing is duplicated", fr: "Alerte conflit exclusivité si votre bien est dupliqué", ar: "تنبيه تعارض الحصرية إذا نُشر عقارك في مكان آخر" },
      { en: "Post-deal review system — build your reputation", fr: "Système d'avis post-transaction", ar: "نظام التقييم بعد الصفقة — ابنِ سمعتك العامة" },
    ]
  },
];

export default function PremiumPanel({ lang, user, onClose }) {
  const [plan, setPlan]         = useState("monthly");
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage]   = useState("");
  const [status, setStatus]     = useState("idle");
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

  const cat = CATEGORIES[activeTab];
  const CatIcon = cat.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      dir={isRtl ? "rtl" : "ltr"}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      {/* Panel */}
      <div
        className="relative w-full max-w-3xl max-h-[95vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(145deg, #0f1923 0%, #111827 50%, #0d1520 100%)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #10b981, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", filter: "blur(50px)" }} />

        {/* Top bar */}
        <div className="h-0.5 w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #10b981, #14b8a6, #10b981)" }} />

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-xl tracking-tight">Premium</span>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
              </div>
              <p className="text-slate-500 text-xs">{t("For agencies & professionals", "Pour agences & professionnels", "للوكالات والمحترفين")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main content — flex row on desktop, column on mobile */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden gap-0">

          {/* LEFT: Feature explorer */}
          <div className="flex-1 flex flex-col min-h-0 px-5 pb-4">
            {/* Category tabs — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0 scrollbar-none" style={{ scrollbarWidth: "none" }}>
              {CATEGORIES.map((c, i) => {
                const Icon = c.icon;
                const active = i === activeTab;
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveTab(i)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all border"
                    style={active ? {
                      background: c.glow,
                      borderColor: c.color + "60",
                      color: c.color,
                    } : {
                      background: "transparent",
                      borderColor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    <Icon className="w-3 h-3" style={{ color: active ? c.color : undefined }} />
                    {t(c.en, c.fr, c.ar)}
                  </button>
                );
              })}
            </div>

            {/* Feature list */}
            <div
              className="flex-1 overflow-y-auto mt-3 rounded-2xl p-4 border"
              style={{ background: cat.glow, borderColor: cat.color + "30", minHeight: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cat.color + "25" }}>
                  <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <span className="font-bold text-sm text-white">{t(cat.en, cat.fr, cat.ar)}</span>
              </div>
              <ul className="space-y-2.5">
                {cat.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ background: cat.color + "25" }}>
                      <Check className="w-2.5 h-2.5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-sm text-white/80 leading-snug">{t(item.en, item.fr, item.ar)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-3 flex-shrink-0">
              {CATEGORIES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === activeTab ? 16 : 6,
                    height: 6,
                    background: i === activeTab ? cat.color : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px flex-shrink-0 mx-0" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="md:hidden mx-5 h-px flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />

          {/* RIGHT: Pricing */}
          <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-3 px-5 pb-5 pt-1 md:pt-5">

            {/* Plan toggle */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { key: "monthly", en: "Monthly", fr: "Mensuel", ar: "شهري" },
                { key: "yearly",  en: "Annual",  fr: "Annuel",  ar: "سنوي", badge: "-8%" },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  className="relative flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                  style={plan === p.key ? {
                    background: "linear-gradient(135deg, #10b981, #14b8a6)",
                    color: "#fff",
                    boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                  } : { color: "rgba(255,255,255,0.35)" }}
                >
                  {t(p.en, p.fr, p.ar)}
                  {p.badge && (
                    <span className="absolute -top-2.5 -right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "#f59e0b", color: "#78350f" }}>
                      {p.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Price card */}
            <div className="rounded-2xl p-4 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.05))", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle at 50% 0%, #10b981, transparent 70%)" }} />
              <div className="relative">
                <div className="text-5xl font-black text-white tracking-tight">{fmt(price)}</div>
                <div className="text-emerald-400/70 text-sm font-semibold">DA</div>
                <div className="text-white/40 text-xs mt-1">
                  {plan === "monthly"
                    ? t("/ month", "/ mois", "/ شهر")
                    : <>{t("/ year", "/ an", "/ سنة")} &nbsp;<span className="text-emerald-400 font-bold">{t("1 month free!", "1 mois offert!", "شهر مجاني!")}</span></>
                  }
                </div>
                {plan === "yearly" && (
                  <div className="text-white/30 text-xs mt-0.5">≈ {fmt(Math.round(YEARLY / 12))} DA / {t("month", "mois", "شهر")}</div>
                )}
              </div>
            </div>

            {/* Value props */}
            <div className="space-y-1.5">
              {[
                { en: "All 6 feature categories", fr: "Les 6 catégories incluses", ar: "جميع الفئات الست مشمولة" },
                { en: "Priority support", fr: "Support prioritaire", ar: "دعم ذو أولوية" },
                { en: "Cancel anytime", fr: "Résiliable à tout moment", ar: "إلغاء في أي وقت" },
              ].map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-white/50 text-xs">{t(v.en, v.fr, v.ar)}</span>
                </div>
              ))}
            </div>

            {/* Optional message */}
            {status === "idle" && (
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t("Optional message to admin…", "Message optionnel à l'admin…", "رسالة اختيارية للمسؤول...")}
                rows={2}
                className="w-full text-white text-sm rounded-2xl px-3 py-2.5 resize-none focus:outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}
                onFocus={e => e.target.style.borderColor = "rgba(16,185,129,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            )}

            {/* Status states */}
            {status === "sent" && (
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
                <div className="text-3xl mb-1">✅</div>
                <p className="text-emerald-300 font-bold text-sm">{t("Request sent!", "Demande envoyée!", "تم إرسال الطلب!")}</p>
                <p className="text-white/35 text-xs mt-1">{t("Admin will contact you shortly.", "L'admin vous contactera bientôt.", "سيتواصل معك المسؤول قريبًا.")}</p>
              </div>
            )}
            {status === "already" && (
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <div className="text-3xl mb-1">⏳</div>
                <p className="text-amber-300 font-bold text-sm">{t("Request pending", "Demande en cours", "الطلب قيد المراجعة")}</p>
                <p className="text-white/35 text-xs mt-1">{t("Admin will contact you shortly.", "L'admin vous contactera bientôt.", "سيتواصل معك المسؤول قريبًا.")}</p>
              </div>
            )}

            {(status === "idle" || status === "loading") && (
              <button
                onClick={handleRequest}
                disabled={status === "loading"}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-base text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 25px rgba(16,185,129,0.35)" }}
              >
                {status === "loading"
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <>
                      <Zap className="w-4 h-4" />
                      {t("Request Upgrade", "Demander Premium", "طلب الترقية")}
                      <ArrowRight className="w-4 h-4" />
                    </>
                }
              </button>
            )}

            <p className="text-white/20 text-[10px] text-center">
              {t("Admin reviews & activates manually", "L'admin examine et active manuellement", "يراجع المسؤول ويفعّل يدويًا")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}