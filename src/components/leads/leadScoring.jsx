/**
 * Lead Priority Scoring
 *
 * Signals used:
 *  - Status progression  (contacted=+1, viewing=+2, won=+4)
 *  - Messages sent by the seeker about the listing (+1 each, max 4)
 *  - Viewing appointment booked (+2)
 *  - Listing favorited by the seeker (+1)
 *  - Recency — lead created within last 7 days (+1)
 *  - Financial state — buyer's funding readiness (see FINANCIAL_STATE_SCORE below)
 *
 * Score → priority:
 *  High   ≥ 6
 *  Medium ≥ 3
 *  Low    < 3
 */

/**
 * Financial state bonus points.
 * Adjust these weights here to recalibrate scoring globally.
 *
 *  cash         → +3  (cash buyer — highest buying intent)
 *  pre_approved → +2  (pre-approved loan — strong signal)
 *  arranging    → +1  (still arranging financing — moderate signal)
 *  unspecified  → +0  (no information provided — no bonus)
 */
export const FINANCIAL_STATE_SCORE = {
  cash:         3,
  pre_approved: 2,
  arranging:    1,
  unspecified:  0,
};

export const FINANCIAL_STATE_LABELS = {
  cash:         { en: "Cash buyer",              fr: "Achat comptant",          ar: "شراء نقدي"            },
  pre_approved: { en: "Pre-approved loan",        fr: "Crédit pré-approuvé",     ar: "قرض معتمد مسبقاً"    },
  arranging:    { en: "Still arranging financing",fr: "Financement en cours",    ar: "تمويل قيد الترتيب"   },
  unspecified:  { en: "Unspecified",              fr: "Non précisé",             ar: "غير محدد"             },
};

export function computePriority(lead, { messageCount = 0, hasAppointment = false, hasFavorite = false }) {
  let score = 0;

  // Status progression
  const statusScore = { new: 0, contacted: 1, viewing: 2, won: 4, lost: 0, closed: 0 };
  score += statusScore[lead.status] ?? 0;

  // Engagement signals
  score += Math.min(messageCount, 4);
  if (hasAppointment) score += 2;
  if (hasFavorite)    score += 1;

  // Recency bonus
  const daysSince = (Date.now() - new Date(lead.created_date).getTime()) / 86_400_000;
  if (daysSince <= 7) score += 1;

  // Financial state bonus (from search_filters or top-level field)
  const fsKey = lead.search_filters?.financial_state || "unspecified";
  score += FINANCIAL_STATE_SCORE[fsKey] ?? 0;

  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export const PRIORITY_CONFIG = {
  high:   { label: { en: "High",   fr: "Élevé",  ar: "عالي"  }, color: "bg-red-100 text-red-700 border-red-200",    dot: "bg-red-500"    },
  medium: { label: { en: "Medium", fr: "Moyen",  ar: "متوسط" }, color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  low:    { label: { en: "Low",    fr: "Faible", ar: "منخفض" }, color: "bg-gray-100 text-gray-500 border-gray-200",  dot: "bg-gray-400"   },
};