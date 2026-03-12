import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Upload, Plus, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLang } from "../components/LanguageContext";
import { WILAYAS, PROPERTY_TYPES, FEATURES_LIST } from "../components/constants";

const STEPS = ["Type", "Details", "Location", "Photos", "Contact"];

export default function PostListingPage() {
  const { t, lang } = useLang();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [form, setForm] = useState({
    listing_type: "sale",
    property_type: "apartment",
    title: "",
    description: "",
    price: "",
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
    images: [],
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleFeature = (feat) => {
    set("features", form.features.includes(feat)
      ? form.features.filter(f => f !== feat)
      : [...form.features, feat]
    );
  };

  async function uploadImages(files) {
    setUploadingImages(true);
    const urls = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    set("images", [...form.images, ...urls]);
    setUploadingImages(false);
  }

  async function submit() {
    setSaving(true);
    await base44.entities.Listing.create({
      ...form,
      price: Number(form.price),
      area: form.area ? Number(form.area) : undefined,
      rooms: form.rooms ? Number(form.rooms) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      floor: form.floor ? Number(form.floor) : undefined,
      year_built: form.year_built ? Number(form.year_built) : undefined,
      status: "active",
    });
    setSaving(false);
    setDone(true);
  }

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {lang === "ar" ? "تم نشر إعلانك!" : lang === "fr" ? "Annonce publiée !" : "Listing Published!"}
        </h2>
        <p className="text-gray-500 mb-6">
          {lang === "ar" ? "سيتمكن آلاف الزوار من رؤية إعلانك" : lang === "fr" ? "Des milliers de visiteurs verront votre annonce" : "Thousands of visitors will see your listing"}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.href = createPageUrl("MyListings")} className="bg-emerald-600 hover:bg-emerald-700">
            {t.myListings}
          </Button>
          <Button variant="outline" onClick={() => { setDone(false); setStep(0); setForm({ listing_type: "sale", property_type: "apartment", title: "", description: "", price: "", area: "", rooms: "", bedrooms: "", bathrooms: "", floor: "", year_built: "", furnished: "", features: [], wilaya: "", commune: "", address: "", images: [], contact_name: "", contact_phone: "", contact_email: "" }); }}>
            {lang === "ar" ? "إعلان آخر" : lang === "fr" ? "Autre annonce" : "New listing"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">{t.postListing}</h1>
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-amber-400" : "bg-white/20"}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-xs text-white/60">
            {STEPS.map((s, i) => <span key={i}>{s}</span>)}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

          {/* STEP 0: Type */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800">
                {lang === "ar" ? "نوع الإعلان" : lang === "fr" ? "Type d'annonce" : "Listing Type"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {["sale", "rent"].map(type => (
                  <button
                    key={type}
                    onClick={() => set("listing_type", type)}
                    className={`p-4 rounded-xl border-2 font-medium transition-all ${form.listing_type === type ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-emerald-200"}`}
                  >
                    {type === "sale" ? t.sale : t.forRent}
                  </button>
                ))}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">{t.propertyType}</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PROPERTY_TYPES.map(pt => (
                    <button
                      key={pt.value}
                      onClick={() => set("property_type", pt.value)}
                      className={`p-3 rounded-xl border-2 text-xs font-medium transition-all ${form.property_type === pt.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600 hover:border-emerald-200"}`}
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
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">
                {lang === "ar" ? "تفاصيل العقار" : lang === "fr" ? "Détails du bien" : "Property Details"}
              </h2>
              <div>
                <Label className="text-sm">{t.titleLabel}</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1" placeholder={lang === "ar" ? "مثال: شقة 3 غرف في وهران" : lang === "fr" ? "Ex: Appartement 3 pièces à Oran" : "Ex: 3-room apartment in Oran"} />
              </div>
              <div>
                <Label className="text-sm">{t.description}</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} className="mt-1" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">{t.priceLabel}</Label>
                  <Input type="number" value={form.price} onChange={e => set("price", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">{t.areaLabel}</Label>
                  <Input type="number" value={form.area} onChange={e => set("area", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">{t.rooms}</Label>
                  <Input type="number" value={form.rooms} onChange={e => set("rooms", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">{t.bedrooms}</Label>
                  <Input type="number" value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">{t.bathrooms}</Label>
                  <Input type="number" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">{t.floor}</Label>
                  <Input type="number" value={form.floor} onChange={e => set("floor", e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-sm">{t.furnished}</Label>
                <Select value={form.furnished} onValueChange={v => set("furnished", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="furnished">{lang === "ar" ? "مفروش" : lang === "fr" ? "Meublé" : "Furnished"}</SelectItem>
                    <SelectItem value="semi_furnished">{lang === "ar" ? "مفروش جزئياً" : lang === "fr" ? "Semi-meublé" : "Semi-furnished"}</SelectItem>
                    <SelectItem value="unfurnished">{lang === "ar" ? "غير مفروش" : lang === "fr" ? "Vide" : "Unfurnished"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-2 block">{t.features}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES_LIST.map(feat => (
                    <label key={feat} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={form.features.includes(feat)} onCheckedChange={() => toggleFeature(feat)} />
                      <span className="text-sm text-gray-700">{feat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">
                {lang === "ar" ? "الموقع" : lang === "fr" ? "Localisation" : "Location"}
              </h2>
              <div>
                <Label className="text-sm">{t.wilaya}</Label>
                <Select value={form.wilaya} onValueChange={v => set("wilaya", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={t.allWilayas} /></SelectTrigger>
                  <SelectContent>
                    {WILAYAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">{t.commune}</Label>
                <Input value={form.commune} onChange={e => set("commune", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">{t.addressLabel}</Label>
                <Input value={form.address} onChange={e => set("address", e.target.value)} className="mt-1" />
              </div>
            </div>
          )}

          {/* STEP 3: Photos */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">{t.imagesLabel}</h2>
              <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors ${uploadingImages ? "opacity-50 pointer-events-none" : ""}`}>
                <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{lang === "ar" ? "اضغط لرفع الصور" : lang === "fr" ? "Cliquez pour ajouter des photos" : "Click to upload photos"}</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 10 photos</p>
                <input type="file" multiple accept="image/*" className="hidden" onChange={e => uploadImages(e.target.files)} />
              </label>
              {uploadingImages && <p className="text-sm text-emerald-600 text-center animate-pulse">{t.loading}</p>}
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
                      <button onClick={() => set("images", form.images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">{t.contact}</h2>
              <div>
                <Label className="text-sm">{t.nameLabel}</Label>
                <Input value={form.contact_name} onChange={e => set("contact_name", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">{t.phoneLabel}</Label>
                <Input value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} className="mt-1" placeholder="0555 000 000" />
              </div>
              <div>
                <Label className="text-sm">{t.emailLabel}</Label>
                <Input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} className="mt-1" />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              {lang === "ar" ? "السابق" : lang === "fr" ? "Précédent" : "Previous"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="bg-emerald-600 hover:bg-emerald-700" disabled={step === 0 && !form.listing_type}>
                {lang === "ar" ? "التالي" : lang === "fr" ? "Suivant" : "Next"}
              </Button>
            ) : (
              <Button onClick={submit} disabled={saving || !form.title || !form.price || !form.wilaya} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? t.loading : t.publishListing}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}