import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Clock, X, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GLOBAL_ID = "__global__";

// Expand a slot into concrete upcoming {date, start_time, end_time, label} entries
function expandSlot(slot, today, maxDays = 60) {
  const results = [];
  const todayDate = new Date(today + "T00:00:00");
  const limit = new Date(todayDate.getTime() + maxDays * 86400000);

  if (slot.mode === "single" || !slot.mode) {
    if (slot.date && slot.date >= today) {
      results.push({ id: slot.id + "_s", date: slot.date, start_time: slot.start_time, end_time: slot.end_time });
    }
  } else if (slot.mode === "recurring" && slot.recur_day_of_week != null) {
    // Generate next 8 occurrences within maxDays
    const cur = new Date(todayDate);
    let count = 0;
    while (cur <= limit && count < 8) {
      if (cur.getDay() === slot.recur_day_of_week) {
        const d = cur.toISOString().split("T")[0];
        if (d >= today) {
          results.push({ id: slot.id + "_r_" + d, date: d, start_time: slot.start_time, end_time: slot.end_time });
          count++;
        }
      }
      cur.setDate(cur.getDate() + 1);
    }
  } else if (slot.mode === "date_range" && slot.date_range_start && slot.date_range_end) {
    const start = new Date(Math.max(new Date(slot.date_range_start + "T00:00:00"), todayDate));
    const end = new Date(slot.date_range_end + "T00:00:00");
    const cur = new Date(start);
    let count = 0;
    while (cur <= end && cur <= limit && count < 30) {
      const d = cur.toISOString().split("T")[0];
      results.push({ id: slot.id + "_dr_" + d, date: d, start_time: slot.start_time, end_time: slot.end_time });
      cur.setDate(cur.getDate() + 1);
      count++;
    }
  }
  return results;
}

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

      // Fetch only: (1) global slots, (2) slots for this specific listing
      // Slots for other listings are intentionally excluded
      const [globalSlots, listingSlots] = await Promise.all([
        base44.entities.AvailabilitySlot.filter({ agent_email: ownerEmail, listing_id: GLOBAL_ID, is_active: true }, null, 100).catch(() => []),
        thread?.listing_id && thread.listing_id !== GLOBAL_ID
          ? base44.entities.AvailabilitySlot.filter({ agent_email: ownerEmail, listing_id: thread.listing_id, is_active: true }, null, 100).catch(() => [])
          : Promise.resolve([]),
      ]);

      // Also fetch slots with no listing_id set (empty/null = global)
      const noListingSlots = await base44.entities.AvailabilitySlot
        .filter({ agent_email: ownerEmail, is_active: true }, null, 200)
        .then(all => all.filter(s => !s.listing_id || s.listing_id === "" || s.listing_id === GLOBAL_ID))
        .catch(() => []);

      const seen = new Set();
      const allRelevant = [...globalSlots, ...listingSlots, ...noListingSlots].filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return s.is_active !== false;
      });

      // Expand all slots into concrete upcoming dates
      const expanded = allRelevant.flatMap(s => expandSlot(s, today))
        .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));

      setOwnerSlots(expanded);
      if (expanded.length === 0) setMode("manual");
      setLoadingSlots(false);
    }
    fetchSlots();
  }, [ownerEmail, thread?.listing_id]);

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
    title:          { fr: "Proposer un rendez-vous", en: "Propose a visit", ar: "اقتراح موعد زيارة" },
    availableSlots: { fr: "Créneaux disponibles", en: "Available slots", ar: "المواعيد المتاحة" },
    noSlots:        { fr: "Aucun créneau disponible pour ce bien. Proposez une date personnalisée ci-dessous.", en: "No available slots for this property. Propose a custom date below.", ar: "لا توجد مواعيد متاحة لهذا العقار. اقترح تاريخاً مخصصاً أدناه." },
    manual:         { fr: "Date libre", en: "Custom date", ar: "تاريخ مخصص" },
    pickSlot:       { fr: "Créneaux dispo.", en: "Available slots", ar: "مواعيد متاحة" },
    date:           { fr: "Date", en: "Date", ar: "التاريخ" },
    from:           { fr: "Début", en: "From", ar: "من" },
    to:             { fr: "Fin", en: "To", ar: "إلى" },
    note:           { fr: "Note (optionnel)", en: "Note (optional)", ar: "ملاحظة (اختياري)" },
    send:           { fr: "Envoyer la proposition", en: "Send proposal", ar: "إرسال الاقتراح" },
    cancel:         { fr: "Annuler", en: "Cancel", ar: "إلغاء" },
    loading:        { fr: "Chargement…", en: "Loading…", ar: "جار التحميل…" },
    orCustom:       { fr: "ou proposez une autre date", en: "or propose a different time", ar: "أو اقترح وقتاً آخر" },
  };
  const t = k => L[k]?.[lang] || L[k]?.fr;

  const hasSlots = ownerSlots.length > 0;
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

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Loading */}
          {loadingSlots && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          )}

          {!loadingSlots && (
            <>
              {/* Mode tabs — always show if there are slots */}
              {hasSlots && (
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  <button
                    onClick={() => setMode("slot")}
                    className={`flex-1 text-sm py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${mode === "slot" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" /> {t("pickSlot")}
                  </button>
                  <button
                    onClick={() => setMode("manual")}
                    className={`flex-1 text-sm py-2.5 font-medium flex items-center justify-center gap-1.5 transition-colors ${mode === "manual" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <PenLine className="w-3.5 h-3.5" /> {t("manual")}
                  </button>
                </div>
              )}

              {/* No slots message */}
              {!hasSlots && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  {t("noSlots")}
                </div>
              )}

              {/* Slot picker */}
              {mode === "slot" && hasSlots && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t("availableSlots")}</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {ownerSlots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          selectedSlot?.id === slot.id
                            ? "bg-emerald-50 border-emerald-400 shadow-sm"
                            : "bg-gray-50 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${selectedSlot?.id === slot.id ? "bg-emerald-500" : "bg-gray-300"}`} />
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{fmtDate(slot.date)}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {slot.start_time} – {slot.end_time}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
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
            </>
          )}
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