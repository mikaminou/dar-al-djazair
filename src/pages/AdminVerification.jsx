import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { Shield, CheckCircle, XCircle, FileText, ExternalLink, Clock } from "lucide-react";
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
  const [loading,  setLoading]  = useState(true);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [filter,   setFilter]   = useState("pending");
  const [expandId, setExpandId] = useState(null);
  const [note,     setNote]     = useState("");
  const [busy,     setBusy]     = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== "admin") { setLoading(false); return; }
    setIsAdmin(true);
    const data = await base44.entities.VerificationRequest.list("-created_date", 300);
    setRequests(data);
    setLoading(false);
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
    title:    { fr: "Demandes de vérification",  en: "Verification Requests",  ar: "طلبات التحقق"    },
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
        {/* Filter tabs */}
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

        {displayed.length === 0 ? (
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
                          <Button
                            size="sm"
                            disabled={busy}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs"
                            onClick={() => handleAction(req, "approve")}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> {t("approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 text-xs"
                            onClick={() => handleAction(req, "reject")}
                          >
                            <XCircle className="w-3.5 h-3.5" /> {t("reject")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-gray-500"
                            onClick={() => { setExpandId(null); setNote(""); }}
                          >
                            {t("cancel")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1.5"
                        onClick={() => setExpandId(req.id)}
                      >
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
      </div>
    </div>
  );
}