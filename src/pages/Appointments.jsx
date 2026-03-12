import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Clock, Check, X, RefreshCw, User, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";
import ProposeAppointmentModal from "../components/appointments/ProposeAppointmentModal";

const STATUS_STYLES = {
  pending: { badge: "bg-amber-100 text-amber-700", label: { fr: "En attente", en: "Pending", ar: "في الانتظار" } },
  accepted: { badge: "bg-green-100 text-green-700", label: { fr: "Confirmé", en: "Confirmed", ar: "مؤكد" } },
  declined: { badge: "bg-red-100 text-red-600", label: { fr: "Refusé", en: "Declined", ar: "مرفوض" } },
};

export default function AppointmentsPage() {
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [ownerSlots, setOwnerSlots] = useState([]);
  const [showCounter, setShowCounter] = useState(false);
  const [tab, setTab] = useState("pending");
  const [userNames, setUserNames] = useState({});

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }
    setUser(me);
    const [asProposer, asOther] = await Promise.all([
      base44.entities.AppointmentProposal.filter({ proposer_email: me.email }, "-created_date", 200).catch(() => []),
      base44.entities.AppointmentProposal.filter({ other_email: me.email }, "-created_date", 200).catch(() => []),
    ]);
    const all = [...asProposer];
    asOther.forEach(p => { if (!all.find(a => a.id === p.id)) all.push(p); });
    all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
    // Fetch user names for all unique emails
    const allEmails = new Set();
    all.forEach(p => { allEmails.add(p.proposer_email); allEmails.add(p.other_email); });
    const names = {};
    for (const email of allEmails) {
      const users = await base44.entities.User.filter({ email }).catch(() => []);
      if (users.length > 0 && users[0].full_name) {
        names[email] = users[0].full_name;
      }
    }
    setUserNames(names);
    
    setProposals(all);
    setLoading(false);
  }

  async function openDetail(proposal) {
    setSelected(proposal);
    const ownerEmail = proposal.proposer_email === user.email ? proposal.other_email : proposal.proposer_email;
    const slots = await base44.entities.AvailabilitySlot.filter(
      { agent_email: ownerEmail, listing_id: "__global__" }, "date", 100
    ).catch(() => []);
    const today = new Date().toISOString().split("T")[0];
    setOwnerSlots(slots.filter(s => s.date >= today));
  }

  async function handleAccept(proposal) {
    await base44.entities.AppointmentProposal.update(proposal.id, { status: "accepted" });
    const updated = { ...proposal, status: "accepted" };
    setProposals(prev => prev.map(p => p.id === proposal.id ? updated : p));
    setSelected(updated);
  }

  async function handleDecline(proposal) {
    await base44.entities.AppointmentProposal.update(proposal.id, { status: "declined" });
    const updated = { ...proposal, status: "declined" };
    setProposals(prev => prev.map(p => p.id === proposal.id ? updated : p));
    setSelected(updated);
  }

  async function handleCounter(proposal, { date, start_time, end_time, notes }) {
    await base44.entities.AppointmentProposal.update(proposal.id, { status: "declined" });
    const otherEmail = proposal.proposer_email === user.email ? proposal.other_email : proposal.proposer_email;
    const newProposal = await base44.entities.AppointmentProposal.create({
      thread_id: proposal.thread_id,
      listing_id: proposal.listing_id,
      listing_title: proposal.listing_title,
      proposer_email: user.email,
      other_email: otherEmail,
      proposer_name: user.full_name || user.email,
      proposed_date: date,
      proposed_start_time: start_time,
      proposed_end_time: end_time,
      notes,
    });
    setProposals(prev => [newProposal, ...prev.map(p => p.id === proposal.id ? { ...p, status: "declined" } : p)]);
    setSelected(null);
    setShowCounter(false);
  }

  const fmtDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T12:00:00").toLocaleDateString(
      lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en",
      { weekday: "short", day: "numeric", month: "short", year: "numeric" }
    );
  };

  const L = {
    title: { fr: "Mes Rendez-vous", en: "My Appointments", ar: "مواعيدي" },
    pending: { fr: "En attente", en: "Pending", ar: "في الانتظار" },
    confirmed: { fr: "Confirmés", en: "Confirmed", ar: "مؤكدة" },
    declined: { fr: "Refusés", en: "Declined", ar: "مرفوضة" },
    empty: { fr: "Aucun rendez-vous dans cette catégorie", en: "No appointments here", ar: "لا توجد مواعيد هنا" },
    detail: { fr: "Détail du rendez-vous", en: "Appointment detail", ar: "تفاصيل الموعد" },
    back: { fr: "Retour", en: "Back", ar: "رجوع" },
    listing: { fr: "Annonce concernée", en: "Related listing", ar: "الإعلان المرتبط" },
    with: { fr: "Avec", en: "With", ar: "مع" },
    accept: { fr: "Accepter", en: "Accept", ar: "قبول" },
    decline: { fr: "Refuser", en: "Decline", ar: "رفض" },
    counter: { fr: "Proposer une autre date", en: "Propose another date", ar: "اقتراح تاريخ آخر" },
    waiting: { fr: "En attente de réponse de l'autre partie", en: "Waiting for the other party's response", ar: "في انتظار رد الطرف الآخر" },
    goToConv: { fr: "Voir la conversation", en: "Go to conversation", ar: "عرض المحادثة" },
    availableSlots: { fr: "Disponibilités", en: "Available slots", ar: "المواعيد المتاحة" },
  };
  const t = k => L[k]?.[lang] || L[k]?.fr;

  const tabs = [
    { key: "pending", label: t("pending"), items: proposals.filter(p => p.status === "pending") },
    { key: "accepted", label: t("confirmed"), items: proposals.filter(p => p.status === "accepted") },
    { key: "declined", label: t("declined"), items: proposals.filter(p => p.status === "declined") },
  ];

  const activeItems = tabs.find(tb => tb.key === tab)?.items || [];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) { base44.auth.redirectToLogin(); return null; }

  // ---- DETAIL VIEW ----
  if (selected) {
    const isMyProposal = selected.proposer_email === user.email;
    const otherEmail = isMyProposal ? selected.other_email : selected.proposer_email;
    const canAct = selected.status === "pending" && !isMyProposal;
    const isWaiting = selected.status === "pending" && isMyProposal;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white py-6 px-4">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => { setSelected(null); setShowCounter(false); }} className="flex items-center gap-2 text-emerald-200 hover:text-white text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> {t("back")}
            </button>
            <h1 className="text-xl font-bold">{t("detail")}</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {/* Listing + status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-bold text-gray-800">{t("listing")}</h2>
              <Badge className={STATUS_STYLES[selected.status]?.badge}>
                {STATUS_STYLES[selected.status]?.label[lang] || STATUS_STYLES[selected.status]?.label.fr}
              </Badge>
            </div>
            <p className="text-gray-700 font-medium">{selected.listing_title || selected.listing_id}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>{t("with")}: {userNames[otherEmail] || otherEmail?.split("@")[0]}</span>
            </div>
          </div>

          {/* Date/Time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-800">{fmtDate(selected.proposed_date)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>{selected.proposed_start_time}{selected.proposed_end_time ? ` – ${selected.proposed_end_time}` : ""}</span>
            </div>
            {selected.notes && <p className="text-sm text-gray-500 italic">{selected.notes}</p>}
          </div>

          {/* Actions */}
          {canAct && (
            <div className="space-y-2">
              <Button onClick={() => handleAccept(selected)} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                <Check className="w-4 h-4" /> {t("accept")}
              </Button>
              <div className="flex gap-2">
                <Button onClick={() => handleDecline(selected)} variant="outline" className="flex-1 gap-2 text-red-500 border-red-200 hover:bg-red-50">
                  <X className="w-4 h-4" /> {t("decline")}
                </Button>
                <Button onClick={() => setShowCounter(true)} variant="outline" className="flex-1 gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                  <RefreshCw className="w-4 h-4" /> {t("counter")}
                </Button>
              </div>
            </div>
          )}

          {isWaiting && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 text-center">
              {t("waiting")}
            </div>
          )}

          {/* Go to conversation */}
          <Link
            to={createPageUrl("Messages") + `?thread=${selected.listing_id}&contact=${otherEmail}`}
            className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <span>{t("goToConv")}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>

          {/* Owner availability */}
          {ownerSlots.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" /> {t("availableSlots")}
              </h2>
              <div className="space-y-2">
                {ownerSlots.map(slot => (
                  <div key={slot.id} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <CalendarDays className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="font-medium">{fmtDate(slot.date)}</span>
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{slot.start_time} – {slot.end_time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showCounter && (
          <ProposeAppointmentModal
            thread={{ thread_id: selected.thread_id, listing_id: selected.listing_id }}
            currentUser={user}
            ownerEmail={otherEmail}
            lang={lang}
            onClose={() => setShowCounter(false)}
            onPropose={({ date, start_time, end_time, notes }) => handleCounter(selected, { date, start_time, end_time, notes })}
          />
        )}
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-emerald-300" />
          <h1 className="text-xl font-bold">{t("title")}</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {tabs.map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                tab === tb.key ? "bg-white shadow text-emerald-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tb.label}
              {tb.items.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === tb.key ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
                  {tb.items.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeItems.map(proposal => {
              const isMyProposal = proposal.proposer_email === user.email;
              const otherEmail = isMyProposal ? proposal.other_email : proposal.proposer_email;
              return (
                <button
                  key={proposal.id}
                  onClick={() => openDetail(proposal)}
                  className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 text-left hover:shadow-md transition-all flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                   <p className="font-semibold text-gray-800 text-sm truncate">{proposal.listing_title || proposal.listing_id}</p>
                   <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                     <span className="flex items-center gap-1"><User className="w-3 h-3" />{userNames[otherEmail] || otherEmail?.split("@")[0]}</span>
                     <span className="text-gray-300">•</span>
                     <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fmtDate(proposal.proposed_date)}</span>
                     <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{proposal.proposed_start_time}</span>
                   </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={STATUS_STYLES[proposal.status]?.badge || "bg-gray-100 text-gray-500"}>
                      {STATUS_STYLES[proposal.status]?.label[lang]}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}