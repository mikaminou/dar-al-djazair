import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OfficeCard from "./OfficeCard";

// Public read-only display of an agency's offices, fetched from the
// AgencyOffice entity. Renders nothing while loading or if the agency
// has no offices.

export default function OfficesDisplay({ agentEmail, lang }) {
  const [offices, setOffices] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!agentEmail) { setLoaded(true); return; }
    base44.entities.AgencyOffice
      .filter({ agent_email: agentEmail }, null, 100)
      .then(data => setOffices(data || []))
      .catch(() => setOffices([]))
      .finally(() => setLoaded(true));
  }, [agentEmail]);

  if (!loaded) return null;
  if (!offices || offices.length === 0) return null;

  const lbl = (en, fr, ar) => lang === "ar" ? ar : lang === "fr" ? fr : en;

  // Primary first, then by display_order (already sorted server-side, kept defensive)
  const sorted = [...offices].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return b.is_primary ? 1 : -1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  return (
    <div className="bg-white dark:bg-[#13161c] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 mb-4">
      <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-emerald-600" />
        {lbl("Our Offices", "Nos bureaux", "مكاتبنا")}
      </h2>
      <div className="space-y-3">
        {sorted.map(office => (
          <OfficeCard
            key={office.id}
            office={office}
            lang={lang}
            editable={false}
            showVerified
          />
        ))}
      </div>
    </div>
  );
}