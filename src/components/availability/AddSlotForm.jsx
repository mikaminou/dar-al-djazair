import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS_OF_WEEK = {
  en: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  fr: ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"],
  ar: ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
};

const L = {
  addSlot:    { en: "Add a slot", fr: "Ajouter un créneau", ar: "إضافة موعد" },
  single:     { en: "Single date", fr: "Date unique", ar: "تاريخ محدد" },
  recurring:  { en: "Recurring weekly", fr: "Récurrent (hebdo.)", ar: "أسبوعي متكرر" },
  date_range: { en: "Date range", fr: "Plage de dates", ar: "نطاق تواريخ" },
  date:       { en: "Date", fr: "Date", ar: "التاريخ" },
  from:       { en: "From", fr: "Début", ar: "من" },
  to:         { en: "To", fr: "Fin", ar: "إلى" },
  day:        { en: "Day of week", fr: "Jour de la semaine", ar: "اليوم" },
  fromDate:   { en: "Start date", fr: "Date de début", ar: "بداية" },
  toDate:     { en: "End date", fr: "Date de fin", ar: "نهاية" },
  capacity:   { en: "Max visitors (optional)", fr: "Max visiteurs (optionnel)", ar: "أقصى عدد زوار" },
  unlimited:  { en: "Unlimited", fr: "Illimité", ar: "غير محدود" },
  note:       { en: "Note (optional)", fr: "Note (optionnel)", ar: "ملاحظة" },
  property:   { en: "Property (optional)", fr: "Bien immobilier (optionnel)", ar: "العقار (اختياري)" },
  general:    { en: "General — all properties", fr: "Général — tous les biens", ar: "عام — كل العقارات" },
  add:        { en: "Add", fr: "Ajouter", ar: "إضافة" },
};

export default function AddSlotForm({ user, listings, lang, onAdded }) {
  const today = new Date().toISOString().split("T")[0];
  const [mode, setMode] = useState("single");
  const [form, setForm] = useState({
    date: "", start_time: "09:00", end_time: "18:00",
    recur_day_of_week: "6",
    date_range_start: "", date_range_end: "",
    capacity: "", notes: "", listing_id: "__global__",
  });
  const [saving, setSaving] = useState(false);

  const days = DAYS_OF_WEEK[lang] || DAYS_OF_WEEK.en;
  const t = k => L[k]?.[lang] || L[k]?.en;

  const isValid = () => {
    if (mode === "single") return !!form.date;
    if (mode === "date_range") return !!form.date_range_start && !!form.date_range_end;
    return true;
  };

  async function handleAdd() {
    if (!user || !isValid() || saving) return;
    setSaving(true);
    const payload = {
      agent_email: user.email,
      mode,
      start_time: form.start_time,
      end_time: form.end_time,
      listing_id: form.listing_id || "__global__",
      is_active: true,
    };
    if (form.capacity) payload.capacity = Number(form.capacity);
    if (form.notes.trim()) payload.notes = form.notes.trim();
    if (mode === "single") payload.date = form.date;
    else if (mode === "recurring") payload.recur_day_of_week = Number(form.recur_day_of_week);
    else if (mode === "date_range") {
      payload.date_range_start = form.date_range_start;
      payload.date_range_end = form.date_range_end;
    }
    const created = await base44.entities.AvailabilitySlot.create(payload);
    setSaving(false);
    setForm(f => ({ ...f, date: "", date_range_start: "", date_range_end: "", notes: "", capacity: "" }));
    onAdded(created);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-emerald-600" /> {t("addSlot")}
      </h2>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {["single","recurring","date_range"].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 text-xs py-2 px-1 rounded-lg font-medium transition-all ${mode === m ? "bg-white shadow text-emerald-700" : "text-gray-500 hover:text-gray-700"}`}>
            {t(m)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mode === "single" && (
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">{t("date")}</label>
            <Input type="date" value={form.date} min={today}
              onChange={e => setForm(f => ({...f, date: e.target.value}))} className="text-sm" />
          </div>
        )}

        {mode === "recurring" && (
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">{t("day")}</label>
            <Select value={form.recur_day_of_week} onValueChange={v => setForm(f => ({...f, recur_day_of_week: v}))}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {days.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === "date_range" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">{t("fromDate")}</label>
              <Input type="date" value={form.date_range_start} min={today}
                onChange={e => setForm(f => ({...f, date_range_start: e.target.value}))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">{t("toDate")}</label>
              <Input type="date" value={form.date_range_end} min={form.date_range_start || today}
                onChange={e => setForm(f => ({...f, date_range_end: e.target.value}))} className="text-sm" />
            </div>
          </div>
        )}

        {/* Time range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">{t("from")}</label>
            <Input type="time" value={form.start_time}
              onChange={e => setForm(f => ({...f, start_time: e.target.value}))} className="text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">{t("to")}</label>
            <Input type="time" value={form.end_time}
              onChange={e => setForm(f => ({...f, end_time: e.target.value}))} className="text-sm" />
          </div>
        </div>

        {/* Property */}
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">{t("property")}</label>
          <Select value={form.listing_id} onValueChange={v => setForm(f => ({...f, listing_id: v}))}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__global__">{t("general")}</SelectItem>
              {listings.map(l => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Capacity + notes */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">{t("capacity")}</label>
            <Input type="number" min="1" placeholder={t("unlimited")} value={form.capacity}
              onChange={e => setForm(f => ({...f, capacity: e.target.value}))} className="text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">{t("note")}</label>
            <Input placeholder="..." value={form.notes}
              onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="text-sm" />
          </div>
        </div>

        <Button onClick={handleAdd} disabled={saving || !isValid()} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
          <Plus className="w-4 h-4" /> {t("add")}
        </Button>
      </div>
    </div>
  );
}