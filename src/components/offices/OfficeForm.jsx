import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WILAYAS } from "../constants";
import { COMMUNES_BY_WILAYA } from "../communesData";
import { Save, X } from "lucide-react";

const inputCls = "bg-white text-gray-900 placeholder-gray-400 dark:bg-[#1a1d24] dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
const labelCls = "text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block";

export default function OfficeForm({ office, lang, onSave, onCancel, isPrimary: forcePrimary = false }) {
  const [form, setForm] = useState({
    wilaya: office?.wilaya || "",
    commune: office?.commune || "",
    address: office?.address || "",
    phone: office?.phone || "",
    email: office?.email || "",
    office_label: office?.office_label || "",
    is_primary: office?.is_primary ?? forcePrimary,
  });
  const [errors, setErrors] = useState({});

  const communes = form.wilaya ? (COMMUNES_BY_WILAYA[form.wilaya] || []) : [];

  function validate() {
    const e = {};
    if (!form.wilaya) e.wilaya = true;
    if (form.phone && !/^(\+213|0)(5|6|7)\d{8}$/.test(form.phone.replace(/\s/g, ""))) e.phone = true;
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = true;
    if (form.address && form.address.length > 200) e.address = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ ...form });
  }

  const lbl = (en, fr, ar) => lang === "ar" ? ar : lang === "fr" ? fr : en;

  return (
    <div className="bg-gray-50 dark:bg-[#0f1115] rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Wilaya */}
        <div>
          <label className={labelCls}>{lbl("Wilaya", "Wilaya", "الولاية")} <span className="text-red-500">*</span></label>
          <Select
            value={form.wilaya}
            onValueChange={v => setForm(p => ({ ...p, wilaya: v, commune: "" }))}
          >
            <SelectTrigger className={`${inputCls} ${errors.wilaya ? "border-red-400" : ""}`}>
              <SelectValue placeholder="..." />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {WILAYAS.map(w => (
                <SelectItem key={w.value} value={w.value}>{w.label[lang] || w.label.fr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.wilaya && <p className="text-xs text-red-500 mt-1">{lbl("Required", "Requis", "مطلوب")}</p>}
        </div>

        {/* Commune */}
        <div>
          <label className={labelCls}>{lbl("Commune", "Commune", "البلدية")}</label>
          <Select
            value={form.commune}
            onValueChange={v => setForm(p => ({ ...p, commune: v }))}
            disabled={!form.wilaya}
          >
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder={form.wilaya ? "..." : lbl("Select wilaya first", "Choisir wilaya d'abord", "اختر الولاية أولاً")} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {communes.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="sm:col-span-2">
          <label className={labelCls}>{lbl("Address", "Adresse", "العنوان")}</label>
          <Input
            value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
            placeholder={lbl("Full address...", "Adresse complète...", "العنوان الكامل...")}
            maxLength={200}
            className={`${inputCls} ${errors.address ? "border-red-400" : ""}`}
          />
          {errors.address && <p className="text-xs text-red-500 mt-1">{lbl("Max 200 characters", "Max 200 caractères", "200 حرف كحد أقصى")}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className={labelCls}>{lbl("Office Phone", "Téléphone bureau", "هاتف المكتب")}</label>
          <Input
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+213 5xx xxx xxx"
            className={`${inputCls} ${errors.phone ? "border-red-400" : ""}`}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{lbl("Invalid Algerian phone", "Numéro algérien invalide", "رقم جزائري غير صالح")}</p>}
        </div>

        {/* Email */}
        <div>
          <label className={labelCls}>{lbl("Office Email", "Email bureau", "بريد المكتب")}</label>
          <Input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            placeholder="bureau@..."
            className={`${inputCls} ${errors.email ? "border-red-400" : ""}`}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{lbl("Invalid email", "Email invalide", "بريد إلكتروني غير صالح")}</p>}
        </div>

        {/* Office Label */}
        <div>
          <label className={labelCls}>{lbl("Office Label", "Nom du bureau", "اسم المكتب")}</label>
          <Input
            value={form.office_label}
            onChange={e => setForm(p => ({ ...p, office_label: e.target.value }))}
            placeholder={lbl("e.g. Head Office, Annaba Branch", "ex. Siège Social, Antenne Annaba", "مثال: المقر الرئيسي، فرع عنابة")}
            className={inputCls}
          />
        </div>

        {/* Is Primary */}
        <div className="flex items-center gap-3 pt-5">
          <input
            id="is_primary"
            type="checkbox"
            checked={form.is_primary}
            onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))}
            className="w-4 h-4 accent-emerald-600"
          />
          <label htmlFor="is_primary" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            {lbl("Set as primary office", "Définir comme bureau principal", "تعيين كمكتب رئيسي")}
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
          <Save className="w-3.5 h-3.5" />
          {lbl("Save Office", "Enregistrer", "حفظ المكتب")}
        </Button>
        <Button onClick={onCancel} size="sm" variant="outline" className="gap-1.5">
          <X className="w-3.5 h-3.5" />
          {lbl("Cancel", "Annuler", "إلغاء")}
        </Button>
      </div>
    </div>
  );
}