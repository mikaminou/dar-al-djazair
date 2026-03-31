import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { Shield, CheckCircle, XCircle, FileText, ExternalLink, Clock, Users, BadgeCheck, BadgeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  pending:  "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

export default function AdminVerification() {
  const { lang } = useLang();
  const [requests, setRequests] = useState([]);
  const [pros,     setPros]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [filter,   setFilter]   = useState("pending");
  const [tab,      setTab]      = useState("requests");
  const [expandId, setExpandId] = useState(null);
  const [note,     setNote]     = useState("");
  const [busy,     setBusy]     = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== "admin") { setLoading(false); return; }
    setIsAdmin(true);
    const [data, allUsers] = await Promise.all([
      base44.entities.VerificationRequest.list("-created_date", 300),
      base44.entities.User.filter({ role: "professional" }, "-created_date", 200).catch(() => []),
    ]);
    setRequests(data);
    setPros(allUsers);
    setLoading(false);
  }

  async function toggleVerified(pro) {
    const newVal = !pro.is_verified;
    await base44.entities.User.update(pro.id, { is_verified: newVal });
    // Also update their listings
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

  async function handleAction(req, action) {
    setBusy(true);
    await base44.functions.invoke("approveVerification", { request_id: req.id, action, admin_note: note });
    const newStatus = action === "approve" ? "approved" : "rejected";
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus, admin_note: note } : r));
    setExpandId(null);
    setNote("");
    setBusy(false);
  }

  const T = {
    title:    { fr: "Administration",             en: "Admin Dashboard",        ar: "لوحة الإدارة"   },
    pending:  { fr: "En attente",                en: "Pending",                ar: "قيد المراجعة"   },
    approved: { fr: "Approuvées",               en: "Approved",               ar: "مقبولة"         },
    rejected: { fr: "Refusées",                 en: "Rejected",               ar: "مرفوضة"         },
    professional: { fr: "Professionnel",             en: "Professional",           ar: "محترف"          },
    individual:{ fr: "Particulier",             en: "Individual",             ar: "فرد"            },
    viewDoc:  { fr: "Voir le document",         en: "View document",          ar: "عرض الوثيقة"    },
    approve:  { fr: "Approuver",                en: "Approve",                ar: "قبول"           },
    reject:   { fr: "Refuser",                  en: "Reject",                 ar: "رفض"            },
    notePlh:  { fr: "Note admin (optionnel)",   en: "Admin note (optional)",  ar: "ملاحظة الإدارة (اختياري)" },
    action:   { fr: "Décider",                  en: "Decide",                 ar: "القرار"         },
    cancel:   { fr: "Annuler",                  en: "Cancel",                 ar: "إلغاء"          },
    noReqs:   { fr: "Aucune demande",           en: "No requests",            ar: "لا توجد طلبات"  },
    notAdmin: { fr: "Accès réservé aux admins", en: "Admin access only",      ar: "للمدير فقط"     },
    adminNote:{ fr: "Note admin: ",             en: "Admin note: ",           ar: "ملاحظة الإدارة: " },
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

  const displayed = requests.filter(r => r.status === filter);

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
        <div className="flex gap-2 mb-6">
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
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${ tab === "pros" ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>{pros.length}</span>
          </button>
        </div>

        {tab === "pros" && (
          <div className="space-y-3 mb-6">
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

        {tab === "requests" && (
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

        {tab === "requests" && (
          displayed.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
              {t("noReqs")}
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(req => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs flex-shrink-0"
                      onClick={() => viewDoc(req)}
                    >
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
                            <Button size="sm" disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs" onClick={() => handleAction(req, "approve")}>
                              <CheckCircle className="w-3.5 h-3.5" /> {t("approve")}
                            </Button>
                            <Button size="sm" variant="outline" disabled={busy} className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 text-xs" onClick={() => handleAction(req, "reject")}>
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
          )
        )}
      </div>
    </div>
  );
}