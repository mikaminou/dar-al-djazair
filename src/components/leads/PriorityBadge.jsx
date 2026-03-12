import React from "react";
import { PRIORITY_CONFIG } from "./leadScoring";

export default function PriorityBadge({ priority, lang, size = "sm" }) {
  const cfg = PRIORITY_CONFIG[priority];
  if (!cfg) return null;
  const label = cfg.label[lang] || cfg.label.en;

  if (size === "xs") {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-medium ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        {label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold ${cfg.color}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {label}
    </span>
  );
}