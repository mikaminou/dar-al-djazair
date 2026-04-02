import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle, XCircle, MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "../../components/constants";

export default function ExclusivityConflictView({ listing, lang, onResolved }) {
  const [conflictListing, setConflictListing]   = useState(null);
  const [conflictOwner,   setConflictOwner]     = useState(null);
  const [newOwner,        setNewOwner]          = useState(null);
  const [loading,         setLoading]           = useState(true);
  const [busy,            setBusy]              = useState(false);
  const [note,            setNote]              = useState("");
  const [msgNew,          setMsgNew]            = useState("");
  const [msgOrig,         setMsgOrig]           = useState("");
  const [showContact,     setShowContact]       = useState(false);
  const [contactSent,     setContactSent]       = useState(false);

  useEffect(() => {
    async function load() {
      if (!listing.conflict_listing_id) { setLoading(false); return; }
      const [clRes, newOwnerRes] = await Promise.all([
        base44.entities.Listing.filter({ id: listing.conflict_listing_id }, null, 1).catch(() => []),
        base44.entities.User.filter({ email: listing.created_by }, null, 1).catch(() => []),
      ]);
      const cl = clRes[0];
      setConflictListing(cl || null);
      setNewOwner(newOwnerRes[0] || null);
      if (cl?.created_by) {
        const ownerRes = await base44.entities.User.filter({ email: cl.created_by }, null, 1).catch(() => []);
        setConflictOwner(ownerRes[0] || null);
      }
      setLoading(false);
    }
    load();
  }, [listing.id]);

  async function resolve(action) {
    setBusy(true);
    const payload = { listing_id: listing.id, action, admin_note: note };
    if (action === "contact_both") {
      Object.assign(payload, { message_to_new: msgNew, message_to_original: msgOrig });
    }
    await base44.functions.invoke("resolveExclusivityConflict", payload);
    setBusy(false);
    if (action === "contact_both") { setContactSent(true); setShowContact(false); return; }
    onResolved && onResolved(listing.id, action);
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-amber-600 text-xs p-3">
      <Loader2 className="w-3 h-3 animate-spin" />
      {lang === "ar" ? "جارٍ تحميل تفاصيل التعارض..." : lang === "fr" ? "Chargement du conflit..." : "Loading conflict details..."}
    </div>
  );

  if (!conflictListing) return (
    <div className="text-xs text-gray-400 p-2">
      {lang === "ar" ? "لم يُعثر على الإعلان المتعارض." : lang === "fr" ? "Annonce en conflit introuvable." : "Conflict listing not found."}
    </div>
  );

  const colClass = "bg-gray-50 rounded-xl border p-4 flex-1 min-w-0 space-y-2";

  return (
    <div className="space-y-4">
      {/* Warning header */}
      <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-orange-800">
            {lang === "ar" ? "تعارض مع إعلان حصري" : lang === "fr" ? "Conflit avec un bien exclusif" : "Exclusivity Conflict Detected"}
          </p>
          <p className="text-xs text-orange-700 mt-0.5">
            {lang === "ar"
              ? "قد يكون هذا الإعلان الجديد مكرراً لإعلان حصري موجود. يجب اتخاذ قرار."
              : lang === "fr"
              ? "Ce nouvel annonce pourrait être un doublon d'un bien exclusif existant. Une décision s'impose."
              : "This new listing may duplicate an existing exclusive property. A decision is required."}
          </p>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Existing exclusive listing — LEFT */}
        <div className={colClass + " border-amber-200"}>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
            ⭐ {lang === "ar" ? "الإعلان الحصري الموجود" : lang === "fr" ? "Annonce exclusive existante" : "Existing Exclusive Listing"}
          </p>
          {conflictListing.images?.[0] && (
            <img src={conflictListing.images[0]} alt="" className="w-full h-28 object-cover rounded-lg" />
          )}
          <p className="text-sm font-semibold text-gray-900">{conflictListing.title}</p>
          <p className="text-xs text-gray-500">
            {conflictListing.wilaya}{conflictListing.commune ? ` · ${conflictListing.commune}` : ""}
            {conflictListing.address ? ` · ${conflictListing.address}` : ""}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white border rounded px-2 py-1">{formatPrice(conflictListing.price, lang)} </span>
            {conflictListing.area && <span className="bg-white border rounded px-2 py-1">{conflictListing.area} m²</span>}
            <span className={`rounded px-2 py-1 ${conflictListing.listing_type === "sale" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
              {conflictListing.listing_type === "sale" ? (lang === "ar" ? "بيع" : lang === "fr" ? "Vente" : "Sale") : (lang === "ar" ? "إيجار" : lang === "fr" ? "Location" : "Rent")}
            </span>
          </div>
          {conflictOwner && (
            <div className="bg-white border rounded-lg px-3 py-2 text-xs space-y-0.5">
              <p className="font-semibold text-gray-800">{conflictOwner.full_name || conflictOwner.email}</p>
              {conflictOwner.agency_name && <p className="text-blue-600">{conflictOwner.agency_name}</p>}
              <p className="text-gray-400">{conflictOwner.email}</p>
            </div>
          )}
          <a
            href={`/ListingDetail?id=${conflictListing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {lang === "ar" ? "فتح الإعلان" : lang === "fr" ? "Ouvrir" : "Open listing"}
          </a>
        </div>

        {/* Divider */}
        <div className="hidden md:flex flex-col items-center justify-center gap-2 px-2">
          <div className="w-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">VS</span>
          <div className="w-px flex-1 bg-gray-200" />
        </div>

        {/* New listing — RIGHT */}
        <div className={colClass + " border-blue-200"}>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
            🆕 {lang === "ar" ? "الإعلان الجديد (قيد المراجعة)" : lang === "fr" ? "Nouvel annonce (en attente)" : "New Listing (Pending)"}
          </p>
          {listing.images?.[0] && (
            <img src={listing.images[0]} alt="" className="w-full h-28 object-cover rounded-lg" />
          )}
          <p className="text-sm font-semibold text-gray-900">{listing.title}</p>
          <p className="text-xs text-gray-500">
            {listing.wilaya}{listing.commune ? ` · ${listing.commune}` : ""}
            {listing.address ? ` · ${listing.address}` : ""}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white border rounded px-2 py-1">{formatPrice(listing.price, lang)}</span>
            {listing.area && <span className="bg-white border rounded px-2 py-1">{listing.area} m²</span>}
            <span className={`rounded px-2 py-1 ${listing.listing_type === "sale" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
              {listing.listing_type === "sale" ? (lang === "ar" ? "بيع" : lang === "fr" ? "Vente" : "Sale") : (lang === "ar" ? "إيجار" : lang === "fr" ? "Location" : "Rent")}
            </span>
          </div>
          {newOwner && (
            <div className="bg-white border rounded-lg px-3 py-2 text-xs space-y-0.5">
              <p className="font-semibold text-gray-800">{newOwner.full_name || newOwner.email}</p>
              {newOwner.agency_name && <p className="text-blue-600">{newOwner.agency_name}</p>}
              <p className="text-gray-400">{newOwner.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin note */}
      <Textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={lang === "ar" ? "ملاحظة للقرار (مطلوبة للرفض)" : lang === "fr" ? "Note pour la décision (requise pour refuser)" : "Decision note (required for decline)"}
        rows={2}
        className="resize-none text-sm"
      />

      {/* Resolution actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busy}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1.5"
          onClick={() => resolve("approve_both")}
          title={lang === "ar" ? "الموافقة على الإعلانين معاً وإزالة الحصرية عن الإعلان الأصلي" : lang === "fr" ? "Approuver les deux et lever l'exclusivité" : "Approve both, remove exclusivity from original"}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {lang === "ar" ? "قبول الاثنين (رفع الحصرية)" : lang === "fr" ? "Approuver les deux" : "Approve Both (Lift Exclusivity)"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !note.trim()}
          className="text-red-600 border-red-200 hover:bg-red-50 text-xs gap-1.5"
          onClick={() => resolve("decline_conflict")}
          title={!note.trim() ? (lang === "ar" ? "أدخل سبباً" : "Enter a reason first") : ""}
        >
          <XCircle className="w-3.5 h-3.5" />
          {lang === "ar" ? "رفض الإعلان الجديد" : lang === "fr" ? "Refuser (exclusivité)" : "Decline (Exclusivity)"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs gap-1.5"
          onClick={() => setShowContact(o => !o)}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {lang === "ar" ? "التواصل مع الطرفين" : lang === "fr" ? "Contacter les deux parties" : "Contact Both Parties"}
        </Button>
      </div>

      {/* Contact panel */}
      {showContact && (
        <div className="space-y-3 border border-blue-100 rounded-xl p-4 bg-blue-50/30">
          <p className="text-xs font-semibold text-blue-700">
            {lang === "ar" ? "إرسال رسالة للطرفين" : lang === "fr" ? "Envoyer un message aux deux parties" : "Send messages to both parties"}
          </p>
          <div>
            <p className="text-xs text-gray-500 mb-1">→ {lang === "ar" ? "للمالك الأصلي (الحصري)" : lang === "fr" ? "Au propriétaire exclusif" : "To original exclusive owner"} ({conflictOwner?.email || "?"})</p>
            <Textarea value={msgOrig} onChange={e => setMsgOrig(e.target.value)} rows={2} className="text-xs resize-none" placeholder="..." />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">→ {lang === "ar" ? "لصاحب الإعلان الجديد" : lang === "fr" ? "Au soumetteur du nouvel annonce" : "To new listing submitter"} ({newOwner?.email || listing.created_by || "?"})</p>
            <Textarea value={msgNew} onChange={e => setMsgNew(e.target.value)} rows={2} className="text-xs resize-none" placeholder="..." />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={busy || (!msgNew.trim() && !msgOrig.trim())} onClick={() => resolve("contact_both")} className="text-xs bg-blue-600 hover:bg-blue-700">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {lang === "ar" ? "إرسال" : lang === "fr" ? "Envoyer" : "Send"}
            </Button>
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowContact(false)}>
              {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
          </div>
          {contactSent && <p className="text-xs text-emerald-600">✓ {lang === "ar" ? "تم الإرسال" : lang === "fr" ? "Envoyé" : "Sent"}</p>}
        </div>
      )}
    </div>
  );
}