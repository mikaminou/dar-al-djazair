import React from "react";
import { ShieldCheck, BadgeCheck } from "lucide-react";

/**
 * Reusable verified badge.
 * type: "agency" | "individual"
 * size: "xs" (icon only) | "sm" (icon + label) | "md"
 */
export default function VerifiedBadge({ type = "individual", size = "sm", lang }) {
  const isAgency = type === "agency";

  const labels = {
    agency:     { fr: "Agence vérifiée",    en: "Verified Agency",    ar: "وكالة موثّقة"  },
    individual: { fr: "Identité vérifiée",  en: "Verified",           ar: "هوية موثّقة"   },
  };
  const label = labels[isAgency ? "agency" : "individual"]?.[lang] || labels[isAgency ? "agency" : "individual"]?.en;

  const iconCls = isAgency ? "text-blue-600" : "text-emerald-600";
  const badgeCls = isAgency
    ? "bg-blue-50 text-blue-700 border border-blue-200"
    : "bg-emerald-50 text-emerald-700 border border-emerald-200";

  if (size === "xs") {
    return (
      <span title={label} className="inline-flex flex-shrink-0">
        {isAgency
          ? <ShieldCheck className={`w-3.5 h-3.5 ${iconCls}`} />
          : <BadgeCheck  className={`w-3.5 h-3.5 ${iconCls}`} />}
      </span>
    );
  }

  const iconSize = size === "md" ? "w-4 h-4" : "w-3 h-3";
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <span className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${textSize} ${badgeCls}`}>
      {isAgency
        ? <ShieldCheck className={iconSize} />
        : <BadgeCheck  className={iconSize} />}
      {label}
    </span>
  );
}