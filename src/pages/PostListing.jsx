import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Upload, X, CheckCircle, ChevronRight, MapPin, User, Phone, Mail, Building2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLang } from "../components/LanguageContext";
import { WILAYAS, PROPERTY_TYPES, FEATURES_LIST } from "../components/constants";
import { LISTING_CONFIG } from "../components/listing.config";
import { COMMUNES_BY_WILAYA } from "../components/communesData";
import MobileHeader from "../components/MobileHeader";

const STEPS = ["Type", "Details", "Location", "Photos", "Contact"];

export default function PostListingPage() {
  const { t, lang } = useLang();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingId, setEditingId] = useState(null); // null = create, string = edit mode
  const fileInputRef = useRef(null);

  const initialForm = {
    listing_type: "sale",
    property_type: "apartment",
    title: "",
    description: "",
    price: 0,
    hide_price: !LISTING_CONFIG.DEFAULT_PRICE_VISIBLE,
    area: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    year_built: "",
    furnished: "",
    features: [],
    wilaya: "",
    commune: "",
    address: "",
    hide_location: !LISTING_CONFIG.DEFAULT_LOCATION_VISIBLE,
    images: [],
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    base44.auth.me().then(me => {
      if (!me) {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        return;
      }
      setCurrentUser(me);

      // Check if editing
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      if (editId) {
        setEditingId(editId);
        base44.entities.Listing.filter({ id: editId }, "-created_date", 1).then(listings => {
          const listing = listings[0];
          if (!listing) { setAuthChecked(true); return; }
          if (listing.created_by !== me.email) {
            // Not the owner — redirect
            window.location.href = createPageUrl("MyListings");
            return;
          }
          setForm({
            listing_type: listing.listing_type || "sale",
            property_type: listing.property_type || "apartment",
            title: listing.title || "",
            description: listing.description || "",
            price: listing.price || "",
            hide_price: listing.hide_price ?? false,
            area: listing.area ? String(listing.area) : "",
            rooms: listing.rooms ? String(listing.rooms) : "",
            bedrooms: listing.bedrooms ? String(listing.bedrooms) : "",
            bathrooms: listing.bathrooms ? String(listing.bathrooms) : "",
            floor: listing.floor ? String(listing.floor) : "",
            year_built: listing.year_built ? String(listing.year_built) : "",
            furnished: listing.furnished || "",
            features: listing.features || [],
            wilaya: listing.wilaya || "",
            commune: listing.commune || "",
            address: listing.address || "",
            hide_location: listing.hide_location ?? true,
            images: listing.images || [],
            contact_name: listing.contact_name || "",
            contact_phone: listing.contact_phone || "",
            contact_email: listing.contact_email || "",
          });
          setAuthChecked(true);
        });
      } else {
        // Pre-fill contact from profile — agency name first, then full name
        setForm(f => ({
          ...f,
          contact_name: me.agency_name || me.full_name || "",
          contact_phone: me.phone || "",
          contact_email: me.email || "",
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

  // Access gate: only verified professionals can post
  if (currentUser && currentUser.role !== 'professional' && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">🏢</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <span>✦</span>
            {lang === 'ar' ? 'منصة للمحترفين الموثوقين فقط' : lang === 'fr' ? 'Réservé aux professionnels vérifiés' : 'Trusted Professionals Only'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {lang === 'ar' ? 'حساب محترف موثق مطلوب' : lang === 'fr' ? 'Compte professionnel vérifié requis' : 'A Verified Professional Account is Required'}
          </h2>
          <p className="text-gray-500 mb-2 text-sm leading-relaxed">
            {lang === 'ar'
              ? 'دار الجزائر مخصصة حصرياً للوكالات العقارية والمهنيين الموثقين. هذا ما يجعل منصتنا موثوقة من قِبل آلاف المشترين والمستأجرين.'
              : lang === 'fr'
              ? "Dar Al Djazair est exclusivement réservée aux agences et professionnels immobiliers vérifiés — c'est ce qui garantit la confiance de nos milliers d'acheteurs et locataires."
              : "Dar Al Djazair is exclusively for verified real estate agencies and professionals. This is what makes our platform trusted by thousands of buyers and renters across Algeria."}
          </p>
          <p className="text-gray-400 text-xs mb-6">
            {lang === 'ar' ? 'سجّل كمحترف وارفع مستنداتك للحصول على التحقق خلال يوم عمل واحد.' : lang === 'fr' ? 'Inscrivez-vous comme professionnel et soumettez vos documents — vérification sous 1 jour ouvrable.' : 'Register as a professional and submit your documents — verification within 1 business day.'}
          </p>
          <button onClick={() => window.location.href = createPageUrl('Profile')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
            {lang === 'ar' ? 'اذهب إلى ملفي الشخصي' : lang === 'fr' ? 'Mon profil' : 'Go to My Profile'}
          </button>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.role === 'professional' && !currentUser.is_verified) {
    const isPending = currentUser.verification_status === 'pending';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isPending ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <span className="text-3xl">{isPending ? '⏳' : '🔐'}</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4 ${isPending ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <span>✦</span>
            {lang === 'ar' ? 'منصة للمحترفين الموثوقين فقط' : lang === 'fr' ? 'Réservé aux professionnels vérifiés' : 'Trusted Professionals Only'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {isPending
              ? (lang === 'ar' ? 'طلبك قيد المراجعة' : lang === 'fr' ? 'Votre dossier est en cours de vérification' : 'Your Documents Are Under Review')
              : (lang === 'ar' ? 'التحقق مطلوب للنشر' : lang === 'fr' ? 'Vérification requise pour publier' : 'Verification Required to Post')}
          </h2>
          <p className="text-gray-500 mb-2 text-sm leading-relaxed">
            {isPending
              ? (lang === 'ar'
                  ? 'فريقنا يراجع مستنداتك حالياً. ستتلقى إشعاراً وبريداً إلكترونياً فور الانتهاء — في غضون يوم عمل واحد.'
                  : lang === 'fr'
                  ? "Notre équipe examine actuellement vos documents. Vous recevrez une notification et un e-mail dès que la vérification sera terminée — sous 1 jour ouvrable."
                  : "Our team is currently reviewing your documents. You'll receive a notification and email as soon as the verification is complete — within 1 business day.")
              : (lang === 'ar'
                  ? 'نشر الإعلانات حصري للمهنيين الموثقين. هذا ما يضمن ثقة آلاف المشترين والمستأجرين في منصتنا.'
                  : lang === 'fr'
                  ? "La publication est réservée aux professionnels vérifiés — c'est ce qui garantit la confiance de nos acheteurs et locataires."
                  : "Posting is exclusive to verified professionals — this is what ensures the trust of our buyers and renters.")}
          </p>
          {!isPending && (
            <p className="text-gray-400 text-xs mb-6">
              {lang === 'ar' ? 'ارفع مستنداتك من ملفك الشخصي وسنراجعها خلال يوم عمل واحد.' : lang === 'fr' ? 'Téléversez vos documents depuis votre profil — vérification sous 1 jour ouvrable.' : 'Upload your documents from your profile — we review within 1 business day.'}
            </p>
          )}
          {isPending && <div className="mb-6" />}
          {!isPending && (
            <button onClick={() => window.location.href = createPageUrl('Profile')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors">
              {lang === 'ar' ? 'ارفع مستنداتي' : lang === 'fr' ? 'Téléverser mes documents' : 'Upload My Documents'}
            </button>
          )}
          {isPending && (
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 font-medium">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              {lang === 'ar' ? 'في انتظار نتيجة المراجعة...' : lang === 'fr' ? 'En attente de vérification...' : 'Awaiting verification result...'}
            </div>
          )}
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFeature = (feat) => {
    set("features", form.features.includes(feat)
      ? form.features.filter(f => f !== feat)
      : [...form.features, feat]
    );
  };

  async function uploadImages(files, inputRef) {
    setUploadError("");
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    const remaining = LISTING_CONFIG.MAX_IMAGES - form.images.length;
    if (remaining <= 0) {
      setUploadError(lang === "ar" ? `الحد الأقصى ${LISTING_CONFIG.MAX_IMAGES} صور` : lang === "fr" ? `Maximum ${LISTING_CONFIG.MAX_IMAGES} photos autorisées` : `Maximum ${LISTING_CONFIG.MAX_IMAGES} images allowed`);
      return;
    }
    const toUpload = fileList.slice(0, remaining);
    const oversized = toUpload.filter(f => f.size > LISTING_CONFIG.MAX_IMAGE_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      setUploadError(lang === "ar" ? `حجم الصورة يجب أن يكون أقل من ${LISTING_CONFIG.MAX_IMAGE_SIZE_MB} ميغابايت` : lang === "fr" ? `Taille max par photo : ${LISTING_CONFIG.MAX_IMAGE_SIZE_MB} Mo` : `Each image must be under ${LISTING_CONFIG.MAX_IMAGE_SIZE_MB} MB`);
      return;
    }
    setUploadingImages(true);
    try {
      const urls = [];
      for (const file of toUpload) {
        try {
          console.log('Uploading file:', file.name, file.type, file.size);
          const res = await base44.integrations.Core.UploadFile({ file });
          console.log('Upload response:', res);
          console.log('Response data:', res?.data);
          const fileUrl = res?.file_url || res?.data?.file_url;
          if (fileUrl) {
            console.log('Got file URL:', fileUrl);
            urls.push(fileUrl);
          } else {
            console.error('No file_url in response:', JSON.stringify(res));
          }
        } catch (fileErr) {
          console.error('Failed to upload file:', file.name, fileErr);
          throw fileErr;
        }
      }
      if (urls.length > 0) {
        setForm(f => ({ ...f, images: [...f.images, ...urls] }));
        console.log('Images added:', urls);
      } else {
        setUploadError(lang === "ar" ? "فشل رفع الصور" : lang === "fr" ? "Téléchargement échoué" : "Upload failed");
      }
      if (inputRef) inputRef.value = "";
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(lang === "ar" ? "خطأ في رفع الصور: " + err.message : lang === "fr" ? "Erreur lors du téléchargement: " + err.message : "Error uploading images: " + err.message);
    } finally {
      setUploadingImages(false);
    }
  }

  async function submit() {
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      area: form.area ? Number(form.area) : undefined,
      rooms: form.rooms ? Number(form.rooms) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      floor: form.floor ? Number(form.floor) : undefined,
      year_built: form.year_built ? Number(form.year_built) : undefined,
    };
    if (editingId) {
      await base44.entities.Listing.update(editingId, payload);
    } else {
      await base44.entities.Listing.create({ ...payload, status: "active", active_since: new Date().toISOString() });
    }
    setSaving(false);
    setDone(true);
  }

  const communes = form.wilaya ? (COMMUNES_BY_WILAYA[form.wilaya] || []) : [];
  const isEditing = !!editingId;

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isEditing
            ? (lang === "ar" ? "تم تحديث إعلانك!" : lang === "fr" ? "Annonce mise à jour !" : "Listing Updated!")
            : (lang === "ar" ? "تم نشر إعلانك!" : lang === "fr" ? "Annonce publiée !" : "Listing Published!")}
        </h2>
        <p className="text-gray-500 mb-6">
          {lang === "ar" ? "سيتمكن آلاف الزوار من رؤية إعلانك" : lang === "fr" ? "Des milliers de visiteurs verront votre annonce" : "Thousands of visitors will see your listing"}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.href = createPageUrl("MyListings")} className="bg-emerald-600 hover:bg-emerald-700">
            {t.myListings}
          </Button>
          {!isEditing && (
            <Button variant="outline" onClick={() => { setDone(false); setStep(0); setForm({ ...initialForm, contact_name: currentUser?.full_name || "", contact_phone: currentUser?.phone || "", contact_email: currentUser?.email || "" }); }}>
              {lang === "ar" ? "إعلان آخر" : lang === "fr" ? "Autre annonce" : "New listing"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const stepLabel = (i) => {
    const labels = {
      en: ["Type", "Details", "Location", "Photos", "Contact"],
      fr: ["Type", "Détails", "Localisation", "Photos", "Contact"],
      ar: ["النوع", "التفاصيل", "الموقع", "الصور", "التواصل"],
    };
    return (labels[lang] || labels.en)[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader title={isEditing ? t.editListing : t.postListing} />

      {/* Progress header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="hidden md:block text-xl font-bold mb-4">
            {isEditing
              ? (lang === "ar" ? "تعديل الإعلان" : lang === "fr" ? "Modifier l'annonce" : "Edit Listing")
              : t.postListing}
          </h1>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
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

            {/* STEP 0: Type */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-3 block">
                    {lang === "ar" ? "نوع العملية" : lang === "fr" ? "Type de transaction" : "Transaction Type"}
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {["sale", "rent"].map(type => (
                      <button
                        key={type}
                        onClick={() => set("listing_type", type)}
                        className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all ${form.listing_type === type
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-500 hover:border-emerald-200 hover:text-emerald-600"
                        }`}
                      >
                        {type === "sale" ? t.sale : t.forRent}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-3 block">{t.propertyType}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PROPERTY_TYPES.map(pt => (
                      <button
                        key={pt.value}
                        onClick={() => set("property_type", pt.value)}
                        className={`py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${form.property_type === pt.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-500 hover:border-emerald-200 hover:text-emerald-600"
                        }`}
                      >
                        {pt.label[lang] || pt.label.fr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Title Section */}
                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 rounded-2xl p-5">
                  <Label className="text-sm font-bold text-emerald-900 mb-2.5 block flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✎</span>
                    {t.titleLabel}
                  </Label>
                  <Input
                    value={form.title}
                    onChange={e => set("title", e.target.value)}
                    placeholder={lang === "ar" ? "مثال: شقة 3 غرف في وهران" : lang === "fr" ? "Ex: Appartement 3 pièces à Oran" : "Ex: 3-room apartment in Oran"}
                    className="border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-sm font-bold text-gray-900 mb-2.5 block flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">≡</span>
                    {t.description}
                  </Label>
                  <Textarea
                    value={form.description}
                    onChange={e => set("description", e.target.value)}
                    rows={3}
                    className="border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
                    placeholder={lang === "ar" ? "صف العقار بالتفصيل..." : lang === "fr" ? "Décrivez le bien en détail..." : "Describe the property in detail..."}
                  />
                </div>

                {/* Price & Area */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-purple-100 rounded-xl p-4 bg-purple-50/50">
                    <Label className="text-xs font-bold text-purple-900 mb-2.5 block">{t.priceLabel}</Label>
                    <Input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" className="border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
                    {LISTING_CONFIG.ALLOW_HIDE_PRICE && (
                      <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                        <input type="checkbox" checked={form.hide_price} onChange={e => set("hide_price", e.target.checked)} className="accent-purple-600 w-4 h-4" />
                        <span className="text-xs text-purple-700 font-medium">{lang === "ar" ? "إخفاء السعر" : lang === "fr" ? "Masquer le prix" : "Hide price"}</span>
                      </label>
                    )}
                  </div>
                  <div className="border border-orange-100 rounded-xl p-4 bg-orange-50/50">
                    <Label className="text-xs font-bold text-orange-900 mb-2.5 block">{lang === "ar" ? "المساحة (م²)" : lang === "fr" ? "Surface (m²)" : "Area (m²)"}</Label>
                    <Input type="number" value={form.area} onChange={e => set("area", e.target.value)} placeholder="0" className="border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
                  </div>
                </div>

                {/* Rooms Grid */}
                <div>
                  <Label className="text-xs font-bold text-gray-700 mb-3 block uppercase tracking-wider">Property Layout</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[{label: lang === "ar" ? "الغرف" : lang === "fr" ? "Pièces" : "Rooms", key: "rooms", color: "emerald"}, {label: lang === "ar" ? "غرف نوم" : lang === "fr" ? "Chambres" : "Bedrooms", key: "bedrooms", color: "blue"}, {label: lang === "ar" ? "حمامات" : lang === "fr" ? "SDB" : "Baths", key: "bathrooms", color: "cyan"}, {label: lang === "ar" ? "الطابق" : lang === "fr" ? "Étage" : "Floor", key: "floor", color: "indigo"}].map(field => (
                      <div key={field.key} className={`border border-${field.color}-100 rounded-lg p-3 bg-${field.color}-50/40`}>
                        <p className={`text-xs font-bold text-${field.color}-900 mb-2`}>{field.label}</p>
                        <Input type="number" min="0" value={form[field.key]} onChange={e => set(field.key, e.target.value)} placeholder="0" className={`border-${field.color}-200 focus:border-${field.color}-400 focus:ring-2 focus:ring-${field.color}-100 text-center text-lg font-bold`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Furnished Status */}
                <div className="border border-amber-100 rounded-xl p-4 bg-amber-50/50">
                  <Label className="text-xs font-bold text-amber-900 mb-2.5 block">{t.furnished}</Label>
                  <Select value={form.furnished} onValueChange={v => set("furnished", v)}>
                    <SelectTrigger className="border-amber-200 focus:ring-2 focus:ring-amber-100">
                      <SelectValue placeholder={lang === "ar" ? "اختر..." : lang === "fr" ? "Choisir..." : "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furnished">{lang === "ar" ? "مفروش" : lang === "fr" ? "Meublé" : "Furnished"}</SelectItem>
                      <SelectItem value="semi_furnished">{lang === "ar" ? "مفروش جزئياً" : lang === "fr" ? "Semi-meublé" : "Semi-furnished"}</SelectItem>
                      <SelectItem value="unfurnished">{lang === "ar" ? "غير مفروش" : lang === "fr" ? "Vide" : "Unfurnished"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Features/Amenities */}
                <div>
                  <Label className="text-xs font-bold text-gray-700 mb-3.5 block uppercase tracking-wider">
                    {lang === "ar" ? "✦ المميزات" : lang === "fr" ? "✦ Caractéristiques" : "✦ Amenities"}
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {FEATURES_LIST.map(feat => {
                      const active = form.features.includes(feat.value);
                      return (
                        <button
                          key={feat.value}
                          type="button"
                          onClick={() => toggleFeature(feat.value)}
                          className={`px-4 py-3 rounded-lg text-sm font-semibold border-2 transition-all transform hover:scale-105 ${
                            active
                              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-md"
                              : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          {feat.label[lang] || feat.label.fr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location — dependency chain */}
            {step === 2 && (
              <div className="space-y-5">
                {/* Country — fixed */}
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
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {t.wilaya}
                  </Label>
                  <Select value={form.wilaya} onValueChange={v => { set("wilaya", v); set("commune", ""); set("address", ""); }}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder={lang === "ar" ? "اختر الولاية" : lang === "fr" ? "Sélectionner la wilaya" : "Select a wilaya"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {WILAYAS.map(w => <SelectItem key={w.value} value={w.value}>{w.label[lang] || w.label.fr}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Commune — unlocks after wilaya */}
                <div className={`transition-all duration-200 ${form.wilaya ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs ${form.wilaya ? "border-emerald-500 text-emerald-600" : "border-gray-300 text-gray-400"}`}>2</span>
                    {t.commune}
                    {!form.wilaya && <span className="text-xs text-gray-400 font-normal">({lang === "ar" ? "اختر الولاية أولاً" : lang === "fr" ? "Choisissez la wilaya d'abord" : "Select wilaya first"})</span>}
                  </Label>
                  <Input
                    value={form.commune}
                    onChange={e => { set("commune", e.target.value); set("address", ""); }}
                    disabled={!form.wilaya}
                    placeholder={lang === "ar" ? "اكتب البلدية..." : lang === "fr" ? "Saisir la commune..." : "Enter commune..."}
                    className="border-gray-200 focus:border-emerald-400"
                  />
                </div>

                {/* Address — unlocks after commune */}
                <div className={`transition-all duration-200 ${form.commune ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-xs ${form.commune ? "border-emerald-500 text-emerald-600" : "border-gray-300 text-gray-400"}`}>3</span>
                    {t.addressLabel}
                    {!form.commune && <span className="text-xs text-gray-400 font-normal">({lang === "ar" ? "اختر البلدية أولاً" : lang === "fr" ? "Choisissez la commune d'abord" : "Select commune first"})</span>}
                  </Label>
                  <Input
                    value={form.address}
                    onChange={e => set("address", e.target.value)}
                    className="border-gray-200 focus:border-emerald-400"
                    disabled={!form.commune}
                    placeholder={form.commune ? `${form.commune}${form.wilaya ? ", " + form.wilaya : ""}...` : ""}
                  />
                </div>

                {LISTING_CONFIG.ALLOW_HIDE_LOCATION && (
                  <label className="flex items-center gap-2 cursor-pointer select-none bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <input type="checkbox" checked={form.hide_location} onChange={e => set("hide_location", e.target.checked)} className="accent-emerald-600" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">{lang === "ar" ? "إخفاء الموقع التفصيلي" : lang === "fr" ? "Masquer l'emplacement exact" : "Hide exact location"}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{lang === "ar" ? "سيُعرض الولاية فقط. يمكن للمهتمين طلب العنوان." : lang === "fr" ? "Seule la wilaya sera affichée. Les acheteurs peuvent demander l'adresse." : "Only the wilaya will be shown publicly. Interested buyers can request the address."}</p>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* STEP 3: Photos */}
            {step === 3 && (
              <div className="space-y-4">
                <label className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all ${uploadingImages || form.images.length >= LISTING_CONFIG.MAX_IMAGES ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-9 h-9 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">
                    {lang === "ar" ? "اضغط لرفع الصور" : lang === "fr" ? "Cliquez pour ajouter des photos" : "Click to upload photos"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, WEBP — max {LISTING_CONFIG.MAX_IMAGE_SIZE_MB} MB — {form.images.length}/{LISTING_CONFIG.MAX_IMAGES} {lang === "ar" ? "صور" : lang === "fr" ? "photos" : "images"}
                  </p>
                  <input ref={fileInputRef} type="file" multiple accept={(LISTING_CONFIG.ACCEPTED_IMAGE_TYPES || ["image/jpeg", "image/png", "image/webp"]).join(",")} className="hidden" onChange={e => { console.log('Files selected:', e.target.files); uploadImages(e.target.files, fileInputRef.current); }} />
                </label>
                {uploadError && (
                  <p className="text-sm text-red-500 text-center">{uploadError}</p>
                )}
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
                            {lang === "ar" ? "رئيسي" : lang === "fr" ? "Principal" : "Main"}
                          </span>
                        )}
                        <button
                          onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Contact */}
            {step === 4 && (
              <div className="space-y-5">
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  {lang === "ar"
                    ? "تم ملء بياناتك تلقائياً. يمكنك تعديلها إذا أردت."
                    : lang === "fr"
                    ? "Vos coordonnées ont été pré-remplies. Vous pouvez les modifier."
                    : "Your contact info is pre-filled from your profile. You can edit it below."}
                </p>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" /> {t.nameLabel}
                  </Label>
                  <Input
                    value={form.contact_name}
                    onChange={e => set("contact_name", e.target.value)}
                    className="border-gray-200 focus:border-emerald-400"
                    placeholder={t.nameLabel}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {t.phoneLabel}
                  </Label>
                  <Input
                    value={form.contact_phone}
                    onChange={e => set("contact_phone", e.target.value)}
                    className="border-gray-200 focus:border-emerald-400"
                    placeholder="0555 000 000"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {t.emailLabel}
                  </Label>
                  <Input
                    type="email"
                    value={form.contact_email}
                    onChange={e => set("contact_email", e.target.value)}
                    className="border-gray-200 focus:border-emerald-400"
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation footer */}
          <div className="flex justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="border-gray-200"
            >
              {lang === "ar" ? "السابق" : lang === "fr" ? "Précédent" : "Previous"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                className="bg-emerald-600 hover:bg-emerald-700 gap-1"
              >
                {lang === "ar" ? "التالي" : lang === "fr" ? "Suivant" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={saving || !form.title || !form.price || !form.wilaya}
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