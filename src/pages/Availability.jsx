import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Trash2, Clock, Users, ChevronRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";
import AddSlotForm from "../components/availability/AddSlotForm";

const DAYS = {
  en: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  fr: ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"],
  ar: ["أحد","اثن","ثلا","أرب","خمس","جمع","سبت"],
};

const L = {
  title:      { en: "My Availability", fr: "Mes Disponibilités", ar: "مواعيد الزيارة المتاحة" },
  subtitle:   { en: "Manage your visit slots. Seekers can book from these.", fr: "Gérez vos créneaux. Les visiteurs peuvent réserver.", ar: "أدر مواعيدك. يمكن للزوار الحجز منها." },
  upcoming:   { en: "Upcoming slots", fr: "Créneaux à venir", ar: "المواعيد القادمة" },
  recurring:  { en: "Recurring weekly slots", fr: "Créneaux récurrents", ar: "المواعيد الأسبوعية" },
  dateRange:  { en: "Date range slots", fr: "Plages de dates", ar: "نطاقات التواريخ" },
  past:       { en: "Past", fr: "Passés", ar: "الماضية" },
  noSlots:    { en: "No upcoming slots. Add your first availability!", fr: "Aucun créneau. Ajoutez votre première disponibilité !", ar: "لا توجد مواعيد. أضف موعدك الأول!" },
  delete:     { en: "Delete", fr: "Supprimer", ar: "حذف" },
  capacity:   { en: "capacity", fr: "capacité", ar: "سعة" },
  general:    { en: "All properties", fr: "Tous les biens", ar: "جميع العقارات" },
  appointments: { en: "Upcoming appointments", fr: "Rendez-vous à venir", ar: "المواعيد القادمة" },
  manageAppts:{ en: "Manage Appointments →", fr: "Gérer les rendez-vous →", ar: "إدارة المواعيد ←" },
  recurEvery: { en: "Every", fr: "Chaque", ar: "كل" },
};

export default function AvailabilityPage() {
  const { lang } = useLang();
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [listings, setListings] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }
    setUser(me);
    const [slotsData, appsData, listingsData] = await Promise.all([
      base44.entities.AvailabilitySlot.filter({ agent_email: me.email }, "-created_date", 200).catch(() => []),
      base44.entities.AppointmentProposal.filter({ other_email: me.email, status: "accepted" }, "-created_date", 50).catch(() => []),
      base44.entities.Listing.filter({ created_by: me.email, status: "active" }, "title", 50).catch(() => []),
    ]);
    setSlots(slotsData);
    const today = new Date().toISOString().split("T")[0];
    setAppointments(appsData.filter(a => a.proposed_date >= today));
    setListings(listingsData);
    setLoading(false);
  }

  async function deleteSlot(id) {
    await base44.entities.AvailabilitySlot.delete(id);
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  const t = k => L[k]?.[lang] || L[k]?.en;
  const today = new Date().toISOString().split("T")[0];

  const single    = slots.filter(s => (s.mode === "single" || !s.mode) && s.date);
  const recurring = slots.filter(s => s.mode === "recurring");
  const dateRange = slots.filter(s => s.mode === "date_range");

  const upcoming  = single.filter(s => s.date >= today).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const past      = single.filter(s => s.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const listingTitle = (id) => {
    if (!id || id === "__global__") return t("general");
    const found = listings.find(l => l.id === id);
    return found ? found.title : id;
  };

  const fmtDate = (dateStr) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { weekday: "long", day: "numeric", month: "long" }
    );

  const fmtShortDate = (dateStr) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { day: "numeric", month: "short" }
    );

  const days = DAYS[lang] || DAYS.en;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) { base44.auth.redirectToLogin(); return null; }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-emerald-300" />
              <div>
                <h1 className="text-xl font-bold">{t("title")}</h1>
                <p className="text-emerald-200 text-sm mt-0.5">{t("subtitle")}</p>
              </div>
            </div>
            <Link
              to={createPageUrl("Appointments")}
              className="text-xs text-emerald-200 hover:text-white flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg px-3 py-2 transition-colors"
            >
              {t("manageAppts")} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Upcoming Confirmed Appointments */}
        {appointments.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <h2 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> {t("appointments")}
              <span className="ml-auto text-xs font-normal text-emerald-600">{appointments.length}</span>
            </h2>
            <div className="space-y-2">
              {appointments.map(a => (
                <div key={a.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-emerald-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.listing_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDate(a.proposed_date)} · {a.proposed_start_time}
                      {a.proposed_end_time ? ` – ${a.proposed_end_time}` : ""}
                    </p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs flex-shrink-0">
                    {lang === "ar" ? "مؤكد" : lang === "fr" ? "Confirmé" : "Confirmed"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Slot Form */}
        <AddSlotForm user={user} listings={listings} lang={lang} onAdded={created => setSlots(prev => [created, ...prev])} />

        {/* Recurring Slots */}
        {recurring.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" /> {t("recurring")}
            </h2>
            <div className="space-y-3">
              {recurring.map(slot => (
                <SlotCard key={slot.id} slot={slot} onDelete={deleteSlot} lang={lang}
                  label={`${t("recurEvery")} ${days[slot.recur_day_of_week ?? 0]}`}
                  sublabel={`${slot.start_time} – ${slot.end_time}`}
                  property={listingTitle(slot.listing_id)}
                  type="recurring"
                />
              ))}
            </div>
          </div>
        )}

        {/* Date Range Slots */}
        {dateRange.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" /> {t("dateRange")}
            </h2>
            <div className="space-y-3">
              {dateRange.map(slot => (
                <SlotCard key={slot.id} slot={slot} onDelete={deleteSlot} lang={lang}
                  label={`${fmtShortDate(slot.date_range_start)} → ${fmtShortDate(slot.date_range_end)}`}
                  sublabel={`${slot.start_time} – ${slot.end_time}`}
                  property={listingTitle(slot.listing_id)}
                  type="date_range"
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming single slots */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> {t("upcoming")}
            <span className="text-sm font-normal text-gray-400">({upcoming.length})</span>
          </h2>
          {upcoming.length === 0 && recurring.length === 0 && dateRange.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("noSlots")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(slot => (
                <SlotCard key={slot.id} slot={slot} onDelete={deleteSlot} lang={lang}
                  label={fmtDate(slot.date)}
                  sublabel={`${slot.start_time} – ${slot.end_time}`}
                  property={listingTitle(slot.listing_id)}
                  type="single"
                />
              ))}
            </div>
          )}
        </div>

        {/* Past slots */}
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

function SlotCard({ slot, onDelete, lang, label, sublabel, property, type }) {
  const colors = { recurring: "bg-purple-50 text-purple-600", date_range: "bg-blue-50 text-blue-600", single: "bg-emerald-50 text-emerald-600" };
  const t_cap = { en: "capacity", fr: "capacité", ar: "سعة" };
  const t_gen = { en: "All properties", fr: "Tous les biens", ar: "جميع العقارات" };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${colors[type] || colors.single} flex items-center justify-center flex-shrink-0`}>
          <CalendarDays className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sublabel}</span>
            {slot.capacity && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{slot.capacity} {t_cap[lang] || t_cap.en}</span>}
            {property && <span className="text-gray-400">· {property}</span>}
          </p>
          {slot.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{slot.notes}</p>}
        </div>
      </div>
      <button onClick={() => onDelete(slot.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-2">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}