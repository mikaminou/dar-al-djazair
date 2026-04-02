import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { WILAYAS, PROPERTY_TYPES } from "../components/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, CheckCircle2, Building2, Image, ChevronRight, ChevronLeft } from "lucide-react";

const LOT_TYPES = ["F1","F2","F3","F4","F5","F6+","Duplex","Penthouse","Commercial","Parking"];

const AMENITIES = {
  building: {
    fr: "Bâtiment", en: "Building", ar: "المبنى",
    items: [
      { value: "elevator", fr: "Ascenseur", en: "Elevator", ar: "مصعد" },
      { value: "underground_parking", fr: "Parking souterrain", en: "Underground parking", ar: "موقف سفلي" },
      { value: "rooftop_terrace", fr: "Terrasse rooftop", en: "Rooftop terrace", ar: "تراس علوي" },
      { value: "concierge", fr: "Gardien", en: "Concierge", ar: "حارس" },
      { value: "generator", fr: "Groupe électrogène", en: "Generator", ar: "مولد" },
      { value: "water_tank", fr: "Château d'eau", en: "Water tank", ar: "خزان مياه" },
      { value: "solar_panels", fr: "Panneaux solaires", en: "Solar panels", ar: "ألواح شمسية" },
      { value: "interphone", fr: "Interphone", en: "Interphone", ar: "إنترفون" },
      { value: "cctv", fr: "Vidéosurveillance", en: "CCTV", ar: "مراقبة" },
      { value: "secured_entrance", fr: "Entrée sécurisée", en: "Secured entrance", ar: "مدخل آمن" },
    ]
  },
  unit: {
    fr: "Appartements", en: "Units", ar: "الشقق",
    items: [
      { value: "fitted_kitchen", fr: "Cuisine équipée", en: "Fitted kitchen", ar: "مطبخ مجهز" },
      { value: "ac_preinstall", fr: "Pré-installation AC", en: "AC pre-installation", ar: "تمديد مكيف" },
      { value: "double_glazing", fr: "Double vitrage", en: "Double glazing", ar: "زجاج مزدوج" },
      { value: "high_ceilings", fr: "Hauts plafonds", en: "High ceilings", ar: "سقف عالٍ" },
      { value: "fiber_ready", fr: "Fibre optique", en: "Fiber optic ready", ar: "فيبر أوبتيك" },
    ]
  },
  outdoor: {
    fr: "Espaces communs", en: "Common areas", ar: "المناطق المشتركة",
    items: [
      { value: "garden", fr: "Jardin/Espaces verts", en: "Garden/Green space", ar: "حديقة" },
      { value: "playground", fr: "Aire de jeux", en: "Playground", ar: "ملعب أطفال" },
      { value: "pool", fr: "Piscine", en: "Swimming pool", ar: "مسبح" },
      { value: "sports_court", fr: "Terrain de sport", en: "Sports court", ar: "ملعب رياضي" },
      { value: "jogging_path", fr: "Piste de jogging", en: "Jogging path", ar: "مسار رياضي" },
      { value: "commercial_ground_floor", fr: "RDC commercial", en: "Commercial ground floor", ar: "طابق تجاري" },
    ]
  },
  location: {
    fr: "Emplacement", en: "Location", ar: "الموقع",
    items: [
      { value: "near_school", fr: "Proche école", en: "Near school", ar: "قرب مدرسة" },
      { value: "near_hospital", fr: "Proche hôpital", en: "Near hospital", ar: "قرب مستشفى" },
      { value: "near_mosque", fr: "Proche mosquée", en: "Near mosque", ar: "قرب مسجد" },
      { value: "near_transport", fr: "Proche transport", en: "Near transport", ar: "قرب مواصلات" },
      { value: "near_highway", fr: "Proche autoroute", en: "Near highway", ar: "قرب طريق سريع" },
      { value: "sea_view", fr: "Vue mer", en: "Sea view", ar: "إطلالة بحرية" },
      { value: "mountain_view", fr: "Vue montagne", en: "Mountain view", ar: "إطلالة جبلية" },
      { value: "city_center", fr: "Centre-ville", en: "City center", ar: "وسط المدينة" },
    ]
  }
};

const STEPS = ["general", "lots", "media", "amenities", "contact", "review"];

export default function PostProject() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    project_name: "", developer_name: "", project_type: "residential",
    listing_type: "sale", wilaya: "", commune: "", address: "",
    description: "", project_status: "upcoming", delivery_date: "",
    total_units: "", total_floors: "", total_buildings: "", parking_spots: "",
    is_exclusive: false, video_url: "", virtual_tour_url: "",
    contact_name: "", contact_phone: "", contact_email: "",
    contact_whatsapp: "", office_address: "", office_hours: "",
    show_phone: true, show_email: true, amenities: [], photos: [],
    tranches: [],
  });
  const [lotTypes, setLotTypes] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const me = await base44.auth.me().catch(() => null);
    if (!me) return;
    setUser(me);
    setForm(f => ({
      ...f,
      developer_name: me.agency_name || me.full_name || "",
      contact_name: me.full_name || "",
      contact_email: me.email || "",
      contact_phone: me.phone || "",
      published_by: me.email,
    }));
  }

  const L = lang;
  const t = (fr, en, ar) => L === "ar" ? ar : L === "fr" ? fr : en;

  const isPro = user?.role === "professional" || user?.role === "admin";

  function addLotType() {
    setLotTypes(prev => [...prev, {
      _id: Date.now(),
      lot_type: "F3", total_count: "", available_count: "",
      area_min: "", area_max: "", price_min: "", price_max: "",
      floor_min: "", floor_max: "", description: "",
    }]);
  }

  function updateLotType(id, key, val) {
    setLotTypes(prev => prev.map(lt => lt._id === id ? { ...lt, [key]: val } : lt));
  }

  function removeLotType(id) {
    setLotTypes(prev => prev.filter(lt => lt._id !== id));
  }

  async function uploadPhotos(files) {
    setUploadingPhotos(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setForm(f => ({ ...f, photos: [...f.photos, ...urls] }));
    setUploadingPhotos(false);
  }

  function toggleAmenity(val) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(val) ? f.amenities.filter(a => a !== val) : [...f.amenities, val],
    }));
  }

  async function submit() {
    setSaving(true);
    const project = await base44.entities.Project.create({
      ...form,
      total_units: Number(form.total_units) || 0,
      total_floors: form.total_floors ? Number(form.total_floors) : undefined,
      total_buildings: form.total_buildings ? Number(form.total_buildings) : undefined,
      parking_spots: form.parking_spots ? Number(form.parking_spots) : undefined,
      status: "pending",
      published_by: user?.email,
    });
    await Promise.all(lotTypes.map(lt => {
      const { _id, ...data } = lt;
      return base44.entities.ProjectLotType.create({
        ...data,
        project_id: project.id,
        total_count: Number(data.total_count) || 0,
        available_count: data.available_count !== "" ? Number(data.available_count) : Number(data.total_count) || 0,
        area_min: Number(data.area_min) || 0,
        area_max: Number(data.area_max) || 0,
        price_min: Number(data.price_min) || 0,
        price_max: Number(data.price_max) || 0,
        floor_min: data.floor_min !== "" ? Number(data.floor_min) : undefined,
        floor_max: data.floor_max !== "" ? Number(data.floor_max) : undefined,
      });
    }));
    setSaving(false);
    setDone(true);
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  if (!isPro) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold">{t("Réservé aux professionnels", "Professionals Only", "للمحترفين فقط")}</h2>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-12 text-center max-w-md shadow-sm border">
        <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("Projet soumis !", "Project Submitted!", "تم تقديم المشروع!")}</h2>
        <p className="text-gray-500 text-sm mb-6">{t("Votre projet est en cours de vérification.", "Your project is pending review.", "مشروعك قيد المراجعة.")}</p>
        <Button onClick={() => navigate("/Projects")} className="bg-emerald-600 hover:bg-emerald-700">
          {t("Voir les projets", "View Projects", "عرض المشاريع")}
        </Button>
      </div>
    </div>
  );

  const stepLabels = {
    general:   { fr: "Général",    en: "General",   ar: "عام" },
    lots:      { fr: "Lots",       en: "Lots",      ar: "اللوتات" },
    media:     { fr: "Médias",     en: "Media",     ar: "الوسائط" },
    amenities: { fr: "Équipements",en: "Amenities", ar: "المرافق" },
    contact:   { fr: "Contact",    en: "Contact",   ar: "الاتصال" },
    review:    { fr: "Révision",   en: "Review",    ar: "مراجعة" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Building2 className="w-7 h-7 text-emerald-300" />
          <div>
            <h1 className="text-2xl font-bold">{t("Publier un Projet", "Post a Project", "نشر مشروع")}</h1>
            <p className="text-emerald-200 text-sm">{t("Présentez votre résidence ou programme immobilier", "Showcase your residential or commercial development", "قدّم مشروعك العقاري")}</p>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => i <= step && setStep(i)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i === step ? "bg-emerald-600 text-white" :
                  i < step ? "bg-emerald-100 text-emerald-700" :
                  "bg-white text-gray-400 border"
                }`}
              >
                <span className="font-bold">{i + 1}</span>
                {stepLabels[s][L] || stepLabels[s].fr}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {/* STEP 0 — GENERAL */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">{t("Informations générales", "General Information", "المعلومات العامة")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Nom du projet *", "Project Name *", "اسم المشروع *")}</label>
                  <Input value={form.project_name} onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))} placeholder="Ex: Résidence El Yasmine" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Promoteur / Agence *", "Developer / Agency *", "المطوّر / الوكالة *")}</label>
                  <Input value={form.developer_name} onChange={e => setForm(f => ({ ...f, developer_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Type de projet *", "Project Type *", "نوع المشروع *")}</label>
                  <Select value={form.project_type} onValueChange={v => setForm(f => ({ ...f, project_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">{t("Résidentiel", "Residential", "سكني")}</SelectItem>
                      <SelectItem value="commercial">{t("Commercial", "Commercial", "تجاري")}</SelectItem>
                      <SelectItem value="mixed">{t("Mixte", "Mixed", "مختلط")}</SelectItem>
                      <SelectItem value="industrial">{t("Industriel", "Industrial", "صناعي")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Opération *", "Listing Type *", "نوع العملية *")}</label>
                  <Select value={form.listing_type} onValueChange={v => setForm(f => ({ ...f, listing_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">{t("Vente", "Sale", "بيع")}</SelectItem>
                      <SelectItem value="rent">{t("Location", "Rent", "إيجار")}</SelectItem>
                      <SelectItem value="both">{t("Vente & Location", "Sale & Rent", "بيع وإيجار")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Statut du projet *", "Project Status *", "حالة المشروع *")}</label>
                  <Select value={form.project_status} onValueChange={v => setForm(f => ({ ...f, project_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">{t("À venir", "Upcoming", "قادم")}</SelectItem>
                      <SelectItem value="under_construction">{t("En construction", "Under Construction", "قيد الإنشاء")}</SelectItem>
                      <SelectItem value="ready_to_move">{t("Prêt à habiter", "Ready to Move", "جاهز")}</SelectItem>
                      <SelectItem value="sold_out">{t("Complet", "Sold Out", "مكتمل")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Wilaya *", "Wilaya *", "الولاية *")}</label>
                  <Select value={form.wilaya} onValueChange={v => setForm(f => ({ ...f, wilaya: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("Sélectionner", "Select", "اختر")} /></SelectTrigger>
                    <SelectContent className="max-h-52">
                      {WILAYAS.map(w => <SelectItem key={w.value} value={w.value}>{w.label[L] || w.label.fr}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Commune *", "Commune *", "البلدية *")}</label>
                  <Input value={form.commune} onChange={e => setForm(f => ({ ...f, commune: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Adresse", "Address", "العنوان")}</label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder={t("Adresse ou point de repère", "Address or landmark", "العنوان أو نقطة مرجعية")} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Date de livraison", "Delivery Date", "تاريخ التسليم")}</label>
                  <Input type="date" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Nombre total d'unités *", "Total Units *", "إجمالي الوحدات *")}</label>
                  <Input type="number" value={form.total_units} onChange={e => setForm(f => ({ ...f, total_units: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Nombre d'étages", "Total Floors", "عدد الطوابق")}</label>
                  <Input type="number" value={form.total_floors} onChange={e => setForm(f => ({ ...f, total_floors: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Nombre de bâtiments", "Total Buildings", "عدد المباني")}</label>
                  <Input type="number" value={form.total_buildings} onChange={e => setForm(f => ({ ...f, total_buildings: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Places de parking", "Parking Spots", "أماكن الانتظار")}</label>
                  <Input type="number" value={form.parking_spots} onChange={e => setForm(f => ({ ...f, parking_spots: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Description * (min 100 caractères)", "Description * (min 100 characters)", "الوصف * (100 حرف على الأقل)")}</label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={5} className="resize-none" placeholder={t("Décrivez votre projet en détail...", "Describe your project in detail...", "صف مشروعك بالتفصيل...")} />
                  <p className={`text-xs mt-1 ${form.description.length < 100 ? "text-red-400" : "text-green-500"}`}>{form.description.length}/100</p>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="exclusive" checked={form.is_exclusive} onChange={e => setForm(f => ({ ...f, is_exclusive: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                  <label htmlFor="exclusive" className="text-sm text-gray-700">{t("Projet exclusif sur Dar El Djazair", "Exclusive project on Dar El Djazair", "مشروع حصري على دار الجزائر")}</label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — LOT TYPES */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{t("Types de lots", "Lot Types", "أنواع اللوتات")}</h2>
                <Button onClick={addLotType} size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" />{t("Ajouter un type", "Add type", "إضافة نوع")}
                </Button>
              </div>
              {lotTypes.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                  <p className="text-sm">{t("Ajoutez au moins un type de lot", "Add at least one lot type", "أضف نوع لوت واحد على الأقل")}</p>
                </div>
              )}
              {lotTypes.map(lt => (
                <div key={lt._id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Select value={lt.lot_type} onValueChange={v => updateLotType(lt._id, "lot_type", v)}>
                      <SelectTrigger className="w-36 font-bold text-emerald-700"><SelectValue /></SelectTrigger>
                      <SelectContent>{LOT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select>
                    <button onClick={() => removeLotType(lt._id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">{t("Total unités *", "Total units *", "إجمالي الوحدات *")}</label>
                      <Input type="number" value={lt.total_count} onChange={e => updateLotType(lt._id, "total_count", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t("Disponibles", "Available", "المتاحة")}</label>
                      <Input type="number" value={lt.available_count} onChange={e => updateLotType(lt._id, "available_count", e.target.value)} className="h-8 text-sm" placeholder={lt.total_count} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t("Surface min (m²) *", "Min area (m²) *", "مساحة أدنى *")}</label>
                      <Input type="number" value={lt.area_min} onChange={e => updateLotType(lt._id, "area_min", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t("Surface max (m²) *", "Max area (m²) *", "مساحة أقصى *")}</label>
                      <Input type="number" value={lt.area_max} onChange={e => updateLotType(lt._id, "area_max", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t("Prix min (DA) *", "Min price (DA) *", "سعر أدنى (دج) *")}</label>
                      <Input type="number" value={lt.price_min} onChange={e => updateLotType(lt._id, "price_min", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t("Prix max (DA) *", "Max price (DA) *", "سعر أقصى (دج) *")}</label>
                      <Input type="number" value={lt.price_max} onChange={e => updateLotType(lt._id, "price_max", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t("Étage min", "Min floor", "طابق أدنى")}</label>
                      <Input type="number" value={lt.floor_min} onChange={e => updateLotType(lt._id, "floor_min", e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{t("Étage max", "Max floor", "طابق أقصى")}</label>
                      <Input type="number" value={lt.floor_max} onChange={e => updateLotType(lt._id, "floor_max", e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">{t("Notes", "Notes", "ملاحظات")}</label>
                    <Input value={lt.description} onChange={e => updateLotType(lt._id, "description", e.target.value)} className="h-8 text-sm" placeholder={t("Ex: exposition sud, balcon inclus", "Ex: south-facing, balcony included", "مثال: واجهة جنوبية")} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 2 — MEDIA */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">{t("Médias du projet", "Project Media", "وسائط المشروع")}</h2>
              {/* Photos */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">{t("Photos (min 5) *", "Photos (min 5) *", "الصور (5 على الأقل) *")}</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.photos.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-20 h-16 object-cover rounded-lg border" />
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-[9px] bg-emerald-600/80 text-white text-center rounded-b-lg">Cover</span>}
                      <button onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-emerald-400 transition-colors">
                  {uploadingPhotos ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Image className="w-4 h-4 text-gray-400" />}
                  <span className="text-sm text-gray-500">{t("Ajouter des photos", "Add photos", "إضافة صور")}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => e.target.files && uploadPhotos(Array.from(e.target.files))} />
                </label>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Lien vidéo (YouTube/Vimeo)", "Video URL (YouTube/Vimeo)", "رابط الفيديو")}</label>
                <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Visite virtuelle 3D", "Virtual Tour URL", "جولة ثلاثية الأبعاد")}</label>
                <Input value={form.virtual_tour_url} onChange={e => setForm(f => ({ ...f, virtual_tour_url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
          )}

          {/* STEP 3 — AMENITIES */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900">{t("Équipements & atouts", "Amenities & Features", "المرافق والمميزات")}</h2>
              {Object.entries(AMENITIES).map(([cat, { fr, en, ar, items }]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">{L === "ar" ? ar : L === "fr" ? fr : en}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {items.map(item => (
                      <label key={item.value} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border text-sm transition-all ${form.amenities.includes(item.value) ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                        <input type="checkbox" checked={form.amenities.includes(item.value)} onChange={() => toggleAmenity(item.value)} className="accent-emerald-600" />
                        {L === "ar" ? item.ar : L === "fr" ? item.fr : item.en}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4 — CONTACT */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">{t("Informations de contact", "Contact Information", "معلومات الاتصال")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Nom *", "Name *", "الاسم *")}</label>
                  <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Téléphone *", "Phone *", "الهاتف *")}</label>
                  <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
                  <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">WhatsApp</label>
                  <Input value={form.contact_whatsapp} onChange={e => setForm(f => ({ ...f, contact_whatsapp: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Adresse du bureau", "Office Address", "عنوان المكتب")}</label>
                  <Input value={form.office_address} onChange={e => setForm(f => ({ ...f, office_address: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">{t("Horaires d'ouverture", "Office Hours", "ساعات العمل")}</label>
                  <Input value={form.office_hours} onChange={e => setForm(f => ({ ...f, office_hours: e.target.value }))} placeholder={t("Ex: Dim–Jeu 9h–17h", "Ex: Sun–Thu 9am–5pm", "مثال: الأحد-الخميس 9-17")} />
                </div>
                <div className="flex items-center gap-4 col-span-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.show_phone} onChange={e => setForm(f => ({ ...f, show_phone: e.target.checked }))} className="accent-emerald-600" />
                    {t("Afficher le téléphone", "Show phone", "إظهار الهاتف")}
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.show_email} onChange={e => setForm(f => ({ ...f, show_email: e.target.checked }))} className="accent-emerald-600" />
                    {t("Afficher l'email", "Show email", "إظهار البريد")}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — REVIEW */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">{t("Révision finale", "Final Review", "المراجعة النهائية")}</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Nom du projet", "Project Name", "اسم المشروع")}</span><span className="font-medium">{form.project_name || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Promoteur", "Developer", "المطوّر")}</span><span className="font-medium">{form.developer_name || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Wilaya", "Wilaya", "الولاية")}</span><span className="font-medium">{form.wilaya || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Unités totales", "Total units", "إجمالي الوحدات")}</span><span className="font-medium">{form.total_units || "—"}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Types de lots", "Lot types", "أنواع اللوتات")}</span><span className="font-medium">{lotTypes.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">{t("Photos", "Photos", "الصور")}</span><span className={form.photos.length >= 5 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{form.photos.length}/5 min</span></div>
              </div>
              {(form.photos.length < 5) && (
                <p className="text-red-500 text-sm">{t("Veuillez ajouter au moins 5 photos (Étape 3)", "Please add at least 5 photos (Step 3)", "أضف 5 صور على الأقل (الخطوة 3)")}</p>
              )}
              {!form.project_name || !form.developer_name || !form.wilaya || !form.commune || !form.total_units || form.description.length < 100 ? (
                <p className="text-amber-600 text-sm">{t("Certains champs obligatoires sont manquants.", "Some required fields are missing.", "بعض الحقول الإلزامية مفقودة.")}</p>
              ) : null}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" />{t("Précédent", "Previous", "السابق")}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                {t("Suivant", "Next", "التالي")}<ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={saving || form.photos.length < 5 || !form.project_name || !form.wilaya || !form.total_units || form.description.length < 100}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {t("Soumettre le projet", "Submit Project", "تقديم المشروع")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}