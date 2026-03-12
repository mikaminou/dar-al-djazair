import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ReviewForm({ reviewedEmail, reviewedName, leadId, listingId, listingTitle, onClose, onSubmitted, lang }) {
  const [rating,    setRating]  = useState(0);
  const [hovered,   setHovered] = useState(0);
  const [comment,   setComment] = useState("");
  const [loading,   setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const T = {
    title:      { fr: "Laisser un avis",         en: "Leave a Review",       ar: "اترك تقييماً"        },
    for:        { fr: "Pour",                    en: "For",                  ar: "عن"                  },
    deal:       { fr: "Annonce",                 en: "Listing",              ar: "الإعلان"             },
    ratingLbl:  { fr: "Votre note",              en: "Your rating",          ar: "تقييمك"              },
    commentLbl: { fr: "Commentaire (optionnel)", en: "Comment (optional)",   ar: "تعليق (اختياري)"    },
    submit:     { fr: "Publier l'avis",          en: "Submit Review",        ar: "نشر التقييم"         },
    done:       { fr: "Merci pour votre avis !", en: "Thank you!",           ar: "شكراً على تقييمك!"  },
    alreadyDone:{ fr: "Vous avez déjà laissé un avis.", en: "You already reviewed this deal.", ar: "لقد قيّمت هذا المعاملة بالفعل." },
    selectStar: { fr: "Veuillez choisir une note.", en: "Please select a rating.", ar: "اختر تقييماً من فضلك." },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  async function submit() {
    if (!rating) return;
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }

    // Deduplication check
    const existing = await base44.entities.Review.filter({ reviewer_email: me.email, lead_id: leadId }, null, 1);
    if (existing.length === 0) {
      await base44.entities.Review.create({
        reviewer_email: me.email,
        reviewer_name:  me.full_name || me.email,
        reviewed_email: reviewedEmail,
        lead_id:        leadId,
        listing_id:     listingId || "",
        listing_title:  listingTitle || "",
        rating,
        comment: comment.trim(),
      });
    }

    setSubmitted(true);
    setLoading(false);
    setTimeout(() => { onSubmitted?.(); onClose?.(); }, 1800);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("for")} <span className="font-semibold text-gray-800">{reviewedName || reviewedEmail?.split("@")[0]}</span>
            </p>
            {listingTitle && (
              <p className="text-xs text-gray-400 mt-0.5">📋 {listingTitle}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-emerald-700 font-semibold text-base">{t("done")}</p>
          </div>
        ) : (
          <>
            {/* Stars */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">{t("ratingLbl")}</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(s)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${s <= (hovered || rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">{t("commentLbl")}</p>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="..."
                className="resize-none"
              />
            </div>

            <Button
              onClick={submit}
              disabled={loading || !rating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 h-10"
            >
              {loading ? "…" : t("submit")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}