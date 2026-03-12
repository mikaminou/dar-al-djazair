import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Plus, Trash2, Clock, CheckCircle, XCircle, ArrowLeft, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";

const STATUS = {
  pending:   { label: { en: "Pending",   fr: "En attente",  ar: "في الانتظار" }, color: "bg-amber-100 text-amber-700" },
  confirmed: { label: { en: "Confirmed", fr: "Confirmé",    ar: "مؤكد"         }, color: "bg-green-100 text-green-700" },
  cancelled: { label: { en: "Cancelled", fr: "Annulé",      ar: "ملغى"         }, color: "bg-red-100 text-red-600"    },
};

export default function AgentAvailabilityPage() {
  const { lang } = useLang();
  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("id");

  const [listing, setListing] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: "", start_time: "09:00", end_time: "10:00", notes: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setUser(me);
    if (!me || !listingId) { setLoading(false); return; }
    const [listingData, slotsData, appsData] = await Promise.all([
      base44.entities.Listing.filter({ id: listingId }).then(r => r[0]).catch(() => null),
      base44.entities.AvailabilitySlot.filter({ listing_id: listingId, agent_email: me.email }, "date", 100).catch(() => []),
      base44.entities.Appointment.filter({ listing_id: listingId, agent_email: me.email }, "-created_date", 100).catch(() => []),
    ]);
    setListing(listingData);
    setSlots(slotsData);
    setAppointments(appsData);
    setLoading(false);
  }

  async function addSlot() {
    if (!newSlot.date || !newSlot.start_time || !newSlot.end_time) return;
    setAdding(true);
    const created = await base44.entities.AvailabilitySlot.create({
      listing_id: listingId,
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

  async function updateAppointmentStatus(id, status) {
    await base44.entities.Appointment.update(id, { status });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  const fmtDate = (dateStr) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
    );

  const today = new Date().toISOString().split("T")[0];
  const upcoming = slots.filter(s => s.date >= today);
  const past = slots.filter(s => s.date < today);

  function slotAppointments(slotId) {
    return appointments.filter(a => a.slot_id === slotId);
  }

  function isBooked(slotId) {
    return appointments.some(a => a.slot_id === slotId && a.status !== "cancelled");
  }

  const T = {
    title:    { en: "Manage Availability", fr: "Gérer les disponibilités", ar: "إدارة المواعيد المتاحة" },
    back:     { en: "Back to listings", fr: "Retour aux annonces", ar: "العودة" },
    addSlot:  { en: "Add Availability Slot", fr: "Ajouter un créneau", ar: "إضافة موعد متاح" },
    upcoming: { en: "Upcoming Slots", fr: "Créneaux à venir", ar: "المواعيد القادمة" },
    past:     { en: "Past Slots", fr: "Créneaux passés", ar: "المواعيد الماضية" },
    noSlots:  { en: "No slots yet. Add your first availability!", fr: "Aucun créneau. Ajoutez votre première disponibilité !", ar: "لا توجد مواعيد بعد. أضف أول موعد!" },
    booked:   { en: "Booked", fr: "Réservé", ar: "محجوز" },
    free:     { en: "Available", fr: "Disponible", ar: "متاح" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to={createPageUrl("MyListings")} className="flex items-center gap-2 text-emerald-200 hover:text-white text-sm mb-3 w-fit">
            <ArrowLeft className="w-4 h-4" /> {t("back")}
          </Link>
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-emerald-300" />
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              {listing && <p className="text-emerald-200 text-sm truncate max-w-xs">{listing.title}</p>}
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
              <label className="text-xs text-gray-500 font-medium block mb-1">{lang === "ar" ? "التاريخ" : lang === "fr" ? "Date" : "Date"}</label>
              <Input
                type="date"
                value={newSlot.date}
                min={today}
                onChange={e => setNewSlot(s => ({ ...s, date: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">{lang === "ar" ? "من" : lang === "fr" ? "Début" : "From"}</label>
              <Input
                type="time"
                value={newSlot.start_time}
                onChange={e => setNewSlot(s => ({ ...s, start_time: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">{lang === "ar" ? "إلى" : lang === "fr" ? "Fin" : "To"}</label>
              <Input
                type="time"
                value={newSlot.end_time}
                onChange={e => setNewSlot(s => ({ ...s, end_time: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Input
              placeholder={lang === "ar" ? "ملاحظة (اختياري)" : lang === "fr" ? "Note (optionnel)" : "Note (optional)"}
              value={newSlot.notes}
              onChange={e => setNewSlot(s => ({ ...s, notes: e.target.value }))}
              className="text-sm flex-1"
            />
            <Button
              onClick={addSlot}
              disabled={!newSlot.date || adding}
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <Plus className="w-4 h-4" /> {lang === "ar" ? "إضافة" : lang === "fr" ? "Ajouter" : "Add"}
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
              {upcoming.map(slot => {
                const slotApps = slotAppointments(slot.id);
                const booked = isBooked(slot.id);
                return (
                  <div key={slot.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${booked ? "border-emerald-200" : "border-gray-100"}`}>
                    <div className={`flex items-center justify-between px-5 py-4 ${booked ? "bg-emerald-50" : "bg-white"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${booked ? "bg-emerald-100" : "bg-gray-100"}`}>
                          <CalendarDays className={`w-5 h-5 ${booked ? "text-emerald-600" : "text-gray-400"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{fmtDate(slot.date)}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {slot.start_time} – {slot.end_time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={booked ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                          {booked ? t("booked") : t("free")}
                        </Badge>
                        {!booked && (
                          <button onClick={() => deleteSlot(slot.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {slotApps.length > 0 && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {slotApps.map(app => (
                          <div key={app.id} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-gray-800">{app.buyer_name}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {app.buyer_email && (
                                    <a href={`mailto:${app.buyer_email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                      <Mail className="w-3 h-3" /> {app.buyer_email}
                                    </a>
                                  )}
                                  {app.buyer_phone && (
                                    <a href={`tel:${app.buyer_phone}`} className="text-xs text-emerald-600 flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> {app.buyer_phone}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={STATUS[app.status]?.color}>{STATUS[app.status]?.label[lang]}</Badge>
                              {app.status === "pending" && (
                                <>
                                  <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => updateAppointmentStatus(app.id, "confirmed")}>
                                    <CheckCircle className="w-3 h-3" /> {lang === "fr" ? "Confirmer" : lang === "ar" ? "تأكيد" : "Confirm"}
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50"
                                    onClick={() => updateAppointmentStatus(app.id, "cancelled")}>
                                    <XCircle className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past Slots (collapsed summary) */}
        {past.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-500 text-sm mb-2 flex items-center gap-2">
              {t("past")} ({past.length})
            </h2>
            <div className="space-y-2">
              {past.map(slot => {
                const slotApps = slotAppointments(slot.id);
                return (
                  <div key={slot.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between opacity-60">
                    <div>
                      <p className="text-sm text-gray-600">{fmtDate(slot.date)}</p>
                      <p className="text-xs text-gray-400">{slot.start_time} – {slot.end_time}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {slotApps.length > 0 && <span>{slotApps.length} {lang === "ar" ? "حجز" : lang === "fr" ? "réserv." : "booking(s)"}</span>}
                      <button onClick={() => deleteSlot(slot.id)} className="p-1 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}