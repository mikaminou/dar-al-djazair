import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "../LanguageContext";

export default function BookingWidget({ listingId, agentEmail, listing, user }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState([]);
  const [bookedSlotIds, setBookedSlotIds] = useState(new Set());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open && !loaded) loadSlots();
  }, [open]);

  useEffect(() => {
    if (user?.full_name) setForm(f => ({ ...f, name: user.full_name }));
  }, [user]);

  async function loadSlots() {
    const today = new Date().toISOString().split("T")[0];
    const [slotsData, appsData] = await Promise.all([
      base44.entities.AvailabilitySlot.filter({ listing_id: listingId, is_active: true }, "date", 30).catch(() => []),
      base44.entities.Appointment.filter({ listing_id: listingId }, "-created_date", 100).catch(() => []),
    ]);
    setSlots(slotsData.filter(s => s.date >= today));
    setBookedSlotIds(new Set(appsData.filter(a => a.status !== "cancelled").map(a => a.slot_id)));
    setLoaded(true);
  }

  async function confirmBooking() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    const buyerEmail = user?.email || "";

    await base44.entities.Appointment.create({
      slot_id: selectedSlot.id,
      listing_id: listingId,
      listing_title: listing?.title || "",
      agent_email: agentEmail,
      buyer_email: buyerEmail,
      buyer_name: form.name,
      buyer_phone: form.phone,
      date: selectedSlot.date,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      status: "pending",
    });

    // Link to Lead: update existing or create new with "viewing" status
    if (buyerEmail && agentEmail) {
      const existing = await base44.entities.Lead.filter({ listing_id: listingId, seeker_email: buyerEmail }).catch(() => []);
      if (existing.length > 0) {
        await base44.entities.Lead.update(existing[0].id, { status: "viewing" });
      } else {
        await base44.entities.Lead.create({
          listing_id: listingId,
          listing_title: listing?.title || "",
          listing_wilaya: listing?.wilaya || "",
          agent_email: agentEmail,
          seeker_email: buyerEmail,
          status: "viewing",
        });
      }
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  // Don't show for the listing owner
  if (user?.email === agentEmail) return null;

  // Anonymous users: show login prompt instead of booking widget
  if (!user) return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button
        onClick={() => base44.auth.redirectToLogin(window.location.href)}
        className="w-full flex items-center justify-between text-sm font-semibold text-emerald-700 hover:text-emerald-800 py-1"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {lang === "ar" ? "سجّل دخول لحجز زيارة" : lang === "fr" ? "Connectez-vous pour réserver une visite" : "Sign in to book a viewing"}
        </span>
      </button>
    </div>
  );

  const availableSlots = slots.filter(s => !bookedSlotIds.has(s.id));

  const fmtDate = (dateStr) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { weekday: "short", day: "numeric", month: "short" }
    );

  const labels = {
    btn:     { en: "Book a Viewing", fr: "Réserver une visite", ar: "احجز زيارة" },
    pick:    { en: "Select a slot", fr: "Choisissez un créneau", ar: "اختر موعداً" },
    none:    { en: "No slots available", fr: "Aucun créneau disponible", ar: "لا توجد مواعيد متاحة" },
    name:    { en: "Your name *", fr: "Votre nom *", ar: "اسمك *" },
    phone:   { en: "Phone number", fr: "Téléphone", ar: "رقم الهاتف" },
    confirm: { en: "Confirm Booking", fr: "Confirmer", ar: "تأكيد الحجز" },
    back:    { en: "Back", fr: "Retour", ar: "رجوع" },
    done:    { en: "Appointment booked!", fr: "Rendez-vous confirmé !", ar: "تم حجز الموعد!" },
  };
  const l = k => labels[k][lang] || labels[k].en;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-sm font-semibold text-emerald-700 hover:text-emerald-800 py-1 group"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {l("btn")}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3">
          {submitted ? (
            <div className="text-center py-5 text-emerald-600">
              <CheckCircle className="w-9 h-9 mx-auto mb-2" />
              <p className="font-semibold text-sm">{l("done")}</p>
              <p className="text-xs text-gray-400 mt-1">{fmtDate(selectedSlot.date)} • {selectedSlot.start_time}–{selectedSlot.end_time}</p>
            </div>
          ) : !loaded ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : !selectedSlot ? (
            availableSlots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">{l("none")}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium mb-2">{l("pick")}</p>
                {availableSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className="w-full text-left flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                  >
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{fmtDate(slot.date)}</p>
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {slot.start_time} – {slot.end_time}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="font-medium text-emerald-800 text-sm">{fmtDate(selectedSlot.date)}</p>
                <p className="text-emerald-600 text-xs mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {selectedSlot.start_time} – {selectedSlot.end_time}
                </p>
              </div>
              <Input placeholder={l("name")} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-sm" />
              <Input placeholder={l("phone")} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="text-sm" />
              {!user && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {lang === "ar" ? "سجّل دخول لربط الموعد بحسابك" : lang === "fr" ? "Connectez-vous pour lier ce RDV à votre compte" : "Sign in to link this booking to your account"}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs text-gray-500" onClick={() => setSelectedSlot(null)}>
                  ← {l("back")}
                </Button>
                <Button
                  onClick={confirmBooking}
                  disabled={!form.name.trim() || submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> {l("confirm")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}