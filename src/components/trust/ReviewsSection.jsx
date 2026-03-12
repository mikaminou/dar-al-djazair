import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, MessageSquare } from "lucide-react";

function Stars({ rating, size = "sm" }) {
  const cls = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`${cls} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function ReviewsSection({ userEmail, lang }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Review
      .filter({ reviewed_email: userEmail }, "-created_date", 50)
      .then(setReviews)
      .finally(() => setLoading(false));
  }, [userEmail]);

  if (loading || reviews.length === 0) return null;

  const avg = (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1);

  const T = {
    title:     { fr: "Avis clients",       en: "Reviews",         ar: "تقييمات العملاء" },
    avgRating: { fr: "Note moyenne",       en: "Average rating",  ar: "متوسط التقييم"   },
    noComment: { fr: "Aucun commentaire.", en: "No comment.",     ar: "لا يوجد تعليق."  },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-500" />
          {t("title")}
          <span className="text-sm font-normal text-gray-400">({reviews.length})</span>
        </h2>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
          <Stars rating={Math.round(parseFloat(avg))} size="md" />
          <span className="font-bold text-amber-700">{avg}</span>
          <span className="text-xs text-amber-600">{t("avgRating")}</span>
        </div>
      </div>

      <div className="grid gap-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm text-gray-800">
                    {r.reviewer_name || r.reviewer_email?.split("@")[0]}
                  </span>
                  <Stars rating={r.rating} />
                </div>
                {r.listing_title && (
                  <p className="text-xs text-gray-400 mb-1.5">📋 {r.listing_title}</p>
                )}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {r.comment
                    ? <em>"{r.comment}"</em>
                    : <span className="text-gray-400 italic">{t("noComment")}</span>}
                </p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                {new Date(r.created_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}