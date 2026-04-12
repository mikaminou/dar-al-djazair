import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Clock, CheckCircle, ChevronDown, ChevronUp, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "../LanguageContext";

export default function BookingWidget({ listingId, agentEmail, listing, user }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null); // "pending"|"accepted"|null
  const [existingAppointmentId, setExistingAppointmentId] = useState(null);

  useEffect(() => {
    if (open && !loaded) loadSlots();
  }, [open]);

  useEffect(() => {
    if (user?.full_name) setForm(f => ({ ...f, name: user.full_name }));
  }, [user]);

  async function loadSlots() {
    const today = new Date().toISOString().split("T")[0];

    const [listingSlots, generalSlots, appsData] = await Promise.all([
      base44.entities.AvailabilitySlot.filter({ agent_email: agentEmail, listing_id: listingId, is_active: true }, "date", 50).catch(() => []),
      base44.entities.AvailabilitySlot.filter({ agent_email: agentEmail, listing_id: "__global__", is_active: true }, "date", 50).catch(() => []),
      user ? base44.entities.AppointmentProposal.filter({ proposer_email: user.email, listing_id: listingId }, "-created_date", 10).catch(() => []) : Promise.resolve([]),
    ]);

    // Check for existing active (pending or accepted) request by this user
    if (user) {
      const active = appsData.find(a => a.status === "pending" || a.status === "accepted");
      setExistingRequest(active ? active.status : null);
      setExistingAppointmentId(active ? active.id : null);
    }

    // Merge slots: listing-specific takes priority, exclude duplicates
    const combined = [...listingSlots];
    generalSlots.forEach(s => { if (!combined.find(c => c.id === s.id)) combined.push(s); });

    // Expand recurring and date_range slots into concrete date slots
    const concreteSlots = [];
    const now = new Date();
    for (const slot of combined) {
      if (!slot.mode || slot.mode === "single") {
        if (slot.date && slot.date >= today) concreteSlots.push({ ...slot, _concrete_date: slot.date });
      } else if (slot.mode === "recurring") {
        // Next 8 occurrences of this day of week
        for (let i = 0; i < 8; i++) {
          const d = new Date(now);
          const target = Number(slot.recur_day_of_week ?? 0);
          let diff = (target - d.getDay() + 7) % 7;
          if (diff === 0 && i > 0) diff = 7;
          d.setDate(d.getDate() + diff + (i > 0 ? (i - (diff === 0 ? 0 : 1)) * 7 : 0));
          const dateStr = d.toISOString().split("T")[0];
          if (dateStr >= today) concreteSlots.push({ ...slot, _concrete_date: dateStr, id: `${slot.id}_${dateStr}`, date: dateStr, _parent_id: slot.id });
        }
      } else if (slot.mode === "date_range") {
        let cur = new Date(slot.date_range_start + "T12:00:00");
        const end = new Date(slot.date_range_end + "T12:00:00");
        while (cur <= end) {
          const dateStr = cur.toISOString().split("T")[0];
          if (dateStr >= today) concreteSlots.push({ ...slot, _concrete_date: dateStr, id: `${slot.id}_${dateStr}`, date: dateStr, _parent_id: slot.id });
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    // Sort by date
    concreteSlots.sort((a, b) => a._concrete_date.localeCompare(b._concrete_date));

    // Check capacity: count confirmed bookings per parent slot
    const parentIds = [...new Set(combined.map(s => s.id))];
    const bookingCounts = {};
    for (const pid of parentIds) {
      const apps = await base44.entities.Appointment.filter({ slot_id: pid }, "-created_date", 100).catch(() => []);
      bookingCounts[pid] = apps.filter(a => a.status !== "cancelled").length;
    }

    // Filter out slots at full capacity
    const available = concreteSlots.filter(s => {
      const parentId = s._parent_id || s.id;
      const capacity = s.capacity;
      if (!capacity) return true;
      return (bookingCounts[parentId] || 0) < capacity;
    });

    // Deduplicate by date (only show 1 per date)
    const seen = new Set();
    const deduped = available.filter(s => {
      if (seen.has(s._concrete_date)) return false;
      seen.add(s._concrete_date);
      return true;
    });

    setSlots(deduped.slice(0, 15));
    setLoaded(true);
  }

  async function confirmBooking() {
    if (!form.name.trim()) return;
    setSubmitting(true);
    const buyerEmail = user?.email || "";
    const parentId = selectedSlot._parent_id || selectedSlot.id;

    await base44.entities.Appointment.create({
      slot_id: parentId,
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

  if (user?.email === agentEmail) return null;

  if (!user) return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button
        onClick={() => base44.auth.redirectToLogin(window.location.pathname + window.location.search)}
        className="w-full flex items-center justify-between text-sm font-semibold text-emerald-700 hover:text-emerald-800 py-1"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {lang === "ar" ? "سجّل دخول لحجز زيارة" : lang === "fr" ? "Connectez-vous pour réserver une visite" : "Sign in to book a viewing"}
        </span>
      </button>
    </div>
  );

  const fmtDate = (dateStr) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { weekday: "short", day: "numeric", month: "short" }
    );

  const labels = {
    btn:       { en: "Book a Viewing", fr: "Réserver une visite", ar: "احجز زيارة" },
    pick:      { en: "Select a slot", fr: "Choisissez un créneau", ar: "اختر موعداً" },
    none:      { en: "No slots available", fr: "Aucun créneau disponible", ar: "لا توجد مواعيد متاحة" },
    name:      { en: "Your name *", fr: "Votre nom *", ar: "اسمك *" },
    phone:     { en: "Phone number", fr: "Téléphone", ar: "رقم الهاتف" },
    confirm:   { en: "Confirm Booking", fr: "Confirmer", ar: "تأكيد الحجز" },
    back:      { en: "Back", fr: "Retour", ar: "رجوع" },
    done:      { en: "Appointment request sent!", fr: "Demande envoyée !", ar: "تم إرسال الطلب!" },
    doneInfo:  { en: "The owner will confirm shortly.", fr: "Le propriétaire confirmera bientôt.", ar: "سيؤكد المالك قريباً." },
    pending:   { en: "You have a pending request for this property.", fr: "Vous avez une demande en attente pour ce bien.", ar: "لديك طلب قيد الانتظار لهذا العقار." },
    accepted:  { en: "Your visit has been confirmed.", fr: "Votre visite a été confirmée.", ar: "تم تأكيد زيارتك." },
  };
  const l = k => labels[k][lang] || labels[k].en;

  // Show status for existing active request
  if (existingRequest === "pending" || existingRequest === "accepted") {
    return (
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
          existingRequest === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}>
          {existingRequest === "accepted" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          {l(existingRequest)}
        </div>
        <Link
          to={createPageUrl("Appointments")}
          className="flex items-center justify-center gap-1.5 w-full text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 transition-colors"
        >
          {lang === "ar" ? "عرض موعدي" : lang === "fr" ? "Voir mon rendez-vous" : "View my appointment"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

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
              <p className="text-xs text-gray-400 mt-1">{l("doneInfo")}</p>
            </div>
          ) : !loaded ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : !selectedSlot ? (
            slots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">{l("none")}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium mb-2">{l("pick")}</p>
                {slots.map(slot => (
                  <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                    className="w-full text-left flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{fmtDate(slot.date)}</p>
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {slot.start_time} – {slot.end_time}
                        {slot.capacity && <span className="ml-1 flex items-center gap-0.5 text-gray-400"><Users className="w-3 h-3" />{slot.capacity}</span>}
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
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs text-gray-500" onClick={() => setSelectedSlot(null)}>
                  ← {l("back")}
                </Button>
                <Button onClick={confirmBooking} disabled={!form.name.trim() || submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm gap-1.5">
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