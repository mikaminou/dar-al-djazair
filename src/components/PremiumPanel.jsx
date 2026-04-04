import React, { useState, useEffect } from "react";
import { X, Check, Crown, Sparkles, ArrowRight, Loader2, Image, Bot, Users, Calendar, Home, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const MONTHLY = 7500;
const YEARLY  = MONTHLY * 11;

const CATEGORIES = [
  {
    icon: Image,
    en: "Listings & Media", fr: "Annonces & Médias", ar: "الإعلانات والوسائط",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    items: [
      { en: "30 images & 5 videos per listing", fr: "30 photos & 5 vidéos par annonce", ar: "30 صورة و5 فيديوهات لكل إعلان" },
      { en: "Auto-post to all connected social media", fr: "Publication auto sur tous vos réseaux sociaux", ar: "نشر تلقائي على جميع شبكات التواصل" },
      { en: "DAR EL DJAZAIR watermark auto-applied to photos", fr: "Filigrane DAR EL DJAZAIR automatique sur vos photos", ar: "علامة مائية تُضاف تلقائياً على صورك" },
      { en: "Exclusivity protection — single-agency per property", fr: "Protection exclusivité — une seule agence par bien", ar: "حماية الحصرية — وكيل واحد لكل عقار" },
      { en: "Verified Partner badge on profile & all listings", fr: "Badge Partenaire Vérifié sur profil & annonces", ar: "شارة الشريك الموثق على الملف والإعلانات" },
      { en: "Boost & featured placement in search results", fr: "Boost & mise en avant dans les résultats", ar: "تعزيز وتصدر نتائج البحث" },
    ]
  },
  {
    icon: Bot,
    en: "AI & Automation", fr: "IA & Automatisation", ar: "الذكاء الاصطناعي",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    items: [
      { en: "AI chatbot — buyers book & close deals from social media", fr: "Chatbot IA — réservation & closing depuis les réseaux", ar: "چاتبوت ذكي — الحجز وإتمام الصفقات من السوشيال ميديا" },
      { en: "AI-generated leads from buyer behaviour analysis", fr: "Leads générés par IA depuis l'analyse comportementale", ar: "عملاء محتملون بالذكاء الاصطناعي" },
      { en: "Smart user-to-agency matching & redirection", fr: "Redirection intelligente vers votre agence", ar: "توجيه ذكي للمستخدمين نحو وكالتك" },
      { en: "Automated email follow-up sequences per lead status", fr: "Séquences email automatisées par statut de lead", ar: "متابعة بريد إلكتروني تلقائية حسب حالة كل عميل" },
    ]
  },
  {
    icon: Users,
    en: "CRM & Leads", fr: "CRM & Leads", ar: "CRM والعملاء",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    items: [
      { en: "Leads & analytics dashboard — export PDF & CSV", fr: "Tableau de bord leads & analytiques — export PDF & CSV", ar: "لوحة تحليلات وعملاء مع تصدير PDF و CSV" },
      { en: "CRM tools & bulk listing management", fr: "Outils CRM & gestion en masse des annonces", ar: "أدوات CRM وإدارة الإعلانات بالجملة" },
      { en: "Client management with search profiles", fr: "Gestion clients avec profils de recherche", ar: "إدارة العملاء مع ملفات البحث" },
      { en: "Instant alert when a client's profile matches a new listing", fr: "Alerte quand un profil client trouve un nouveau bien", ar: "تنبيه فوري عند تطابق ملف عميل مع عقار جديد" },
      { en: "High-priority lead alerts — notified the moment a lead scores high", fr: "Alertes leads haute priorité en temps réel", ar: "تنبيهات فورية للعملاء ذوي الأولوية العالية" },
    ]
  },
  {
    icon: Calendar,
    en: "Bookings & Visits", fr: "Réservations & Visites", ar: "الحجوزات والزيارات",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    items: [
      { en: "Booking & visit management with availability calendar", fr: "Gestion des réservations avec calendrier de disponibilités", ar: "إدارة الحجوزات مع تقويم التوفر" },
      { en: "Slot capacity — allow multiple visitors per time slot", fr: "Capacité par créneau — plusieurs visiteurs simultanément", ar: "إدارة سعة الفترات — عدة زوار في نفس الوقت" },
      { en: "Waitlist system — buyers queue if property is reserved", fr: "Liste d'attente si le bien est réservé", ar: "قائمة انتظار إذا كان العقار محجوزاً" },
    ]
  },
  {
    icon: Home,
    en: "Landlord & Rental", fr: "Gestion Locative", ar: "إدارة الإيجار",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    items: [
      { en: "Full rental & landlord management tools", fr: "Gestion locative complète pour bailleurs", ar: "أدوات إدارة إيجار متكاملة للملاك" },
      { en: "Tenant payment tracker with PDF receipt generator", fr: "Suivi paiements locataires + générateur de reçus PDF", ar: "متابعة مدفوعات المستأجرين مع مولد وصل PDF" },
      { en: "Renewal reminders — 2 months before tenant period expires", fr: "Rappels de renouvellement 2 mois avant expiration", ar: "تنبيهات التجديد قبل شهرين من انتهاء العقد" },
      { en: "Rental income dashboard with projected annual revenue", fr: "Tableau de revenus locatifs avec projection annuelle", ar: "لوحة دخل الإيجار مع توقعات الإيرادات السنوية" },
    ]
  },
  {
    icon: Bell,
    en: "Notifications & Alerts", fr: "Notifications & Alertes", ar: "الإشعارات والتنبيهات",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    items: [
      { en: "Targeted push notifications to matched buyers (VAPID)", fr: "Notifications push acheteurs ciblés (VAPID)", ar: "إشعارات push مستهدفة للمشترين المطابقين" },
      { en: "Email alert when listing is approved, declined or needs changes", fr: "Email dès qu'une annonce est approuvée, refusée ou modifiée", ar: "بريد إلكتروني فور الموافقة على إعلانك أو رفضه" },
      { en: "Exclusivity conflict alert — notified if your exclusive is listed elsewhere", fr: "Alerte conflit exclusivité si votre bien est publié ailleurs", ar: "تنبيه تعارض الحصرية إذا نُشر عقارك في مكان آخر" },
      { en: "Post-deal review system — build your public reputation", fr: "Système d'avis post-transaction — construisez votre réputation", ar: "نظام التقييم بعد الصفقة — ابنِ سمعتك العامة" },
    ]
  },
];

export default function PremiumPanel({ lang, user, onClose }) {
  const [plan, setPlan]       = useState("monthly");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState("idle");
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir={isRtl ? "rtl" : "ltr"}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-[#111827] to-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top gradient stripe */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-600 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">Premium</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <p className="text-slate-400 text-xs">
                {t("For agencies, developers & agents", "Pour agences, promoteurs & agents", "للوكالات والمطورين والوكلاء")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

          {/* LEFT: Scrollable feature categories */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 border-b md:border-b-0 md:border-r border-white/5">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">
              {t("Everything included", "Tout ce qui est inclus", "كل ما هو مشمول")}
            </p>
            {CATEGORIES.map((cat, ci) => {
              const Icon = cat.icon;
              return (
                <div key={ci}>
                  <div className={`flex items-center gap-2 mb-2 px-2 py-1 rounded-lg w-fit ${cat.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${cat.color}`}>
                      {t(cat.en, cat.fr, cat.ar)}
                    </span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {cat.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{t(item.en, item.fr, item.ar)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Sticky pricing & CTA */}
          <div className="w-full md:w-80 flex-shrink-0 flex flex-col p-6 gap-5 bg-white/[0.02]">

            {/* Section label */}
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
              {t("Choose your plan", "Choisissez votre offre", "اختر خطتك")}
            </p>

            {/* Plan toggle */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1">
              {[
                { key: "monthly", en: "Monthly", fr: "Mensuel", ar: "شهري" },
                { key: "yearly",  en: "Annual",  fr: "Annuel",  ar: "سنوي", badge: "-8%" },
              ].map(p => (
                <button
                  key={p.key}
                  onClick={() => setPlan(p.key)}
                  className={`relative flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    plan === p.key ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t(p.en, p.fr, p.ar)}
                  {p.badge && (
                    <span className="absolute -top-2 -right-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {p.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Price card */}
            <div className="relative bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent pointer-events-none" />
              <div className="relative">
                <div className="text-5xl font-extrabold text-white tracking-tight">
                  {fmt(price)}
                </div>
                <div className="text-white/50 text-sm font-medium mt-1">DA {plan === "monthly"
                  ? t("/ month", "/ mois", "/ شهر")
                  : <>/ {t("year", "an", "سنة")}</>}
                </div>
                {plan === "yearly" && (
                  <>
                    <div className="mt-2 inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full">
                      🎁 {t("1 month free!", "1 mois offert!", "شهر مجاني!")}
                    </div>
                    <div className="text-white/30 text-xs mt-2">≈ {fmt(Math.round(YEARLY / 12))} DA / {t("month", "mois", "شهر")}</div>
                  </>
                )}
              </div>
            </div>

            {/* What you save callout — yearly only */}
            {plan === "yearly" && (
              <div className="flex items-center gap-3 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-amber-300 text-xs font-bold">{t("You save", "Vous économisez", "توفر")}</p>
                  <p className="text-amber-200 text-sm font-extrabold">{fmt(MONTHLY * 12 - YEARLY)} DA / {t("year", "an", "سنة")}</p>
                </div>
              </div>
            )}

            {/* Optional message */}
            {status === "idle" && (
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t("Optional message to admin…", "Message optionnel à l'admin…", "رسالة اختيارية للمسؤول...")}
                rows={2}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 resize-none placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            )}

            {/* Status states */}
            {status === "sent" && (
              <div className="flex-1 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
                <div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-emerald-400 text-xl">✓</span>
                  </div>
                  <p className="text-emerald-300 font-bold text-sm">{t("Request sent!", "Demande envoyée!", "تم إرسال الطلب!")}</p>
                  <p className="text-white/40 text-xs mt-1">{t("Admin will contact you shortly.", "L'admin vous contactera bientôt.", "سيتواصل معك المسؤول قريبًا.")}</p>
                </div>
              </div>
            )}
            {status === "already" && (
              <div className="flex-1 flex items-center justify-center bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center">
                <div>
                  <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-amber-400 text-xl">⏳</span>
                  </div>
                  <p className="text-amber-300 font-bold text-sm">{t("Request pending", "Demande en cours", "الطلب قيد المراجعة")}</p>
                  <p className="text-white/40 text-xs mt-1">{t("Admin will contact you shortly.", "L'admin vous contactera bientôt.", "سيتواصل معك المسؤول قريبًا.")}</p>
                </div>
              </div>
            )}

            {(status === "idle" || status === "loading") && (
              <Button
                onClick={handleRequest}
                disabled={status === "loading"}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold gap-2 py-6 rounded-xl text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {status === "loading"
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <>{t("Request Upgrade", "Demander l'offre Premium", "طلب الترقية")} <ArrowRight className="w-5 h-5" /></>
                }
              </Button>
            )}

            {/* Trust line */}
            <div className="flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-white/5" />
              <p className="text-white/20 text-xs text-center whitespace-nowrap">
                🔒 {t("Admin reviews & activates manually", "L'admin examine et active manuellement", "يراجع المسؤول ويفعّل يدويًا")}
              </p>
              <div className="h-px flex-1 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}