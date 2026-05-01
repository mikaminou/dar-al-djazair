import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Upload, X, CheckCircle, ChevronRight, MapPin, User, Phone, Mail, AlertTriangle, AlertCircle, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLang } from "../components/LanguageContext";
import { WILAYAS, formatPrice } from "../components/constants";
import { PROPERTY_TYPES, migrateAttributes, getAllPropertyTypes } from "../components/propertyTypes.config";
import { LISTING_CONFIG } from "../components/listing";
import DynamicFormRenderer from "../components/listing/DynamicFormRenderer";

import MobileHeader from "../components/MobileHeader";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import {
  validateStep0, validateStep1, validateStep2, validateStep3, validateStep4,
  validateImageFile, checkImageResolution, fullValidationPass, t as vt,
} from "../components/listing/listingValidation";

const STEPS = ["Type", "Details", "Location", "Photos", "Contact", "Review"];

// ── Small reusable error/warning components ───────────────────────────────────
function FieldError({ msgKey, lang }) {
  if (!msgKey) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {vt(msgKey, lang)}
    </p>
  );
}
function FieldWarning({ msgKey, lang }) {
  if (!msgKey) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-amber-600 mt-1">
      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
      {vt(msgKey, lang)}
    </p>
  );
}
function RequiredMark() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

// ── Step label maps ───────────────────────────────────────────────────────────
const STEP_LABELS = {
  en: ["Type", "Details", "Location", "Photos", "Contact", "Review"],
  fr: ["Type", "Détails", "Localisation", "Photos", "Contact", "Révision"],
  ar: ["النوع", "التفاصيل", "الموقع", "الصور", "التواصل", "المراجعة"],
};

export default function PostListingPage() {
  const { t, lang } = useLang();
  const [step, setStep]             = useState(0);
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError]         = useState("");
  const [authChecked, setAuthChecked]         = useState(false);
  const [currentUser, setCurrentUser]         = useState(null);
  const [editingId, setEditingId]             = useState(null);
  const [errors,   setErrors]   = useState({});
  const [warnings, setWarnings] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [clearedFields, setClearedFields] = useState([]);
  const fileInputRef = useRef(null);

  const initialForm = {
    listing_type:   "sale",
    property_type:  "apartment",
    title:          "",
    description:    "",
    price:          "",
    hide_price:     !LISTING_CONFIG.DEFAULT_PRICE_VISIBLE,
    is_exclusive:   false,
    features:       [],
    attributes:     {},   // single source for all type-specific fields
    wilaya:         "",
    commune:        "",
    address:        "",
    hide_location:  !LISTING_CONFIG.DEFAULT_LOCATION_VISIBLE,
    images:         [],
    contact_name:   "",
    contact_phone:  "",
    contact_email:  "",
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    base44.auth.me().then(me => {
      if (!me) { base44.auth.redirectToLogin(window.location.pathname + window.location.search); return; }
      setCurrentUser(me);
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      if (editId) {
        setEditingId(editId);
        base44.entities.Listing.filter({ id: editId }, "-created_date", 1).then(listings => {
          const listing = listings[0];
          if (!listing) { setAuthChecked(true); return; }
          if (listing.created_by !== me.email) { window.location.href = createPageUrl("MyListings"); return; }
          // Migrate legacy "new_development" to "building"
          const propertyType = listing.property_type === "new_development" ? "building" : (listing.property_type || "apartment");

          // DRAFT MIGRATION: move legacy root-level type-specific keys into attributes
          const migratedAttrs = { ...(listing.attributes || {}) };
          const legacyKeys = ["area", "rooms", "bedrooms", "bathrooms", "floor", "year_built", "furnished"];
          for (const k of legacyKeys) {
            if (listing[k] !== undefined && listing[k] !== null && listing[k] !== "" && migratedAttrs[k] === undefined) {
              migratedAttrs[k] = String(listing[k]);
            }
          }

          // AMENITIES MIGRATION: move legacy flat features into attributes
          // Old schema: features array with strings like "parking", "garden", etc.
          // New schema: attributes.parking = true, attributes.garden = true, etc.
          if (listing.features && Array.isArray(listing.features) && listing.features.length > 0) {
            for (const feat of listing.features) {
              if (!migratedAttrs[feat]) {
                migratedAttrs[feat] = true;
              }
            }
            // Features migrated; will be cleared on save
          }

          setForm({
            listing_type:  listing.listing_type  || "sale",
            property_type: propertyType,
            title:         listing.title         || "",
            description:   listing.description   || "",
            price:         listing.price         || "",
            hide_price:    listing.hide_price     ?? false,
            is_exclusive:  listing.is_exclusive    ?? false,
            features:      listing.features  || [],
            attributes:    migratedAttrs,
            wilaya:        listing.wilaya    || "",
            commune:       listing.commune   || "",
            address:       listing.address   || "",
            hide_location: listing.hide_location ?? true,
            images:        listing.images    || [],
            contact_name:  listing.contact_name  || "",
            contact_phone: listing.contact_phone || "",
            contact_email: listing.contact_email || "",
          });
          setAuthChecked(true);
        });
      } else {
        setForm(f => ({
          ...f,
          contact_name:  me.agency_name || me.full_name || "",
          contact_phone: me.phone       || "",
          contact_email: me.email       || "",
        }));
        setAuthChecked(true);
      }
    }).catch(() => base44.auth.redirectToLogin(window.location.href));
  }, []);

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );

  if (currentUser && currentUser.role !== "professional" && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5"><span className="text-3xl">🏢</span></div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4"><span>✦</span>{lang === "ar" ? "منصة للمحترفين الموثوقين فقط" : lang === "fr" ? "Réservé aux professionnels vérifiés" : "Trusted Professionals Only"}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{lang === "ar" ? "حساب محترف موثق مطلوب" : lang === "fr" ? "Compte professionnel vérifié requis" : "A Verified Professional Account is Required"}</h2>
          <button onClick={() => window.location.href = createPageUrl("Profile")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
            {lang === "ar" ? "اذهب إلى ملفي الشخصي" : lang === "fr" ? "Mon profil" : "Go to My Profile"}
          </button>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.role === "professional" && !currentUser.is_verified) {
    const isPending = currentUser.verification_status === "pending";
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isPending ? "bg-amber-50" : "bg-emerald-50"}`}><span className="text-3xl">{isPending ? "⏳" : "🔐"}</span></div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{isPending ? (lang === "ar" ? "طلبك قيد المراجعة" : lang === "fr" ? "Votre dossier est en cours de vérification" : "Your Documents Are Under Review") : (lang === "ar" ? "التحقق مطلوب للنشر" : lang === "fr" ? "Vérification requise pour publier" : "Verification Required to Post")}</h2>
          {!isPending && (
            <button onClick={() => window.location.href = createPageUrl("Profile")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors mt-4">
              {lang === "ar" ? "ارفع مستنداتي" : lang === "fr" ? "Téléverser mes documents" : "Upload My Documents"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When property type changes, migrate shared attribute values and discard non-shared ones
  const changePropertyType = (newType) => {
    setForm(f => {
      const shared = migrateAttributes(f.attributes || {}, f.property_type, newType);
      const allOldKeys = Object.keys(f.attributes || {});
      const keptKeys = Object.keys(shared);
      setClearedFields(allOldKeys.filter(k => !keptKeys.includes(k)));
      return { ...f, property_type: newType, attributes: shared };
    });
  };

  const markTouched = (k) => setTouchedFields(p => ({ ...p, [k]: true }));

  const runValidation = (stepIdx, currentForm) => {
    let e = {}, w = {};
    if (stepIdx === 0) { const r = validateStep0(currentForm); e = r.errors; w = r.warnings; }
    if (stepIdx === 1) { const r = validateStep1(currentForm); e = r.errors; w = r.warnings; }
    if (stepIdx === 2) { const r = validateStep2(currentForm); e = r.errors; w = r.warnings; }
    if (stepIdx === 3) { const r = validateStep3(currentForm.images); e = r.errors; w = r.warnings; }
    if (stepIdx === 4) { const r = validateStep4(currentForm); e = r.errors; w = r.warnings; }
    setErrors(e);
    setWarnings(w);
    return Object.keys(e).length === 0;
  };



  async function uploadImages(files) {
    setUploadError("");
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    if (form.images.length >= LISTING_CONFIG.MAX_IMAGES) {
      setUploadError(vt("photos_max", lang));
      return;
    }

    const remaining = LISTING_CONFIG.MAX_IMAGES - form.images.length;
    const toUpload  = fileList.slice(0, remaining);

    for (const file of toUpload) {
      const { error: typeOrSizeErr } = validateImageFile(file);
      if (typeOrSizeErr) { setUploadError(vt(typeOrSizeErr, lang)); return; }
      const { error: resErr } = await checkImageResolution(file);
      if (resErr) { setUploadError(vt(resErr, lang)); return; }
    }

    setUploadingImages(true);
    try {
      const urls = [];
      for (const file of toUpload) {
        const { url } = await uploadToSupabase(file, 'listing-photos');
        if (url) urls.push(url);
      }
      if (urls.length > 0) setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      else setUploadError(lang === "ar" ? "فشل رفع الصور" : lang === "fr" ? "Téléchargement échoué" : "Upload failed");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function tryNextStep() {
    // Mark all fields in current step as touched
    setTouchedFields(p => {
      const all = { ...p };
      const keys = {
      0: ["listing_type", "property_type"],
      1: ["title", "price"],
      2: ["wilaya", "commune", "address"],
        3: ["images"],
        4: ["contact_name", "contact_phone", "contact_email"],
      };
      (keys[step] || []).forEach(k => { all[k] = true; });
      return all;
    });
    const valid = runValidation(step, form);
    if (valid) {
      setErrors({});
      setStep(s => s + 1);
    }
  }

  async function submit() {
    setSaving(true);
    // Convert numeric attribute values to numbers before saving.
    const coercedAttrs = {};
    for (const [k, v] of Object.entries(form.attributes || {})) {
      if (typeof v === "boolean") { coercedAttrs[k] = v; continue; }
      if (Array.isArray(v))       { coercedAttrs[k] = v; continue; }
      if (v === "" || v === null || v === undefined) continue;
      const n = Number(v);
      coercedAttrs[k] = (!isNaN(n) && typeof v !== "boolean") ? n : v;
    }
    // Type-specific attributes are now real columns — spread them onto the
    // top-level payload so they reach the DB. We keep `attributes` too for
    // any legacy server still expecting it.
    const { attributes: _ignore, ...formNoAttrs } = form;
    const payload = {
      ...formNoAttrs,
      ...coercedAttrs,
      price: Number(form.price) || 0,
      area:  coercedAttrs.area ?? coercedAttrs.total_area ?? undefined,
      attributes: coercedAttrs,
      features: [], // legacy field — amenities are columns now
    };
    if (editingId) {
      const existing = await base44.entities.Listing.filter({ id: editingId }, null, 1).catch(() => []);
      if (existing[0]?.status === "changes_requested" || existing[0]?.status === "declined") {
        payload.status     = "pending";
        payload.admin_note = null;
      }
      await base44.entities.Listing.update(editingId, payload);
    } else {
      const created = await base44.entities.Listing.create({ ...payload, status: "pending" });
      // Fire exclusivity conflict check in background
      if (created?.id) {
        base44.functions.invoke("checkExclusivityConflict", { listing_id: created.id }).catch(() => {});
      }
    }
    setSaving(false);
    setDone(true);
  }


  const isEditing = !!editingId;
  const stepLabel = (i) => (STEP_LABELS[lang] || STEP_LABELS.en)[i];

  // ── Review summary data ───────────────────────────────────────────────────
  const reviewStepErrors = fullValidationPass(form, form.images);
  const anyReviewError   = Object.values(reviewStepErrors).some(Boolean);

  const reviewSections = [
    {
      label: lang === "ar" ? "النوع" : lang === "fr" ? "Type" : "Type",
      hasError: reviewStepErrors[0],
      items: [
        { label: lang === "ar" ? "نوع الإعلان" : lang === "fr" ? "Type d'annonce" : "Listing type", value: form.listing_type },
        { label: lang === "ar" ? "نوع العقار"  : lang === "fr" ? "Type de bien"   : "Property type", value: form.property_type },
      ],
    },
    {
      label: lang === "ar" ? "التفاصيل" : lang === "fr" ? "Détails" : "Details",
      hasError: reviewStepErrors[1],
      items: [
        { label: lang === "ar" ? "العنوان" : lang === "fr" ? "Titre" : "Title", value: form.title },
        { label: lang === "ar" ? "السعر"   : lang === "fr" ? "Prix"  : "Price", value: form.price ? formatPrice(Number(form.price), lang) : "—" },
        ...Object.entries(form.attributes || {}).slice(0, 6).map(([k, v]) => ({
          label: k,
          value: v === true ? "✓" : v === false ? "✗" : String(v),
        })),
      ],
    },
    {
      label: lang === "ar" ? "الموقع" : lang === "fr" ? "Localisation" : "Location",
      hasError: reviewStepErrors[2],
      items: [
        { label: lang === "ar" ? "الولاية"  : lang === "fr" ? "Wilaya"   : "Wilaya",  value: form.wilaya  || "—" },
        { label: lang === "ar" ? "البلدية"  : lang === "fr" ? "Commune"  : "Commune", value: form.commune || "—" },
        { label: lang === "ar" ? "العنوان"  : lang === "fr" ? "Adresse"  : "Address", value: form.address || "—" },
      ],
    },
    {
      label: lang === "ar" ? "الصور" : lang === "fr" ? "Photos" : "Photos",
      hasError: reviewStepErrors[3],
      items: [{ label: lang === "ar" ? "عدد الصور" : lang === "fr" ? "Nombre de photos" : "Photos uploaded", value: form.images.length }],
    },
    {
      label: lang === "ar" ? "التواصل" : lang === "fr" ? "Contact" : "Contact",
      hasError: reviewStepErrors[4],
      items: [
        { label: lang === "ar" ? "الاسم"       : lang === "fr" ? "Nom"      : "Name",  value: form.contact_name  || "—" },
        { label: lang === "ar" ? "الهاتف"      : lang === "fr" ? "Tél."     : "Phone", value: form.contact_phone || "—" },
        { label: lang === "ar" ? "البريد الإلكتروني" : lang === "fr" ? "Email" : "Email", value: form.contact_email || "—" },
      ],
    },
  ];

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditing
            ? (lang === "ar" ? "تم تحديث إعلانك!" : lang === "fr" ? "Annonce mise à jour !" : "Listing Updated!")
            : (lang === "ar" ? "تم إرسال إعلانك!" : lang === "fr" ? "Annonce soumise !" : "Listing Submitted!")}
        </h2>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          {lang === "ar"
            ? "سيتم مراجعة إعلانك من قِبَل فريقنا قبل نشره. ستتلقى إشعاراً بمجرد الموافقة عليه."
            : lang === "fr"
            ? "Votre annonce sera examinée par notre équipe avant d'être publiée. Vous serez notifié dès son approbation."
            : "Your listing will be reviewed by our team before being published. You will be notified once it is approved."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.href = createPageUrl("MyListings")} className="bg-emerald-600 hover:bg-emerald-700">{t.myListings}</Button>
          {!isEditing && (
            <Button variant="outline" onClick={() => { setDone(false); setStep(0); setForm({ ...initialForm, contact_name: currentUser?.full_name || "", contact_phone: currentUser?.phone || "", contact_email: currentUser?.email || "" }); setErrors({}); setWarnings({}); setTouchedFields({}); }}>
              {lang === "ar" ? "إعلان آخر" : lang === "fr" ? "Autre annonce" : "New listing"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title={isEditing ? t.editListing : t.postListing} />

      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="hidden md:block text-xl font-bold mb-4">
            {isEditing ? (lang === "ar" ? "تعديل الإعلان" : lang === "fr" ? "Modifier l'annonce" : "Edit Listing") : t.postListing}
          </h1>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${i < step ? "bg-amber-400" : i === step ? "bg-white" : "bg-white/20"}`} />
                <span className="text-[10px] text-white/60 hidden sm:block">{stepLabel(i)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Step title bar */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2 text-emerald-700">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">{step + 1}</span>
              <h2 className="text-base font-semibold">{stepLabel(step)}</h2>
            </div>
          </div>

          <div className="p-6">

            {/* ── STEP 0: Type ─────────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-3 block">
                    {lang === "ar" ? "نوع العملية" : lang === "fr" ? "Type de transaction" : "Transaction Type"}<RequiredMark />
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["sale", "rent"].map(type => (
                      <button key={type} onClick={() => { set("listing_type", type); markTouched("listing_type"); }}
                        className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all ${form.listing_type === type ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-emerald-200"}`}>
                        {type === "sale" ? t.sale : t.forRent}
                      </button>
                    ))}
                  </div>
                  <FieldError msgKey={touchedFields.listing_type ? errors.listing_type : null} lang={lang} />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-3 block">{t.propertyType}<RequiredMark /></Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PROPERTY_TYPES.map(pt => (
                      <button key={pt.value} onClick={() => { changePropertyType(pt.value); markTouched("property_type"); }}
                        className={`py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all flex flex-col items-center gap-1 ${form.property_type === pt.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-emerald-200"}`}>
                        <span>{pt.icon}</span>
                        <span>{pt.label[lang] || pt.label.fr}</span>
                      </button>
                    ))}
                  </div>
                  {clearedFields.length > 0 && (
                    <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      {lang === "ar" ? "تم مسح الحقول غير المتوافقة:" : lang === "fr" ? "Champs effacés (incompatibles) :" : "Cleared incompatible fields:"} {clearedFields.join(", ")}
                    </div>
                  )}
                  <FieldError   msgKey={touchedFields.property_type ? errors.property_type   : null} lang={lang} />
                  <FieldWarning msgKey={warnings.property_type} lang={lang} />
                </div>
              </div>
            )}

            {/* ── STEP 1: Details ──────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t.titleLabel}<RequiredMark /></Label>
                  <Input
                    value={form.title}
                    onChange={e => set("title", e.target.value)}
                    onBlur={() => { markTouched("title"); runValidation(1, form); }}
                    placeholder={lang === "ar" ? "مثال: شقة 3 غرف في وهران" : lang === "fr" ? "Ex: Appartement 3 pièces à Oran" : "Ex: 3-room apartment in Oran"}
                    className={`border-gray-200 focus:border-emerald-400 ${errors.title && touchedFields.title ? "border-red-400" : ""}`}
                  />
                  <FieldError msgKey={touchedFields.title ? errors.title : null} lang={lang} />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-bold text-gray-900 mb-2.5 block">{t.description}</Label>
                  <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className="resize-none" placeholder={lang === "ar" ? "صف العقار بالتفصيل..." : lang === "fr" ? "Décrivez le bien en détail..." : "Describe the property in detail..."} />
                </div>

                {/* Price */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t.priceLabel}<RequiredMark /></Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={form.price}
                      onChange={e => set("price", e.target.value)}
                      onBlur={() => { markTouched("price"); runValidation(1, form); }}
                      placeholder={lang === "ar" ? "مثال: 5000000" : lang === "fr" ? "Ex: 5000000" : "Ex: 5000000"}
                      className={`border-gray-200 focus:border-emerald-400 pr-12 ${errors.price && touchedFields.price ? "border-red-400" : ""}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">DA</span>
                  </div>
                  <FieldError   msgKey={touchedFields.price ? errors.price   : null} lang={lang} />
                  <FieldWarning msgKey={warnings.price} lang={lang} />
                  {LISTING_CONFIG.ALLOW_HIDE_PRICE && (
                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                      <input type="checkbox" checked={form.hide_price} onChange={e => set("hide_price", e.target.checked)} className="accent-emerald-600 w-4 h-4" />
                      <span className="text-sm text-gray-700 font-medium">{lang === "ar" ? "إخفاء السعر" : lang === "fr" ? "Masquer le prix" : "Hide price"}</span>
                    </label>
                  )}
                </div>

                {/* Mandat Exclusif — Moved outside price block */}
                <div className="border border-amber-100 rounded-xl p-4 bg-amber-50">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_exclusive} onChange={e => set("is_exclusive", e.target.checked)} className="accent-emerald-600 w-4 h-4 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">{lang === "ar" ? "تفويض حصري" : lang === "fr" ? "Mandat exclusif" : "Exclusive Mandate"}</span>
                      <span className="text-xs text-gray-600 mt-1 block">{lang === "ar" ? "هذا العقار مسجل حصرياً لدى وكالتك فقط." : lang === "fr" ? "Ce bien ne doit être commercialisé que par votre agence." : "This property is listed exclusively with your agency only."}</span>
                    </div>
                  </label>
                </div>

                {/* Property Details — DynamicFormRenderer is the ONLY source */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">⚙</div>
                    <h3 className="text-sm font-bold text-emerald-900">
                      {lang === "ar" ? "تفاصيل العقار" : lang === "fr" ? "Détails du bien" : "Property Details"}
                    </h3>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-5">
                    <DynamicFormRenderer
                      propertyType={form.property_type}
                      listingType={form.listing_type}
                      value={form.attributes || {}}
                      onChange={(key, val) => setForm(f => ({ ...f, attributes: { ...f.attributes, [key]: val } }))}
                      errors={errors}
                      warnings={warnings}
                      lang={lang}
                    />
                  </div>
                </div>


              </div>
            )}

            {/* ── STEP 2: Location ─────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xl">🇩🇿</span>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{lang === "ar" ? "الدولة" : lang === "fr" ? "Pays" : "Country"}</p>
                    <p className="text-sm font-semibold text-gray-700">{lang === "ar" ? "الجزائر" : "Algérie"}</p>
                  </div>
                </div>

                {/* Wilaya */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />{t.wilaya}<RequiredMark />
                  </Label>
                  <Select value={form.wilaya} onValueChange={v => { set("wilaya", v); set("commune", ""); set("address", ""); markTouched("wilaya"); }}>
                    <SelectTrigger className={`border-gray-200 ${errors.wilaya && touchedFields.wilaya ? "border-red-400" : ""}`}>
                      <SelectValue placeholder={lang === "ar" ? "اختر الولاية" : lang === "fr" ? "Sélectionner la wilaya" : "Select a wilaya"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {WILAYAS.map(w => <SelectItem key={w.value} value={w.value}>{w.label[lang] || w.label.fr}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError msgKey={touchedFields.wilaya ? errors.wilaya : null} lang={lang} />
                </div>

                {/* Commune — free text input */}
                <div className={`transition-all duration-200 ${form.wilaya ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs ${form.wilaya ? "border-emerald-500 text-emerald-600" : "border-gray-300 text-gray-400"}`}>2</span>
                    {t.commune}<RequiredMark />
                    {!form.wilaya && <span className="text-xs text-gray-400 font-normal">({lang === "ar" ? "اختر الولاية أولاً" : lang === "fr" ? "Choisissez la wilaya d'abord" : "Select wilaya first"})</span>}
                  </Label>
                  <Input
                    value={form.commune}
                    onChange={e => { set("commune", e.target.value); }}
                    onBlur={() => { markTouched("commune"); runValidation(2, form); }}
                    disabled={!form.wilaya}
                    placeholder={lang === "ar" ? "اسم البلدية" : lang === "fr" ? "Nom de la commune" : "Commune name"}
                    className={`border-gray-200 focus:border-emerald-400 ${errors.commune && touchedFields.commune ? "border-red-400" : ""}`}
                  />
                  <FieldError msgKey={touchedFields.commune ? errors.commune : null} lang={lang} />
                </div>

                {/* Address */}
                <div className={`transition-all duration-200 ${form.commune ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs ${form.commune ? "border-emerald-500 text-emerald-600" : "border-gray-300 text-gray-400"}`}>3</span>
                    {t.addressLabel}
                    <span className="text-xs text-gray-400 font-normal">({lang === "ar" ? "اختياري" : lang === "fr" ? "Optionnel" : "Optional"})</span>
                  </Label>
                  <Input
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                    onBlur={() => { markTouched("address"); runValidation(2, form); }}
                    className={`border-gray-200 focus:border-emerald-400 ${errors.address && touchedFields.address ? "border-red-400" : ""}`}
                    disabled={!form.commune}
                    placeholder={form.commune ? `${form.commune}${form.wilaya ? ", " + form.wilaya : ""}...` : ""}
                  />
                  <FieldError msgKey={touchedFields.address ? errors.address : null} lang={lang} />
                </div>

                {LISTING_CONFIG.ALLOW_HIDE_LOCATION && (
                  <label className="flex items-center gap-2 cursor-pointer bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <input type="checkbox" checked={form.hide_location} onChange={e => set("hide_location", e.target.checked)} className="accent-emerald-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">{lang === "ar" ? "إخفاء الموقع التفصيلي" : lang === "fr" ? "Masquer l'emplacement exact" : "Hide exact location"}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{lang === "ar" ? "سيُعرض الولاية فقط." : lang === "fr" ? "Seule la wilaya sera affichée." : "Only the wilaya will be shown publicly."}</p>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* ── STEP 3: Photos ───────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Cover photo note */}
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {lang === "ar"
                    ? "الصورة الأولى ستُستخدم كصورة غلاف للإعلان."
                    : lang === "fr"
                    ? "La première photo sera utilisée comme image de couverture de l'annonce."
                    : "The first photo will be used as the listing cover image."}
                </div>

                <label className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all ${uploadingImages || form.images.length >= LISTING_CONFIG.MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-9 h-9 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    {lang === "ar" ? "اضغط لرفع الصور" : lang === "fr" ? "Cliquez pour ajouter des photos" : "Click to upload photos"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, WEBP — max {LISTING_CONFIG.MAX_IMAGE_SIZE_MB} MB — {form.images.length}/{LISTING_CONFIG.MAX_IMAGES} {lang === "ar" ? "صور" : lang === "fr" ? "photos" : "images"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={LISTING_CONFIG.ACCEPTED_IMAGE_TYPES.join(",")}
                    className="hidden"
                    onChange={e => uploadImages(e.target.files)}
                  />
                </label>

                {uploadError && <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4" />{uploadError}</p>}
                <FieldError msgKey={errors.images} lang={lang} />

                {uploadingImages && (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    {lang === "ar" ? "جاري الرفع..." : lang === "fr" ? "Téléchargement..." : "Uploading..."}
                  </div>
                )}

                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden">
                        <img src={url} alt="" className="w-full h-24 object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                            {lang === "ar" ? "رئيسي" : lang === "fr" ? "Principal" : "Cover"}
                          </span>
                        )}
                        <button onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Contact ──────────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-5">
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  {lang === "ar" ? "تم ملء بياناتك تلقائياً. يمكنك تعديلها إذا أردت." : lang === "fr" ? "Vos coordonnées ont été pré-remplies. Vous pouvez les modifier." : "Your contact info is pre-filled from your profile. You can edit it below."}
                </p>

                {/* Name */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />{t.nameLabel}<RequiredMark />
                  </Label>
                  <Input
                    value={form.contact_name}
                    onChange={e => set("contact_name", e.target.value)}
                    onBlur={() => { markTouched("contact_name"); runValidation(4, form); }}
                    className={`border-gray-200 focus:border-emerald-400 ${errors.contact_name && touchedFields.contact_name ? "border-red-400" : ""}`}
                    placeholder={t.nameLabel}
                  />
                  <FieldError msgKey={touchedFields.contact_name ? errors.contact_name : null} lang={lang} />
                </div>

                {/* Phone */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />{t.phoneLabel}
                    <span className="text-xs text-gray-400 font-normal">({lang === "ar" ? "أو البريد الإلكتروني" : lang === "fr" ? "ou email" : "or email"})</span>
                  </Label>
                  <Input
                    value={form.contact_phone}
                    onChange={e => set("contact_phone", e.target.value)}
                    onBlur={() => { markTouched("contact_phone"); runValidation(4, form); }}
                    className={`border-gray-200 focus:border-emerald-400 ${errors.contact_phone && touchedFields.contact_phone ? "border-red-400" : ""}`}
                    placeholder="05XX XXX XXX"
                  />
                  <FieldError msgKey={touchedFields.contact_phone ? errors.contact_phone : null} lang={lang} />
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />{t.emailLabel}
                  </Label>
                  <Input
                    type="email"
                    value={form.contact_email}
                    onChange={e => set("contact_email", e.target.value)}
                    onBlur={() => { markTouched("contact_email"); runValidation(4, form); }}
                    className={`border-gray-200 focus:border-emerald-400 ${errors.contact_email && touchedFields.contact_email ? "border-red-400" : ""}`}
                    placeholder="email@example.com"
                  />
                  <FieldError msgKey={touchedFields.contact_email ? errors.contact_email : null} lang={lang} />
                </div>
              </div>
            )}

            {/* ── STEP 5: Review ───────────────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-4">
                {/* Submission note */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-emerald-800">
                  <ClipboardList className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {lang === "ar"
                    ? "سيتم مراجعة إعلانك من قِبَل فريقنا قبل نشره. ستتلقى إشعاراً بمجرد الموافقة عليه."
                    : lang === "fr"
                    ? "Votre annonce sera examinée par notre équipe avant d'être publiée. Vous serez notifié dès son approbation."
                    : "Your listing will be reviewed by our team before being published. You will be notified once it is approved."}
                </div>

                {anyReviewError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {lang === "ar"
                      ? "هناك أخطاء في بعض الخطوات. يرجى العودة وتصحيحها قبل الإرسال."
                      : lang === "fr"
                      ? "Certaines étapes contiennent des erreurs. Veuillez les corriger avant de soumettre."
                      : "Some steps have errors. Please go back and fix them before submitting."}
                  </div>
                )}

                {reviewSections.map((section, idx) => (
                  <div key={idx} className={`rounded-xl border p-4 ${section.hasError ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-white"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-bold ${section.hasError ? "text-red-700" : "text-gray-800"}`}>
                        {section.hasError && <AlertCircle className="w-3.5 h-3.5 inline mr-1" />}
                        {section.label}
                      </h3>
                      {section.hasError && (
                        <button onClick={() => setStep(idx)} className="text-xs text-red-600 underline font-medium">
                          {lang === "ar" ? "تصحيح" : lang === "fr" ? "Corriger" : "Fix"}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {section.items.map((item, j) => (
                        <div key={j} className="text-xs">
                          <span className="text-gray-400">{item.label}: </span>
                          <span className="text-gray-800 font-medium">{String(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Cover photo preview */}
                {form.images.length > 0 && (
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">
                      {lang === "ar" ? "صورة الغلاف" : lang === "fr" ? "Photo de couverture" : "Cover Photo"}
                    </h3>
                    <img src={form.images[0]} alt="cover" className="w-full h-40 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Navigation footer */}
          <div className="flex justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button
              variant="outline"
              onClick={() => { setErrors({}); setWarnings({}); setStep(s => s - 1); }}
              disabled={step === 0}
              className="border-gray-200"
            >
              {lang === "ar" ? "السابق" : lang === "fr" ? "Précédent" : "Previous"}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={tryNextStep} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                {lang === "ar" ? "التالي" : lang === "fr" ? "Suivant" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={saving || anyReviewError}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving
                  ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{t.loading}</span>
                  : isEditing
                    ? (lang === "ar" ? "حفظ التعديلات" : lang === "fr" ? "Enregistrer" : "Save Changes")
                    : t.publishListing}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}