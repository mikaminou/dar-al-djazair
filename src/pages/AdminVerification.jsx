import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { Shield, CheckCircle, XCircle, FileText, ExternalLink, Clock, Users, BadgeCheck, BadgeX, Home, Eye, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, AlertTriangle, Star, Building2, Crown, RefreshCw } from "lucide-react";
import ExclusivityConflictView from "../components/admin/ExclusivityConflictView";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "../components/constants";

const STATUS_COLORS = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

export default function AdminVerification() {
  const { lang } = useLang();
  const { toast } = useToast();
  const [requests, setRequests]       = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [pros,     setPros]           = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [listingUsers, setListingUsers] = useState({});
  const [loading,  setLoading]        = useState(true);
  const [isAdmin,  setIsAdmin]        = useState(false);
  const [filter,   setFilter]         = useState("pending");
  const [tab,      setTab]            = useState("listings");
  const [expandId, setExpandId]       = useState(null);
  const [expandListingId, setExpandListingId] = useState(null);
  const [note,     setNote]           = useState("");
  const [busy,     setBusy]           = useState(false);
  const [lightbox, setLightbox]       = useState(null); // { images, index }
  const [retryingId, setRetryingId]   = useState(null);
  const [watermarkFailedListings, setWatermarkFailedListings] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== "admin") { setLoading(false); return; }
    setIsAdmin(true);
    const [data, allUsers, listings, projects, upgrades, failedWm] = await Promise.all([
      base44.entities.VerificationRequest.list("-created_date", 300),
      base44.entities.User.filter({ role: "professional" }, "-created_date", 200).catch(() => []),
      base44.entities.Listing.filter({ status: "pending" }, "-created_date", 200).catch(() => []),
      base44.entities.Project.filter({ status: "pending" }, "-created_date", 100).catch(() => []),
      base44.entities.UpgradeRequest.list("-created_date", 200).catch(() => []),
      base44.entities.Listing.filter({ status: "active" }, "-updated_date", 200)
        .then(all => all.filter(l => l.admin_note && l.admin_note.startsWith("Watermark")))
        .catch(() => []),
    ]);
    setRequests(data);
    setUpgradeRequests(upgrades);
    setPros(allUsers);
    setPendingListings(listings);
    setPendingProjects(projects);
    setWatermarkFailedListings(failedWm);

    // Load submitter info for each listing
    const emails = [...new Set(listings.map(l => l.created_by).filter(Boolean))];
    const userMap = {};
    await Promise.all(emails.map(async email => {
      const users = await base44.entities.User.filter({ email }, null, 1).catch(() => []);
      if (users[0]) userMap[email] = users[0];
    }));
    setListingUsers(userMap);
    setLoading(false);
  }

  async function toggleVerified(pro) {
    const newVal = !pro.is_verified;
    await base44.entities.User.update(pro.id, { is_verified: newVal });
    const listings = await base44.entities.Listing.filter({ created_by: pro.email }, null, 500).catch(() => []);
    await Promise.all(listings.map(l =>
      base44.entities.Listing.update(l.id, { owner_is_verified: newVal })
    ));
    setPros(prev => prev.map(p => p.id === pro.id ? { ...p, is_verified: newVal } : p));
  }

  async function viewDoc(req) {
    const res = await base44.functions.invoke("getDocumentUrl", { file_uri: req.document_uri });
    const url = res.data?.signed_url;
    if (url) window.open(url, "_blank");
  }

  async function handleVerificationAction(req, action) {
    setBusy(true);
    await base44.functions.invoke("approveVerification", { request_id: req.id, action, admin_note: note });
    const newStatus = action === "approve" ? "approved" : "rejected";
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus, admin_note: note } : r));
    setExpandId(null);
    setNote("");
    setBusy(false);
  }

  async function handleRetryWatermark(listing) {
    setRetryingId(listing.id);
    const res = await base44.functions.invoke("watermarkListingPhotos", { listing_id: listing.id, retry: true });
    setRetryingId(null);
    const note = res?.data?.adminNote;
    if (note) {
      toast({ title: lang === "ar" ? "تحذير: العلامة المائية" : lang === "fr" ? "Avertissement filigrane" : "Watermark Warning", description: note, variant: "destructive", duration: 8000 });
    } else {
      toast({ title: lang === "ar" ? "تم تطبيق العلامة المائية" : lang === "fr" ? "Filigrane appliqué" : "Watermark applied", description: lang === "ar" ? "تم تطبيق العلامة المائية بنجاح" : lang === "fr" ? "Le filigrane a été appliqué avec succès." : "Watermark applied successfully.", duration: 4000 });
      setWatermarkFailedListings(prev => prev.filter(l => l.id !== listing.id));
    }
  }

  async function handleListingAction(listing, action) {
    setBusy(true);
    const res = await base44.functions.invoke("approveListing", { listing_id: listing.id, action, admin_note: note });
    setPendingListings(prev => prev.filter(l => l.id !== listing.id));
    setExpandListingId(null);
    setNote("");
    setBusy(false);
    if (action === "approve" && res?.data?.watermark_note) {
      toast({
        title: lang === "ar" ? "تحذير: العلامة المائية" : lang === "fr" ? "Avertissement : filigrane" : "Watermark Warning",
        description: res.data.watermark_note,
        variant: "destructive",
        duration: 8000,
      });
    }
  }

  const T = {
    title:       { fr: "Administration",             en: "Admin Dashboard",       ar: "لوحة الإدارة" },
    pending:     { fr: "En attente",                 en: "Pending",               ar: "قيد المراجعة" },
    approved:    { fr: "Approuvées",                 en: "Approved",              ar: "مقبولة" },
    rejected:    { fr: "Refusées",                   en: "Rejected",              ar: "مرفوضة" },
    professional:{ fr: "Professionnel",              en: "Professional",          ar: "محترف" },
    individual:  { fr: "Particulier",                en: "Individual",            ar: "فرد" },
    viewDoc:     { fr: "Voir le document",           en: "View document",         ar: "عرض الوثيقة" },
    approve:     { fr: "Approuver",                  en: "Approve",               ar: "قبول" },
    reject:      { fr: "Refuser",                    en: "Reject",                ar: "رفض" },
    notePlh:     { fr: "Note admin (optionnel)",     en: "Admin note (optional)", ar: "ملاحظة الإدارة (اختياري)" },
    action:      { fr: "Décider",                    en: "Decide",                ar: "القرار" },
    cancel:      { fr: "Annuler",                    en: "Cancel",                ar: "إلغاء" },
    noReqs:      { fr: "Aucune demande",             en: "No requests",           ar: "لا توجد طلبات" },
    notAdmin:    { fr: "Accès réservé aux admins",   en: "Admin access only",     ar: "للمدير فقط" },
    adminNote:   { fr: "Note admin: ",               en: "Admin note: ",          ar: "ملاحظة الإدارة: " },
    proposeChanges: { fr: "Demander modifications", en: "Request Changes",       ar: "طلب تعديلات" },
    decline:     { fr: "Refuser l'annonce",          en: "Decline Listing",       ar: "رفض الإعلان" },
    notePlhRequired: { fr: "Message requis",         en: "Message required",      ar: "الرسالة مطلوبة" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">{t("notAdmin")}</div>
  );

  const displayedRequests = requests.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Shield className="w-6 h-6 text-emerald-300" />
          <h1 className="text-2xl font-bold">{t("title")}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Main tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setTab("projects")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "projects" ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-400"
            }`}
          >
            <Building2 className="w-4 h-4" />
            {lang === "ar" ? "مشاريع بانتظار المراجعة" : lang === "fr" ? "Projets à approuver" : "Project Approvals"}
            {pendingProjects.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === "projects" ? "bg-white/20" : "bg-blue-100 text-blue-700"}`}>
                {pendingProjects.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("listings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "listings" ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-400"
            }`}
          >
            <Home className="w-4 h-4" />
            {lang === "ar" ? "إعلانات بانتظار المراجعة" : lang === "fr" ? "Annonces à approuver" : "Listing Approvals"}
            {pendingListings.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === "listings" ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>
                {pendingListings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "requests" ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-400"
            }`}
          >
            <FileText className="w-4 h-4" />
            {lang === "ar" ? "طلبات التحقق" : lang === "fr" ? "Demandes" : "Verification Requests"}
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{requests.filter(r => r.status === "pending").length}</span>
          </button>
          <button
            onClick={() => setTab("pros")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "pros" ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-400"
            }`}
          >
            <Users className="w-4 h-4" />
            {lang === "ar" ? "المحترفون" : lang === "fr" ? "Professionnels" : "Professionals"}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === "pros" ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>{pros.length}</span>
          </button>
          <button
            onClick={() => setTab("upgrades")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "upgrades" ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-amber-600 hover:border-amber-400"
            }`}
          >
            <Crown className="w-4 h-4" />
            {lang === "ar" ? "طلبات بريميوم" : lang === "fr" ? "Demandes Premium" : "Upgrade Requests"}
            {upgradeRequests.filter(r => r.status === "pending").length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === "upgrades" ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}>
                {upgradeRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        </div>

        {/* ── PROJECTS APPROVAL TAB ── */}
        {tab === "projects" && (
          <div className="space-y-3">
            {pendingProjects.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{lang === "ar" ? "لا توجد مشاريع بانتظار المراجعة" : lang === "fr" ? "Aucun projet en attente" : "No projects pending approval"}</p>
              </div>
            ) : pendingProjects.map(proj => (
              <div key={proj.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex gap-4">
                  {proj.photos?.[0] && <img src={proj.photos[0]} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-gray-900">{proj.project_name}</h3>
                        <p className="text-sm text-gray-500">{proj.developer_name} · {proj.wilaya}{proj.commune ? `, ${proj.commune}` : ""}</p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">{lang === "fr" ? "En attente" : "Pending"}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{proj.total_units} {lang === "fr" ? "unités" : "units"} · {proj.project_type}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <Textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={lang === "fr" ? "Message au promoteur (optionnel pour approbation)" : "Message to developer"}
                    rows={2} className="resize-none text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs" onClick={async () => {
                      setBusy(true);
                      await base44.entities.Project.update(proj.id, { status: "active", admin_note: note });
                      setPendingProjects(prev => prev.filter(p => p.id !== proj.id));
                      setNote(""); setBusy(false);
                    }}>
                      <CheckCircle className="w-3.5 h-3.5" />{lang === "fr" ? "Approuver & Publier" : "Approve"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy || !note.trim()} className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 text-xs" onClick={async () => {
                      if (!note.trim()) return;
                      setBusy(true);
                      await base44.entities.Project.update(proj.id, { status: "declined", admin_note: note });
                      setPendingProjects(prev => prev.filter(p => p.id !== proj.id));
                      setNote(""); setBusy(false);
                    }}>
                      <XCircle className="w-3.5 h-3.5" />{lang === "fr" ? "Refuser" : "Decline"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── LISTINGS APPROVAL TAB ── */}
        {tab === "listings" && (
          <div className="space-y-3">
            {/* Watermark retry section */}
            {watermarkFailedListings.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {lang === "ar" ? "إعلانات بعلامة مائية فاشلة — يمكن إعادة المحاولة" : lang === "fr" ? "Annonces avec filigrane échoué — relancer" : "Listings with failed watermark — retry available"}
                </p>
                <div className="space-y-2">
                  {watermarkFailedListings.map(l => (
                    <div key={l.id} className="bg-white rounded-lg border border-orange-100 p-3 flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{l.title}</p>
                        <p className="text-xs text-orange-600 truncate">{l.admin_note}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={retryingId === l.id}
                        className="text-orange-700 border-orange-300 hover:bg-orange-50 gap-1.5 text-xs flex-shrink-0"
                        onClick={() => handleRetryWatermark(l)}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${retryingId === l.id ? "animate-spin" : ""}`} />
                        {retryingId === l.id
                          ? (lang === "ar" ? "جارٍ..." : lang === "fr" ? "En cours..." : "Retrying...")
                          : (lang === "ar" ? "إعادة المحاولة" : lang === "fr" ? "Relancer le filigrane" : "Retry Watermark")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingListings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                <Home className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{lang === "ar" ? "لا توجد إعلانات بانتظار المراجعة" : lang === "fr" ? "Aucune annonce en attente" : "No listings pending approval"}</p>
              </div>
            ) : pendingListings.map(listing => {
              const owner = listingUsers[listing.created_by];
              const isExpanded = expandListingId === listing.id;
              return (
                <div key={listing.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Summary row */}
                  <div className="p-5">
                    <div className="flex gap-4">
                      {listing.images?.[0] && (
                        <img src={listing.images[0]} alt="" className="w-24 h-18 object-cover rounded-lg flex-shrink-0 h-16" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {listing.wilaya}{listing.commune ? ` · ${listing.commune}` : ""} · {formatPrice(listing.price, lang)}
                            </p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700 flex-shrink-0">
                            {lang === "ar" ? "بانتظار المراجعة" : lang === "fr" ? "En attente" : "Pending"}
                          </Badge>
                          {listing.is_exclusive && (
                            <Badge className="bg-purple-100 text-purple-700 flex items-center gap-1 flex-shrink-0">
                              <Star className="w-3 h-3" />{lang === "ar" ? "حصري" : lang === "fr" ? "Exclusif" : "Exclusive"}
                            </Badge>
                          )}
                          {listing.exclusivity_conflict && (
                            <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1 flex-shrink-0">
                              <AlertTriangle className="w-3 h-3" />{lang === "ar" ? "تعارض حصري" : lang === "fr" ? "Conflit exclusivité" : "Exclusivity Conflict"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-400">
                            {new Date(listing.created_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {owner && (
                            <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              {owner.agency_name || owner.full_name || owner.email}
                              {owner.is_verified && <BadgeCheck className="w-3 h-3 text-emerald-600" />}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${listing.listing_type === "sale" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                            {listing.listing_type === "sale" ? (lang === "ar" ? "بيع" : lang === "fr" ? "Vente" : "Sale") : (lang === "ar" ? "إيجار" : lang === "fr" ? "Location" : "Rent")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => { setExpandListingId(isExpanded ? null : listing.id); setNote(""); }}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-700 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isExpanded
                          ? (lang === "ar" ? "إخفاء التفاصيل" : lang === "fr" ? "Masquer" : "Hide details")
                          : (lang === "ar" ? "عرض التفاصيل والقرار" : lang === "fr" ? "Voir les détails & décider" : "View details & decide")}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail + actions */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 p-5 space-y-4 bg-gray-50/50">
                      {/* Photos */}
                      {listing.images?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {lang === "ar" ? "الصور" : lang === "fr" ? "Photos" : "Photos"} ({listing.images.length})
                          </p>
                          <div className="flex gap-2 flex-wrap">
                             {listing.images.map((url, i) => (
                               <img
                                 key={i} src={url} alt=""
                                 className="w-20 h-16 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity hover:ring-2 hover:ring-emerald-500"
                                 onClick={() => setLightbox({ images: listing.images, index: i })}
                               />
                             ))}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {listing.description && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            {lang === "ar" ? "الوصف" : lang === "fr" ? "Description" : "Description"}
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
                        </div>
                      )}

                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {listing.area && <div className="bg-white rounded-lg p-3 border text-center"><p className="text-xs text-gray-400">{lang === "ar" ? "المساحة" : lang === "fr" ? "Surface" : "Area"}</p><p className="font-semibold text-sm">{listing.area} m²</p></div>}
                        {listing.rooms && <div className="bg-white rounded-lg p-3 border text-center"><p className="text-xs text-gray-400">{lang === "ar" ? "الغرف" : lang === "fr" ? "Pièces" : "Rooms"}</p><p className="font-semibold text-sm">{listing.rooms}</p></div>}
                        {listing.bedrooms && <div className="bg-white rounded-lg p-3 border text-center"><p className="text-xs text-gray-400">{lang === "ar" ? "غرف نوم" : lang === "fr" ? "Chambres" : "Bedrooms"}</p><p className="font-semibold text-sm">{listing.bedrooms}</p></div>}
                        {listing.bathrooms && <div className="bg-white rounded-lg p-3 border text-center"><p className="text-xs text-gray-400">{lang === "ar" ? "حمامات" : lang === "fr" ? "SDB" : "Baths"}</p><p className="font-semibold text-sm">{listing.bathrooms}</p></div>}
                      </div>

                      {/* Contact */}
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          {lang === "ar" ? "معلومات الاتصال" : lang === "fr" ? "Contact" : "Contact Info"}
                        </p>
                        <div className="flex gap-4 flex-wrap text-sm text-gray-700">
                          {listing.contact_name  && <span>👤 {listing.contact_name}</span>}
                          {listing.contact_phone && <span>📞 {listing.contact_phone}</span>}
                          {listing.contact_email && <span>✉️ {listing.contact_email}</span>}
                        </div>
                      </div>

                      {/* Owner info */}
                      {owner && (
                        <div className="bg-white rounded-lg p-3 border">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            {lang === "ar" ? "صاحب الإعلان" : lang === "fr" ? "Propriétaire de l'annonce" : "Listing Owner"}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-medium text-gray-800">{owner.full_name || owner.email}</span>
                            {owner.agency_name && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{owner.agency_name}</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${owner.is_verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                              {owner.is_verified
                                ? (lang === "ar" ? "موثق" : lang === "fr" ? "Vérifié" : "Verified")
                                : (lang === "ar" ? "غير موثق" : lang === "fr" ? "Non vérifié" : "Not verified")}
                            </span>
                            <span className="text-xs text-gray-400">{owner.email}</span>
                          </div>
                        </div>
                      )}

                  {/* Exclusivity conflict view */}
                  {listing.exclusivity_conflict && (
                    <div className="border-t border-orange-100 p-5 bg-orange-50/30">
                      <ExclusivityConflictView
                        listing={listing}
                        lang={lang}
                        onResolved={(id) => {
                          setPendingListings(prev => prev.filter(l => l.id !== id));
                          setExpandListingId(null);
                        }}
                      />
                    </div>
                  )}

                  {/* Standard actions */}
                  {!listing.exclusivity_conflict && <div className="space-y-3 pt-2 border-t border-gray-100">
                        <Textarea
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder={lang === "ar" ? "رسالة للمالك (مطلوبة للرفض وطلب التعديل)" : lang === "fr" ? "Message au propri\u00e9taire (requis pour refus / demande de modification)" : "Message to owner (required for decline / propose changes)"}
                          rows={2}
                          className="resize-none text-sm"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            disabled={busy}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs"
                            onClick={() => handleListingAction(listing, "approve")}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {lang === "ar" ? "نشر الإعلان" : lang === "fr" ? "Approuver & Publier" : "Approve & Publish"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || !note.trim()}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1.5 text-xs"
                            onClick={() => handleListingAction(listing, "propose_changes")}
                            title={!note.trim() ? (lang === "ar" ? "أدخل رسالة" : "Enter a message first") : ""}
                          >
                            ✏️ {lang === "ar" ? "طلب تعديلات" : lang === "fr" ? "Demander modifications" : "Request Changes"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || !note.trim()}
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 text-xs"
                            onClick={() => handleListingAction(listing, "decline")}
                            title={!note.trim() ? (lang === "ar" ? "أدخل سبب الرفض" : "Enter decline reason first") : ""}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {lang === "ar" ? "رفض الإعلان" : lang === "fr" ? "Refuser" : "Decline"}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs text-gray-500" onClick={() => { setExpandListingId(null); setNote(""); }}>
                            {t("cancel")}
                          </Button>
                        </div>
                        {(note.trim() === "" && expandListingId === listing.id) && (
                          <p className="text-xs text-gray-400">
                            💡 {lang === "ar" ? "ملاحظة: مطلوبة للرفض وطلب التعديل، لكن اختيارية للقبول." : lang === "fr" ? "Note : requise pour refuser ou demander des modifications, optionnelle pour approuver." : "Note: required for decline/changes, optional for approval."}
                          </p>
                        )}
                      </div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── PROS TAB ── */}
        {tab === "pros" && (
          <div className="space-y-3">
            {pros.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                {lang === "ar" ? "لا يوجد محترفون" : lang === "fr" ? "Aucun professionnel" : "No professionals found"}
              </div>
            ) : pros.map(pro => (
              <div key={pro.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-sm text-gray-900">{pro.full_name || pro.email}</span>
                    {pro.agency_name && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{pro.agency_name}</span>}
                    {pro.is_verified
                      ? <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><BadgeCheck className="w-3 h-3" />{lang === "ar" ? "موثق" : lang === "fr" ? "Vérifié" : "Verified"}</span>
                      : <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full"><BadgeX className="w-3 h-3" />{lang === "ar" ? "غير موثق" : lang === "fr" ? "Non vérifié" : "Not verified"}</span>
                    }
                  </div>
                  <p className="text-xs text-gray-400">{pro.email}</p>
                </div>
                <button
                  onClick={() => toggleVerified(pro)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pro.is_verified
                      ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {pro.is_verified
                    ? <><XCircle className="w-3.5 h-3.5" />{lang === "ar" ? "إلغاء التوثيق" : lang === "fr" ? "Retirer vérif." : "Remove Verification"}</>
                    : <><CheckCircle className="w-3.5 h-3.5" />{lang === "ar" ? "توثيق" : lang === "fr" ? "Vérifier" : "Verify"}</>
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── UPGRADE REQUESTS TAB ── */}
        {tab === "upgrades" && (
          <div className="space-y-3">
            {upgradeRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{lang === "ar" ? "لا توجد طلبات" : lang === "fr" ? "Aucune demande" : "No upgrade requests"}</p>
              </div>
            ) : upgradeRequests.map(req => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-gray-900">{req.user_name || req.user_email}</span>
                      <Badge className={req.status === "pending" ? "bg-amber-100 text-amber-700" : req.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}>
                        {req.status === "pending" ? (lang === "fr" ? "En attente" : lang === "ar" ? "قيد المراجعة" : "Pending") : req.status === "approved" ? (lang === "fr" ? "Approuvé" : lang === "ar" ? "مقبول" : "Approved") : (lang === "fr" ? "Refusé" : lang === "ar" ? "مرفوض" : "Rejected")}
                      </Badge>
                      <Badge className="bg-blue-50 text-blue-700">
                        {req.plan === "monthly" ? (lang === "fr" ? "Mensuel" : lang === "ar" ? "شهري" : "Monthly") : (lang === "fr" ? "Annuel" : lang === "ar" ? "سنوي" : "Annual")}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{req.user_email}</p>
                    {req.message && <p className="text-sm text-gray-700 mt-1 italic">"{req.message}"</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(req.created_date).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                    {req.admin_note && <p className="text-xs text-gray-500 mt-1 italic">{lang === "fr" ? "Note: " : "Note: "}{req.admin_note}</p>}
                  </div>
                </div>
                {req.status === "pending" && (
                  <div className="mt-4 pt-3 border-t border-gray-50 space-y-3">
                    <Textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder={lang === "fr" ? "Note pour l'utilisateur (optionnel)" : lang === "ar" ? "ملاحظة للمستخدم (اختياري)" : "Note to user (optional)"}
                      rows={2} className="resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs" onClick={async () => {
                        setBusy(true);
                        await base44.entities.UpgradeRequest.update(req.id, { status: "approved", admin_note: note });
                        await base44.entities.User.update(req.user_email, { role: "professional" }).catch(() => {});
                        setUpgradeRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved", admin_note: note } : r));
                        setNote(""); setBusy(false);
                      }}>
                        <CheckCircle className="w-3.5 h-3.5" />{lang === "fr" ? "Approuver & Activer" : lang === "ar" ? "قبول وتفعيل" : "Approve & Activate"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 text-xs" onClick={async () => {
                        setBusy(true);
                        await base44.entities.UpgradeRequest.update(req.id, { status: "rejected", admin_note: note });
                        setUpgradeRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "rejected", admin_note: note } : r));
                        setNote(""); setBusy(false);
                      }}>
                        <XCircle className="w-3.5 h-3.5" />{lang === "fr" ? "Refuser" : lang === "ar" ? "رفض" : "Reject"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── VERIFICATION REQUESTS TAB ── */}
        {tab === "requests" && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {["pending", "approved", "rejected"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === s
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-400"
                  }`}
                >
                  {t(s)} ({requests.filter(r => r.status === s).length})
                </button>
              ))}
            </div>

            {displayedRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                {t("noReqs")}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedRequests.map(req => (
                  <div key={req.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <Badge className={STATUS_COLORS[req.status]}>{t(req.status)}</Badge>
                          <Badge className={req.type === "professional" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}>
                            {t(req.type)}
                          </Badge>
                          {req.agency_name && (
                            <span className="text-sm font-semibold text-gray-800">{req.agency_name}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{req.user_email}</p>
                        {req.user_name && req.user_name !== req.user_email && (
                          <p className="text-xs text-gray-500">{req.user_name}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(req.created_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {req.admin_note && (
                          <p className="text-xs text-gray-500 mt-1 italic">{t("adminNote")}{req.admin_note}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-shrink-0" onClick={() => viewDoc(req)}>
                        <FileText className="w-3.5 h-3.5" />
                        {t("viewDoc")}
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>

                    {req.status === "pending" && (
                      <div className="mt-4 pt-3 border-t border-gray-50">
                        {expandId === req.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={note}
                              onChange={e => setNote(e.target.value)}
                              placeholder={t("notePlh")}
                              rows={2}
                              className="resize-none text-sm"
                            />
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs" onClick={() => handleVerificationAction(req, "approve")}>
                                <CheckCircle className="w-3.5 h-3.5" /> {t("approve")}
                              </Button>
                              <Button size="sm" variant="outline" disabled={busy} className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 text-xs" onClick={() => handleVerificationAction(req, "reject")}>
                                <XCircle className="w-3.5 h-3.5" /> {t("reject")}
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs text-gray-500" onClick={() => { setExpandId(null); setNote(""); }}>
                                {t("cancel")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => setExpandId(req.id)}>
                            <Clock className="w-3 h-3" />
                            {t("action")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {lightbox.index > 0 && (
            <button
              className="absolute left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
              onClick={e => { e.stopPropagation(); setLightbox(p => ({ ...p, index: p.index - 1 })); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <img
            src={lightbox.images[lightbox.index]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          {lightbox.index < lightbox.images.length - 1 && (
            <button
              className="absolute right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
              onClick={e => { e.stopPropagation(); setLightbox(p => ({ ...p, index: p.index + 1 })); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          <div className="absolute bottom-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>
      )}
    </div>
  );
}