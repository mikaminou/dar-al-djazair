import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GLOBAL_ID = "__global__";

export default function ProposeAppointmentModal({ thread, currentUser, ownerEmail, lang = "fr", onClose, onPropose }) {
  const [ownerSlots, setOwnerSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [manualDate, setManualDate] = useState("");
  const [manualStart, setManualStart] = useState("10:00");
  const [manualEnd, setManualEnd] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState("slot");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function fetchSlots() {
      setLoadingSlots(true);
      if (!ownerEmail) { setMode("manual"); setLoadingSlots(false); return; }
      const slots = await base44.entities.AvailabilitySlot.filter(
        { agent_email: ownerEmail, listing_id: GLOBAL_ID },
        "date", 100
      ).catch(() => []);
      const future = slots.filter(s => s.date >= today && s.is_active !== false);
      setOwnerSlots(future);
      if (future.length === 0) setMode("manual");
      setLoadingSlots(false);
    }
    fetchSlots();
  }, [ownerEmail]);

  async function submit() {
    let date, start, end;
    if (mode === "slot" && selectedSlot) {
      date = selectedSlot.date;
      start = selectedSlot.start_time;
      end = selectedSlot.end_time;
    } else {
      date = manualDate;
      start = manualStart;
      end = manualEnd;
    }
    if (!date || !start) return;
    setSubmitting(true);
    await onPropose({ date, start_time: start, end_time: end, notes });
    setSubmitting(false);
  }

  const fmtDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { weekday: "short", day: "numeric", month: "short" }
    );
  };

  const L = {
    title: { fr: "Proposer un rendez-vous", en: "Propose a visit", ar: "اقتراح موعد زيارة" },
    availableSlots: { fr: "Créneaux disponibles du propriétaire", en: "Owner's available slots", ar: "المواعيد المتاحة" },
    noSlots: { fr: "Aucun créneau défini. Entrez une date manuellement.", en: "No slots available. Enter a date manually.", ar: "لا توجد مواعيد. أدخل تاريخاً يدوياً." },
    manual: { fr: "Date libre", en: "Custom date", ar: "تاريخ مخصص" },
    pickSlot: { fr: "Créneaux dispo.", en: "Available slots", ar: "مواعيد متاحة" },
    date: { fr: "Date", en: "Date", ar: "التاريخ" },
    from: { fr: "Début", en: "From", ar: "من" },
    to: { fr: "Fin", en: "To", ar: "إلى" },
    note: { fr: "Note (optionnel)", en: "Note (optional)", ar: "ملاحظة (اختياري)" },
    send: { fr: "Envoyer la proposition", en: "Send proposal", ar: "إرسال الاقتراح" },
    cancel: { fr: "Annuler", en: "Cancel", ar: "إلغاء" },
    loading: { fr: "Chargement…", en: "Loading…", ar: "جار التحميل…" },
  };
  const t = k => L[k]?.[lang] || L[k]?.fr;

  const canSubmit = mode === "slot" ? !!selectedSlot : (!!manualDate && !!manualStart);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-200" />
            <h2 className="font-bold">{t("title")}</h2>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Mode tabs — only show if there are slots */}
          {!loadingSlots && ownerSlots.length > 0 && (
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button
                onClick={() => setMode("slot")}
                className={`flex-1 text-sm py-2 font-medium transition-colors ${mode === "slot" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                {t("pickSlot")}
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 text-sm py-2 font-medium transition-colors ${mode === "manual" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                {t("manual")}
              </button>
            </div>
          )}

          {/* Slot picker */}
          {mode === "slot" && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t("availableSlots")}</p>
              {loadingSlots ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                </div>
              ) : ownerSlots.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">{t("noSlots")}</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {ownerSlots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selectedSlot?.id === slot.id
                          ? "bg-emerald-50 border-emerald-400 shadow-sm"
                          : "bg-gray-50 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CalendarDays className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-gray-800">{fmtDate(slot.date)}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {slot.start_time} – {slot.end_time}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual date */}
          {mode === "manual" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">{t("date")}</label>
                <Input type="date" value={manualDate} min={today} onChange={e => setManualDate(e.target.value)} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">{t("from")}</label>
                  <Input type="time" value={manualStart} onChange={e => setManualStart(e.target.value)} className="text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">{t("to")}</label>
                  <Input type="time" value={manualEnd} onChange={e => setManualEnd(e.target.value)} className="text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">{t("note")}</label>
            <Input
              placeholder={t("note")}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">{t("cancel")}</Button>
          <Button
            onClick={submit}
            disabled={!canSubmit || submitting || loadingSlots}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <CalendarDays className="w-4 h-4" /> {t("send")}
          </Button>
        </div>
      </div>
    </div>
  );
}