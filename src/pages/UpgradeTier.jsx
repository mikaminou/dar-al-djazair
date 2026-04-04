import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../components/LanguageContext";
import { Check, Crown, ArrowRight, Sparkles, Building2, BarChart3, Users, Star, Shield, Zap, MessageSquare, Bell, Eye, FileText, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    key: "monthly",
    en: "Monthly", fr: "Mensuel", ar: "شهري",
    price: 5000,
    period_en: "/ month", period_fr: "/ mois", period_ar: "/ شهر",
    badge: null,
  },
  {
    key: "yearly",
    en: "Annual", fr: "Annuel", ar: "سنوي",
    price: 48000,
    period_en: "/ year", period_fr: "/ an", period_ar: "/ سنة",
    badge: { en: "Save 20%", fr: "Économisez 20%", ar: "وفر 20%" },
  },
];

const FEATURES = [
  {
    icon: Building2,
    en: "Unlimited property listings",
    fr: "Annonces immobilières illimitées",
    ar: "إعلانات عقارية غير محدودة",
  },
  {
    icon: Star,
    en: "Featured & boosted listings",
    fr: "Annonces mises en avant et boostées",
    ar: "إعلانات مميزة ومُعززة",
  },
  {
    icon: BarChart3,
    en: "Advanced analytics dashboard",
    fr: "Tableau de bord analytique avancé",
    ar: "لوحة تحليلات متقدمة",
  },
  {
    icon: Users,
    en: "CRM — client & lead management",
    fr: "CRM — gestion clients et leads",
    ar: "إدارة العملاء والعملاء المحتملين (CRM)",
  },
  {
    icon: Bell,
    en: "Instant lead notifications",
    fr: "Notifications de leads instantanées",
    ar: "إشعارات فورية للعملاء المحتملين",
  },
  {
    icon: Eye,
    en: "Listing views & engagement stats",
    fr: "Vues et statistiques d'engagement",
    ar: "إحصاءات مشاهدات وتفاعل الإعلانات",
  },
  {
    icon: MessageSquare,
    en: "Priority messaging inbox",
    fr: "Messagerie prioritaire",
    ar: "صندوق بريد ذو أولوية",
  },
  {
    icon: Building2,
    en: "Real estate project submissions",
    fr: "Publication de projets immobiliers",
    ar: "نشر المشاريع العقارية",
  },
  {
    icon: FileText,
    en: "Rental contract & tenant management",
    fr: "Gestion des contrats de location et locataires",
    ar: "إدارة عقود الإيجار والمستأجرين",
  },
  {
    icon: Shield,
    en: "Verified professional badge",
    fr: "Badge professionnel vérifié",
    ar: "شارة المحترف الموثق",
  },
  {
    icon: Zap,
    en: "Exclusive mandate tracking",
    fr: "Suivi des mandats exclusifs",
    ar: "تتبع التفويضات الحصرية",
  },
  {
    icon: Headphones,
    en: "Dedicated account support",
    fr: "Support dédié à votre compte",
    ar: "دعم مخصص لحسابك",
  },
];

export default function UpgradeTier() {
  const { lang } = useLang();
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  const isRtl = lang === "ar";
  const t = (en, fr, ar) => lang === "fr" ? fr : lang === "ar" ? ar : en;
  const currentPlan = PLANS.find(p => p.key === selectedPlan);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">

      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 pt-16 pb-24">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            {t("Professional Plan", "Offre Professionnelle", "الباقة الاحترافية")}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {t("Grow Your Real Estate", "Développez votre", "طوّر عملك العقاري")}
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {t("Business", "Business Immobilier", "بشكل احترافي")}
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {t(
              "Everything an agency or developer needs to manage, list, and grow — in one platform.",
              "Tout ce dont une agence ou un promoteur a besoin pour gérer, publier et se développer — en une seule plateforme.",
              "كل ما تحتاجه وكالتك أو شركتك لإدارة ونشر وتنمية أعمالك — في منصة واحدة."
            )}
          </p>
        </div>

        {/* Plan toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/10 border border-white/10 rounded-2xl p-1.5 flex gap-1.5">
            {PLANS.map(plan => (
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

        {/* Pricing card */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-10 shadow-2xl shadow-emerald-500/20 border border-emerald-400/30 mb-10">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-5 py-1 rounded-full flex items-center gap-1.5">
            <Crown className="w-3 h-3" />
            {t("Pro Business", "Pro Business", "حساب احترافي")}
          </div>

          {/* Price */}
          <div className="text-center mb-8 mt-2">
            <div className="flex items-end justify-center gap-2">
              <span className="text-5xl font-extrabold text-white">
                {new Intl.NumberFormat("fr-FR").format(currentPlan.price)}
              </span>
              <span className="text-emerald-200 text-base font-medium mb-2">
                DA {t(currentPlan.period_en, currentPlan.period_fr, currentPlan.period_ar)}
              </span>
            </div>
            {selectedPlan === "yearly" && (
              <p className="text-emerald-200/70 text-sm mt-1">
                ≈ {new Intl.NumberFormat("fr-FR").format(Math.round(48000 / 12))} DA / {t("month", "mois", "شهر")}
              </p>
            )}
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 gap-3 mb-8">
            {FEATURES.map(({ icon: Icon, en, fr, ar }) => (
              <div key={en} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white text-sm">{t(en, fr, ar)}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            className="w-full bg-white text-emerald-700 hover:bg-emerald-50 font-bold gap-2 text-base py-6"
            onClick={() => window.location.href = "/Profile"}
          >
            {t("Upgrade Now", "Passer au Pro", "ترقية الآن")}
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-emerald-200/50 text-xs text-center mt-3">
            {t("Contact us to activate · Flexible billing", "Contactez-nous pour activer · Facturation flexible", "تواصل معنا للتفعيل · فوترة مرنة")}
          </p>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/40 text-xs">
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" />{t("Trusted by 500+ agencies", "Approuvé par 500+ agences", "موثوق من أكثر من 500 وكالة")}</span>
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4" />{t("Algeria's #1 platform", "Plateforme n°1 en Algérie", "المنصة الأولى في الجزائر")}</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" />{t("Instant access", "Accès immédiat", "وصول فوري")}</span>
        </div>
      </div>
    </div>
  );
}