import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { Check, Star, Zap, Shield, TrendingUp, Users, MessageSquare, Bell, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = {
  free: [
    { en: "Browse all listings", fr: "Parcourir toutes les annonces", ar: "تصفح جميع الإعلانات" },
    { en: "Save up to 5 favorites", fr: "Jusqu'à 5 favoris", ar: "حتى 5 مفضلات" },
    { en: "Basic search filters", fr: "Filtres de recherche basiques", ar: "فلاتر بحث أساسية" },
    { en: "Contact agents", fr: "Contacter les agents", ar: "التواصل مع الوكلاء" },
  ],
  premium: [
    { en: "Everything in Free", fr: "Tout ce qui est inclus dans Gratuit", ar: "كل ما هو مجاني" },
    { en: "Unlimited favorites", fr: "Favoris illimités", ar: "مفضلات غير محدودة" },
    { en: "Advanced filters & alerts", fr: "Filtres avancés et alertes", ar: "فلاتر متقدمة وتنبيهات" },
    { en: "Priority message inbox", fr: "Messagerie prioritaire", ar: "صندوق بريد ذو أولوية" },
    { en: "Instant new listing alerts", fr: "Alertes immédiates de nouvelles annonces", ar: "تنبيهات فورية للإعلانات الجديدة" },
    { en: "Price history & market insights", fr: "Historique des prix et analyses de marché", ar: "تاريخ الأسعار وتحليلات السوق" },
    { en: "Exclusive off-market listings", fr: "Annonces off-market exclusives", ar: "إعلانات حصرية خارج السوق" },
    { en: "Dedicated support", fr: "Support dédié", ar: "دعم مخصص" },
  ],
};

const PLANS = [
  {
    key: "monthly",
    en: "Monthly", fr: "Mensuel", ar: "شهري",
    price: 990,
    period_en: "/ month", period_fr: "/ mois", period_ar: "/ شهر",
    badge: null,
  },
  {
    key: "yearly",
    en: "Annual", fr: "Annuel", ar: "سنوي",
    price: 7900,
    period_en: "/ year", period_fr: "/ an", period_ar: "/ سنة",
    badge: { en: "Save 34%", fr: "Économisez 34%", ar: "وفر 34%" },
  },
];

const PERKS = [
  { icon: Bell, en: "Real-time alerts", fr: "Alertes en temps réel", ar: "تنبيهات فورية" },
  { icon: TrendingUp, en: "Market insights", fr: "Analyses de marché", ar: "تحليلات السوق" },
  { icon: Shield, en: "Verified listings only", fr: "Annonces vérifiées", ar: "إعلانات موثقة فقط" },
  { icon: Users, en: "Priority agent contact", fr: "Contact agent prioritaire", ar: "تواصل أولوي مع الوكلاء" },
  { icon: MessageSquare, en: "Unlimited messaging", fr: "Messagerie illimitée", ar: "مراسلة غير محدودة" },
  { icon: Zap, en: "Instant notifications", fr: "Notifications instantanées", ar: "إشعارات فورية" },
];

export default function UpgradeTier() {
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  useEffect(() => {
    base44.auth.me().catch(() => {}).then(u => u && setUser(u));
  }, []);

  const isRtl = lang === "ar";
  const t = (en, fr, ar) => lang === "fr" ? fr : lang === "ar" ? ar : en;

  const currentPlan = PLANS.find(p => p.key === selectedPlan);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            {t("Dar Al Djazair Premium", "Dar Al Djazair Premium", "دار الجزائر بريميوم")}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t("Find Your Dream Property", "Trouvez le bien de vos rêves", "اعثر على عقار أحلامك")}
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {t("Faster & Smarter", "Plus vite & mieux", "بشكل أسرع وأذكى")}
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {t(
              "Get exclusive access to the best listings, real-time alerts, and market insights.",
              "Accédez en avant-première aux meilleures annonces, alertes en temps réel et analyses de marché.",
              "احصل على وصول حصري لأفضل الإعلانات والتنبيهات الفورية وتحليلات السوق."
            )}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">

        {/* Perks grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
          {PERKS.map(({ icon: Icon, en, fr, ar }) => (
            <div key={en} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-4.5 h-4.5 text-emerald-400 w-5 h-5" />
              </div>
              <span className="text-white/80 text-sm font-medium">{t(en, fr, ar)}</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-1.5 flex gap-1.5">
            {PLANS.map(plan => (
              <button
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  selectedPlan === plan.key
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t(plan.en, plan.fr, plan.ar)}
                {plan.badge && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {t(plan.badge.en, plan.badge.fr, plan.badge.ar)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing card */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">

          {/* Free */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <div className="mb-6">
              <p className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-1">{t("Free", "Gratuit", "مجاني")}</p>
              <p className="text-4xl font-extrabold text-white">0 <span className="text-lg font-medium text-white/40">DA</span></p>
            </div>
            <ul className="space-y-3 mb-8">
              {FEATURES.free.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-white/60 text-sm">
                  <Check className="w-4 h-4 text-white/30 flex-shrink-0" />
                  {t(f.en, f.fr, f.ar)}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full border-white/20 text-white/50 bg-transparent cursor-default" disabled>
              {t("Your current plan", "Votre offre actuelle", "خطتك الحالية")}
            </Button>
          </div>

          {/* Premium */}
          <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 shadow-2xl shadow-emerald-500/20 border border-emerald-400/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1.5">
              <Crown className="w-3 h-3" />
              {t("Most Popular", "Le plus populaire", "الأكثر طلباً")}
            </div>

            <div className="mb-6">
              <p className="text-emerald-200 text-sm font-semibold uppercase tracking-wider mb-1">Premium</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-extrabold text-white">
                  {new Intl.NumberFormat("fr-FR").format(currentPlan.price)}
                </p>
                <span className="text-emerald-200 text-sm font-medium mb-1">DA {t(currentPlan.period_en, currentPlan.period_fr, currentPlan.period_ar)}</span>
              </div>
              {selectedPlan === "yearly" && (
                <p className="text-emerald-200/70 text-xs mt-1">
                  ≈ {new Intl.NumberFormat("fr-FR").format(Math.round(7900 / 12))} DA / {t("month", "mois", "شهر")}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {FEATURES.premium.map((f, i) => (
                <li key={i} className={`flex items-center gap-2.5 text-sm ${i === 0 ? "text-emerald-200/60" : "text-white"}`}>
                  <Check className={`w-4 h-4 flex-shrink-0 ${i === 0 ? "text-emerald-200/40" : "text-emerald-200"}`} />
                  {t(f.en, f.fr, f.ar)}
                </li>
              ))}
            </ul>

            <Button
              className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold gap-2 text-base py-6"
              onClick={() => user ? base44.auth.redirectToLogin() : base44.auth.redirectToLogin()}
            >
              {t("Get Premium", "Passer à Premium", "الترقية إلى بريميوم")}
              <ArrowRight className="w-5 h-5" />
            </Button>

            <p className="text-emerald-200/50 text-xs text-center mt-3">
              {t("Cancel anytime · Secure payment", "Annulation à tout moment · Paiement sécurisé", "إلغاء في أي وقت · دفع آمن")}
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-xs">
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" />{t("Secure & encrypted", "Sécurisé & chiffré", "آمن ومشفر")}</span>
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4" />{t("10,000+ satisfied users", "10 000+ utilisateurs satisfaits", "أكثر من 10,000 مستخدم راضٍ")}</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" />{t("Instant activation", "Activation instantanée", "تفعيل فوري")}</span>
        </div>
      </div>
    </div>
  );
}