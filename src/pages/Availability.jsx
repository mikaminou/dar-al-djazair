import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "../components/LanguageContext";

const GLOBAL_ID = "__global__";

export default function AvailabilityPage() {
  const { lang } = useLang();
  const [slots, setSlots] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: "", start_time: "09:00", end_time: "10:00", notes: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }
    setUser(me);
    const data = await base44.entities.AvailabilitySlot.filter(
      { agent_email: me.email, listing_id: GLOBAL_ID }, "date", 200
    ).catch(() => []);
    setSlots(data);
    setLoading(false);
  }

  async function addSlot() {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time || !user) return;
    setAdding(true);
    const created = await base44.entities.AvailabilitySlot.create({
      listing_id: GLOBAL_ID,
      agent_email: user.email,
      date: newSlot.date,
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
      notes: newSlot.notes,
      is_active: true,
    });
    setSlots(prev => [...prev, created].sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time)));
    setNewSlot({ date: "", start_time: "09:00", end_time: "10:00", notes: "" });
    setAdding(false);
  }

  async function deleteSlot(id) {
    await base44.entities.AvailabilitySlot.delete(id);
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  const fmtDate = (dateStr) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    );

  const today = new Date().toISOString().split("T")[0];
  const upcoming = slots.filter(s => s.date >= today);
  const past = slots.filter(s => s.date < today);

  const L = {
    title: { fr: "Mes Disponibilités", en: "My Availability", ar: "مواعيد الزيارة المتاحة" },
    subtitle: { fr: "Ces créneaux sont visibles par les visiteurs lorsqu'ils proposent un rendez-vous.", en: "These slots are visible to visitors when they propose a visit.", ar: "هذه الفترات مرئية للزوار عند اقتراح موعد." },
    addSlot: { fr: "Ajouter un créneau", en: "Add a slot", ar: "إضافة موعد" },
    upcoming: { fr: "Créneaux à venir", en: "Upcoming slots", ar: "المواعيد القادمة" },
    past: { fr: "Passés", en: "Past", ar: "الماضية" },
    noSlots: { fr: "Aucun créneau défini. Ajoutez votre première disponibilité !", en: "No slots yet. Add your first availability!", ar: "لا توجد مواعيد. أضف أول موعد متاح!" },
    add: { fr: "Ajouter", en: "Add", ar: "إضافة" },
    date: { fr: "Date", en: "Date", ar: "التاريخ" },
    from: { fr: "Début", en: "From", ar: "من" },
    to: { fr: "Fin", en: "To", ar: "إلى" },
    note: { fr: "Note (optionnel)", en: "Note (optional)", ar: "ملاحظة (اختياري)" },
  };
  const t = k => L[k]?.[lang] || L[k]?.fr;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    base44.auth.redirectToLogin();
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-emerald-300" />
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-emerald-200 text-sm mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Add Slot Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" /> {t("addSlot")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">{t("date")}</label>
              <Input type="date" value={newSlot.date} min={today}
                onChange={e => setNewSlot(s => ({ ...s, date: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">{t("from")}</label>
              <Input type="time" value={newSlot.start_time}
                onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">{t("to")}</label>
              <Input type="time" value={newSlot.end_time}
                onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))} className="text-sm" />
            </div>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder={t("note")}
              value={newSlot.notes}
              onChange={e => setNewSlot(s => ({ ...s, notes: e.target.value }))}
              className="text-sm flex-1"
            />
            <Button onClick={addSlot} disabled={!newSlot.date || adding} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <Plus className="w-4 h-4" /> {t("add")}
            </Button>
          </div>
        </div>

        {/* Upcoming Slots */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> {t("upcoming")}
            <span className="text-sm font-normal text-gray-400">({upcoming.length})</span>
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noSlots")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(slot => (
                <div key={slot.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{fmtDate(slot.date)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {slot.start_time} – {slot.end_time}
                        {slot.notes && <span className="ml-2 text-gray-400">• {slot.notes}</span>}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => deleteSlot(slot.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Slots */}
        {past.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-500 text-sm mb-2">{t("past")} ({past.length})</h2>
            <div className="space-y-2">
              {past.map(slot => (
                <div key={slot.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between opacity-50">
                  <div>
                    <p className="text-sm text-gray-600">{fmtDate(slot.date)}</p>
                    <p className="text-xs text-gray-400">{slot.start_time} – {slot.end_time}</p>
                  </div>
                  <button onClick={() => deleteSlot(slot.id)} className="p-1 hover:text-red-400 text-gray-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}