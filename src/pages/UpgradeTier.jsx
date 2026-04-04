import React, { useState } from "react";
import { useLang } from "../components/LanguageContext";
import { Check, Crown, ArrowRight, Sparkles, Shield, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHLY_PRICE = 5500;
const YEARLY_PRICE = MONTHLY_PRICE * 11; // 1 month free

const FREE_FEATURES = [
  { en: "Up to 2 listings (cumulative)", fr: "Jusqu'à 2 annonces (compteur cumulatif)", ar: "حتى إعلانين (عداد تراكمي)" },
  { en: "5 photos per listing", fr: "5 photos par annonce", ar: "5 صور لكل إعلان" },
  { en: "Unique sharing link", fr: "Lien de partage unique", ar: "رابط مشاركة خاص" },
  { en: "View counter", fr: "Compteur de vues", ar: "عداد المشاهدات" },
  { en: "Integrated buyer–seller chat", fr: "Chat intégré acheteur ↔ vendeur", ar: "محادثة مدمجة مشتري ↔ بائع" },
  { en: "Listing status (Active / Reserved / Sold / Rented)", fr: "Statut annonce (Actif / Réservé / Vendu / Loué)", ar: "حالة الإعلان (نشط / محجوز / مباع / مؤجر)" },
  { en: "Search & filters (wilaya, type, price, area)", fr: "Recherche & filtres (wilaya, type, prix, surface)", ar: "بحث وفلاتر (ولاية، نوع، سعر، مساحة)" },
  { en: "Trilingual interface (AR / FR / EN)", fr: "Interface trilingue (AR / FR / EN)", ar: "واجهة ثلاثية اللغات (ع / ف / إ)" },
  { en: "Smart price input (millions DZD / DZD)", fr: "Saisie prix intelligente (millions DZD / DZD)", ar: "إدخال سعر ذكي (ملايين دج / دج)" },
  { en: "Favorites & search history (buyer)", fr: "Favoris & historique de recherche (acheteur)", ar: "المفضلة وسجل البحث (مشتري)" },
];

const PREMIUM_FEATURES = [
  { en: "Everything in Free", fr: "Tout sur Free", ar: "كل ميزات المجاني", highlight: false },
  { en: "Unlimited listings", fr: "Annonces illimitées", ar: "إعلانات غير محدودة", highlight: true },
  { en: "Unlimited photos per listing", fr: "Photos illimitées par annonce", ar: "صور غير محدودة لكل إعلان", highlight: true },
  { en: "Leads & analytics dashboard", fr: "Tableau de bord leads & analytiques", ar: "لوحة إدارة العملاء المحتملين والتحليلات", highlight: true },
  { en: "Social media integration", fr: "Intégration des réseaux sociaux avec le système", ar: "تكامل مع شبكات التواصل الاجتماعي", highlight: false },
  { en: "AI-powered buyer recommendations", fr: "Recommandations IA de clients potentiel", ar: "توصيات مشترين بالذكاء الاصطناعي", highlight: true },
  { en: "Landlord rental management", fr: "Gestion locative bailleur", ar: "إدارة الإيجار للملاك", highlight: false },
  { en: "4h grouped email digest — buyer inquiries", fr: "Digest email groupé 4h — correspondances acheteurs", ar: "ملخص بريدي كل 4 ساعات — طلبات المشترين", highlight: false },
  { en: "Boost & featured placement in results", fr: "Boost & mise en avant dans les résultats", ar: "تعزيز وتصدر نتائج البحث", highlight: true },
  { en: "Verified Partner badge (profile & listings)", fr: "Badge Partenaire Vérifié (profil & annonces)", ar: "شارة الشريك الموثق (الملف والإعلانات)", highlight: false },
  { en: "Buyer / tenant reviews & ratings", fr: "Système d'avis & notes acheteurs/locataires", ar: "تقييمات ومراجعات المشترين والمستأجرين", highlight: false },
  { en: "Bulk listing management", fr: "Gestion en masse des annonces", ar: "إدارة الإعلانات بشكل مجمّع", highlight: false },
  { en: "CRM tools", fr: "Outils CRM", ar: "أدوات CRM", highlight: true },
  { en: "Booking & visit management", fr: "Gestion des réservations et visites", ar: "إدارة الحجوزات والزيارات", highlight: false },
  { en: "Targeted push notifications to buyers (VAPID)", fr: "Notifications push acheteurs ciblés (VAPID)", ar: "إشعارات push مستهدفة للمشترين (VAPID)", highlight: false },
  { en: "🔜 Virtual tour & video support", fr: "🔜 Visite virtuelle & support vidéo", ar: "🔜 جولة افتراضية ودعم الفيديو", highlight: false, soon: true },
  { en: "🔜 Map-based geographic search", fr: "🔜 Recherche géographique sur carte", ar: "🔜 بحث جغرافي على الخريطة", highlight: false, soon: true },
];

export default function UpgradeTier() {
  const { lang } = useLang();
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  const isRtl = lang === "ar";
  const t = (en, fr, ar) => lang === "fr" ? fr : lang === "ar" ? ar : en;

  const price = selectedPlan === "monthly" ? MONTHLY_PRICE : YEARLY_PRICE;
  const periodLabel = selectedPlan === "monthly"
    ? t("/ month", "/ mois", "/ شهر")
    : t("/ year", "/ an", "/ سنة");

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-24">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            {t("Professional Plan — Dar El Djazair", "Offre Professionnelle — Dar El Djazair", "الباقة الاحترافية — دار الجزائر")}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t("Level Up Your", "Propulsez votre", "طوّر عملك")}
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {t("Real Estate Business", "Business Immobilier", "العقاري")}
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {t(
              "The complete toolkit for agencies, developers and professional agents in Algeria.",
              "La boîte à outils complète pour les agences, promoteurs et agents professionnels en Algérie.",
              "مجموعة الأدوات الكاملة للوكالات والمطورين والوكلاء المحترفين في الجزائر."
            )}
          </p>
        </div>

        {/* Plan toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-1.5 flex gap-1.5">
            {[
              { key: "monthly", en: "Monthly", fr: "Mensuel", ar: "شهري", badge: null },
              { key: "yearly", en: "Annual", fr: "Annuel", ar: "سنوي", badge: { en: "1 month free", fr: "1 mois offert", ar: "شهر مجاني" } },
            ].map(plan => (
              <button
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className={`relative px-7 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  selectedPlan === plan.key
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t(plan.en, plan.fr, plan.ar)}
                {plan.badge && (
                  <span className="absolute -top-2.5 -right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {t(plan.badge.en, plan.badge.fr, plan.badge.ar)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Two column: Free vs Premium */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">

          {/* Free */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <p className="text-white/50 text-sm font-bold uppercase tracking-wider mb-1">{t("Free", "Gratuit / مجاني", "مجاني")}</p>
            <p className="text-4xl font-extrabold text-white mb-6">0 <span className="text-lg font-medium text-white/40">DA</span></p>

            <ul className="space-y-3">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-white/60 text-sm">
                  <Check className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                  {t(f.en, f.fr, f.ar)}
                </li>
              ))}
            </ul>

            <div className="mt-8 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-center text-white/40 text-sm">
              {t("Your current plan", "Votre offre actuelle", "خطتك الحالية")}
            </div>
          </div>

          {/* Premium */}
          <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20 border border-emerald-400/30">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-5 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
              <Crown className="w-3 h-3" />
              Premium ★ / مميز
            </div>

            <p className="text-emerald-200 text-sm font-bold uppercase tracking-wider mb-1 mt-2">Premium</p>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-extrabold text-white">
                {new Intl.NumberFormat("fr-FR").format(price)}
              </span>
              <span className="text-emerald-200 text-base font-medium mb-1">DA {periodLabel}</span>
            </div>
            {selectedPlan === "yearly" && (
              <p className="text-emerald-200/70 text-sm mb-6">
                ≈ {new Intl.NumberFormat("fr-FR").format(Math.round(YEARLY_PRICE / 12))} DA / {t("month", "mois", "شهر")} — {t("1 month free!", "1 mois offert !", "شهر مجاني!")}
              </p>
            )}
            {selectedPlan === "monthly" && <div className="mb-6" />}

            <ul className="space-y-3 mb-8">
              {PREMIUM_FEATURES.map((f, i) => (
                <li key={i} className={`flex items-start gap-2.5 text-sm ${f.soon ? "opacity-60" : ""}`}>
                  <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${f.highlight ? "text-amber-300" : "text-emerald-200"}`} />
                  <span className={f.highlight ? "text-white font-semibold" : "text-white/90"}>
                    {t(f.en, f.fr, f.ar)}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold gap-2 text-base py-6"
              onClick={() => window.location.href = "/Profile"}
            >
              {t("Get Premium", "Passer au Premium", "الترقية إلى بريميوم")}
              <ArrowRight className="w-5 h-5" />
            </Button>

            <p className="text-emerald-200/50 text-xs text-center mt-3">
              {t("Contact us to activate · Flexible billing", "Contactez-nous pour activer · Facturation flexible", "تواصل معنا للتفعيل · فوترة مرنة")}
            </p>
          </div>
        </div>

        {/* Footer trust */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-xs">
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" />{t("Trusted platform", "Plateforme de confiance", "منصة موثوقة")}</span>
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4" />{t("Algeria's #1 real estate platform", "Plateforme immobilière n°1 en Algérie", "المنصة العقارية الأولى في الجزائر")}</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" />{t("Instant activation", "Activation instantanée", "تفعيل فوري")}</span>
        </div>
      </div>
    </div>
  );
}