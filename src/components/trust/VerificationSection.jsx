import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Upload, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_UI = {
  pending:  { Icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
  approved: { Icon: CheckCircle,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  rejected: { Icon: XCircle,      color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"     },
};

export default function VerificationSection({ user, lang }) {
  const [request, setRequest]   = useState(null);
  const [loadingR, setLoadingR] = useState(true);
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);

  const isAgency = user?.role === "agency";

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.VerificationRequest
      .filter({ user_email: user.email }, "-created_date", 1)
      .then(data => setRequest(data[0] || null))
      .finally(() => setLoadingR(false));
  }, [user?.email]);

  const T = {
    agencyTitle: { fr: "Vérification agence",          en: "Agency Verification",          ar: "التحقق من الوكالة"    },
    idTitle:     { fr: "Vérification d'identité",       en: "Identity Verification",        ar: "التحقق من الهوية"     },
    agencyDesc:  { fr: "Téléversez votre registre de commerce (PDF ou image).", en: "Upload your registre de commerce (PDF or image).", ar: "ارفع سجلك التجاري." },
    idDesc:      { fr: "Téléversez votre carte nationale (recto/verso, PDF ou image).", en: "Upload your national ID card (PDF or image).", ar: "ارفع بطاقة هويتك الوطنية." },
    pendingMsg:  { fr: "Demande en cours de vérification — nous vous répondrons sous 24–48 h.", en: "Under review — we'll get back to you within 24–48 h.", ar: "قيد المراجعة…" },
    approvedMsg: { fr: "Compte vérifié ✓", en: "Verified account ✓", ar: "الحساب موثّق ✓" },
    rejectedMsg: { fr: "Demande refusée.", en: "Request rejected.", ar: "طلب مرفوض." },
    resubmit:    { fr: "Vous pouvez soumettre une nouvelle demande.", en: "You may resubmit.", ar: "يمكنك إعادة الإرسال." },
    chooseFile:  { fr: "Choisir un fichier", en: "Choose file", ar: "اختر ملفاً" },
    submit:      { fr: "Soumettre pour vérification", en: "Submit for verification", ar: "إرسال للتحقق" },
    uploading:   { fr: "Envoi en cours…", en: "Uploading…", ar: "جار الرفع…" },
    adminNote:   { fr: "Note admin: ", en: "Admin note: ", ar: "ملاحظة الإدارة: " },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  if (loadingR) return null;

  const currentStatus = user?.verification_status;

  // Already approved — show confirmation box
  if (currentStatus === "approved") {
    const { Icon, color, bg, border } = STATUS_UI.approved;
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${border} ${bg} mt-2`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-sm font-semibold ${color}`}>{t("approvedMsg")}</span>
      </div>
    );
  }

  // Pending — show status
  if (request?.status === "pending") {
    const { Icon, color, bg, border } = STATUS_UI.pending;
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${border} ${bg} mt-2`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <span className={`text-sm ${color}`}>{t("pendingMsg")}</span>
      </div>
    );
  }

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    const existing = request?.status === "rejected" ? request : null;
    if (existing) {
      await base44.entities.VerificationRequest.update(existing.id, { document_uri: file_uri, status: "pending", admin_note: "" });
      setRequest({ ...existing, document_uri: file_uri, status: "pending", admin_note: "" });
    } else {
      const req = await base44.entities.VerificationRequest.create({
        user_email:  user.email,
        user_name:   user.full_name || user.email,
        type:        isAgency ? "agency" : "individual",
        document_uri: file_uri,
        agency_name: user.agency_name || "",
        status:      "pending",
      });
      setRequest(req);
    }
    await base44.auth.updateMe({ verification_status: "pending", verification_type: isAgency ? "agency" : "individual" });
    setFile(null);
    setUploading(false);
  }

  return (
    <div className="mt-6 border-t pt-5">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-emerald-600" />
        <h3 className="font-semibold text-sm text-gray-800">{isAgency ? t("agencyTitle") : t("idTitle")}</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">{isAgency ? t("agencyDesc") : t("idDesc")}</p>

      {request?.status === "rejected" && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-medium">{t("rejectedMsg")}</p>
          <p className="text-xs text-red-500">{t("resubmit")}</p>
          {request.admin_note && <p className="text-xs text-red-500 mt-1">{t("adminNote")}{request.admin_note}</p>}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 text-sm text-gray-600 transition-colors">
          <FileText className="w-4 h-4" />
          <span className="max-w-[180px] truncate">{file ? file.name : t("chooseFile")}</span>
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] || null)} />
        </label>
        {file && (
          <Button size="sm" onClick={handleSubmit} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-sm">
            <Upload className="w-3.5 h-3.5" />
            {uploading ? t("uploading") : t("submit")}
          </Button>
        )}
      </div>
    </div>
  );
}