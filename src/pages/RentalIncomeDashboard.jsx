import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { DollarSign } from "lucide-react";
import ExportButton from "../components/ExportButton";
import RentalIncomeKPIs from "../components/analytics/RentalIncomeKPIs";
import IncomeByProperty from "../components/analytics/IncomeByProperty";
import IncomeMonthlyChart from "../components/analytics/IncomeMonthlyChart";
import ProjectedRevenue from "../components/analytics/ProjectedRevenue";
import IncomeTrendsChart from "../components/analytics/IncomeTrendsChart";

export default function RentalIncomeDashboard() {
  const { lang } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      setLoading(false);
      return;
    }

    const [tenants, payments, listings] = await Promise.all([
      base44.entities.Tenant.filter({ landlord_email: me.email }, "-created_date", 500),
      base44.entities.TenantPayment.filter({ landlord_email: me.email }, "-payment_date", 1000),
      base44.entities.Listing.filter({ created_by: me.email }, "-created_date", 500),
    ]);

    setData({ tenants, payments, listings, me });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.me) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">{lang === "ar" ? "يرجى تسجيل الدخول" : lang === "fr" ? "Veuillez vous connecter" : "Please sign in"}</p>
      </div>
    );
  }

  if (data.me.role !== "professional" && data.me.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {lang === "ar" ? "متاح للمحترفين فقط" : lang === "fr" ? "Réservé aux professionnels" : "Professionals Only"}
          </h2>
          <p className="text-gray-500 text-sm">
            {lang === "ar" ? "هذه الصفحة متاحة فقط للمحترفين العقاريين الموثقين." : lang === "fr" ? "Cette page est réservée aux professionnels immobiliers vérifiés." : "This page is only available to verified real estate professionals."}
          </p>
        </div>
      </div>
    );
  }

  // Process data
  const T = {
    title: { en: "Rental Income Dashboard", fr: "Tableau de Bord de Revenus Locatifs", ar: "لوحة دخل الإيجار" },
    subtitle: { en: "Track rental income and projections", fr: "Suivez vos revenus locatifs", ar: "تتبع دخل الإيجار" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  // Aggregate income by property
  const propertyIncomeMap = {};
  data.payments.forEach(payment => {
    const tenant = data.tenants.find(t => t.id === payment.tenant_id);
    if (tenant) {
      const key = tenant.listing_id;
      if (!propertyIncomeMap[key]) {
        propertyIncomeMap[key] = {
          listing_id: tenant.listing_id,
          property_address: tenant.property_address,
          totalIncome: 0,
          payments: [],
          activeTenant: null,
        };
      }
      propertyIncomeMap[key].totalIncome += payment.amount;
      propertyIncomeMap[key].payments.push(payment);
    }
  });

  // Add active tenant info
  data.tenants.forEach(tenant => {
    if (tenant.status === "active" && propertyIncomeMap[tenant.listing_id]) {
      propertyIncomeMap[tenant.listing_id].activeTenant = tenant;
    }
  });

  const propertiesData = Object.values(propertyIncomeMap);
  const totalRentalIncome = data.payments.reduce((sum, p) => sum + p.amount, 0);

  // Monthly chart data
  const monthlyMap = {};
  data.payments.forEach(payment => {
    const tenant = data.tenants.find(t => t.id === payment.tenant_id);
    if (tenant) {
      const date = new Date(payment.payment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = {};
      if (!monthlyMap[monthKey][tenant.property_address]) monthlyMap[monthKey][tenant.property_address] = 0;
      monthlyMap[monthKey][tenant.property_address] += payment.amount;
    }
  });

  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, properties]) => ({
      month: month.split("-")[1] + "/" + month.split("-")[0].slice(-2),
      ...properties,
      total: Object.values(properties).reduce((sum, v) => sum + v, 0),
    }));

  // Projected revenue (next 12 months from today)
  const now = new Date();
  const next12MonthsEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  let projectedTotal = 0;
  const projectedProperties = data.tenants
    .filter(t => t.status === "active" && new Date(t.period_end_date) > now)
    .map(tenant => {
      const rentPerMonth = tenant.rent_amount / (tenant.period_months || 1);
      const months = Math.min(
        12,
        Math.max(1, Math.ceil((new Date(tenant.period_end_date) - now) / (1000 * 60 * 60 * 24 * 30)))
      );
      const projected = rentPerMonth * months;
      projectedTotal += projected;
      return {
        listing_id: tenant.listing_id,
        property_address: tenant.property_address,
        tenant_name: tenant.tenant_name,
        period_end_date: tenant.period_end_date,
        projectedIncome: Math.round(projected),
      };
    });

  const projections = {
    total: Math.round(projectedTotal),
    properties: projectedProperties,
  };

  // Trends data (last 12 months)
  const trendsMap = {};
  data.payments.forEach(payment => {
    const date = new Date(payment.payment_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!trendsMap[monthKey]) trendsMap[monthKey] = 0;
    trendsMap[monthKey] += payment.amount;
  });

  const trendsData = Object.entries(trendsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, income]) => ({
      month: month.split("-")[1] + "/" + month.split("-")[0].slice(-2),
      income,
    }));

  const avgIncome = trendsData.length > 0 ? trendsData.reduce((sum, d) => sum + d.income, 0) / trendsData.length : 0;
  let growthRate = null;
  if (trendsData.length >= 12) {
    const first = trendsData[0].income;
    const last = trendsData[trendsData.length - 1].income;
    growthRate = ((last - first) / first) * 100;
  }

  // Count at-risk properties
  const atRiskCount = data.tenants.filter(t => {
    if (t.status !== "active") return false;
    const daysLeft = Math.ceil((new Date(t.period_end_date) - now) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 90;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-emerald-300" />
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-emerald-200 text-sm">{t("subtitle")}</p>
          </div>
          </div>
          <ExportButton type="rental" data={data} lang={lang} />
        </div>
      </div>

      <div id="rental-dashboard-content" className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <RentalIncomeKPIs
          totalIncome={totalRentalIncome}
          projectedAnnual={projections.total}
          propertyCount={propertiesData.length}
          atRiskCount={atRiskCount}
          lang={lang}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <IncomeByProperty properties={propertiesData} lang={lang} />
          <div>
            <IncomeMonthlyChart data={monthlyData} lang={lang} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ProjectedRevenue projections={projections} lang={lang} />
          <IncomeTrendsChart data={trendsData} avgIncome={avgIncome} growthRate={growthRate} lang={lang} />
        </div>
      </div>
    </div>
  );
}