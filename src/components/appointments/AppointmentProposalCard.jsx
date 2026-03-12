import React from "react";
import { CalendarDays, Clock, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES = {
  pending: "bg-amber-50 border-amber-200",
  accepted: "bg-green-50 border-green-200",
  declined: "bg-red-50 border-red-200",
};

const STATUS_LABELS = {
  pending: { fr: "En attente", en: "Pending", ar: "في الانتظار" },
  accepted: { fr: "Confirmé", en: "Confirmed", ar: "مؤكد" },
  declined: { fr: "Refusé", en: "Declined", ar: "مرفوض" },
};

const STATUS_BADGE = {
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-600",
  pending: "bg-amber-100 text-amber-700",
};

export default function AppointmentProposalCard({ proposal, currentUserEmail, onAccept, onDecline, onCounter, lang = "fr" }) {
  const isMyProposal = proposal.proposer_email === currentUserEmail;
  const isPending = proposal.status === "pending";
  const canAct = isPending && !isMyProposal;
  const isWaiting = isPending && isMyProposal;

  const fmtDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    );
  };

  const L = {
    proposal: { fr: "Proposition de visite", en: "Visit Proposal", ar: "اقتراح موعد زيارة" },
    accept: { fr: "Accepter", en: "Accept", ar: "قبول" },
    decline: { fr: "Refuser", en: "Decline", ar: "رفض" },
    counter: { fr: "Autre date", en: "Another date", ar: "تاريخ آخر" },
    waiting: { fr: "En attente de réponse…", en: "Waiting for response…", ar: "في انتظار الرد…" },
    you: { fr: "Vous", en: "You", ar: "أنت" },
    proposedBy: { fr: "Proposé par", en: "Proposed by", ar: "مقترح من" },
  };
  const t = k => L[k]?.[lang] || L[k]?.fr;

  return (
    <div className={`rounded-2xl border p-4 w-72 shadow-sm ${STATUS_STYLES[proposal.status] || "bg-white border-gray-200"}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-800">{t("proposal")}</p>
          <p className="text-xs text-gray-500 truncate">
            {t("proposedBy")}: {isMyProposal ? t("you") : (proposal.proposer_name || proposal.proposer_email?.split("@")[0])}
          </p>
        </div>
        <Badge className={STATUS_BADGE[proposal.status] || "bg-gray-100 text-gray-500"}>
          {STATUS_LABELS[proposal.status]?.[lang] || STATUS_LABELS[proposal.status]?.fr}
        </Badge>
      </div>

      <div className="bg-white/70 rounded-xl px-4 py-3 mb-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CalendarDays className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="font-medium">{fmtDate(proposal.proposed_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{proposal.proposed_start_time}{proposal.proposed_end_time ? ` – ${proposal.proposed_end_time}` : ""}</span>
        </div>
        {proposal.notes && (
          <p className="text-xs text-gray-500 italic mt-1">{proposal.notes}</p>
        )}
      </div>

      {canAct && (
        <div className="space-y-2">
          <Button onClick={onAccept} className="w-full bg-emerald-600 hover:bg-emerald-700 h-8 text-xs gap-1.5">
            <Check className="w-3.5 h-3.5" /> {t("accept")}
          </Button>
          <div className="flex gap-2">
            <Button onClick={onDecline} variant="outline" className="flex-1 h-8 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50">
              <X className="w-3.5 h-3.5" /> {t("decline")}
            </Button>
            <Button onClick={onCounter} variant="outline" className="flex-1 h-8 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
              <RefreshCw className="w-3.5 h-3.5" /> {t("counter")}
            </Button>
          </div>
        </div>
      )}

      {isWaiting && (
        <p className="text-xs text-center text-gray-400 italic">{t("waiting")}</p>
      )}
    </div>
  );
}