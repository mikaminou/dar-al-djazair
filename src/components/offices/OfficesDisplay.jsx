import React from "react";
import { Building2 } from "lucide-react";
import OfficeCard from "./OfficeCard";

export default function OfficesDisplay({ offices = [], lang }) {
  if (!offices || offices.length === 0) return null;

  const lbl = (en, fr, ar) => lang === "ar" ? ar : lang === "fr" ? fr : en;

  // Primary first, then rest in order
  const sorted = [...offices].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

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