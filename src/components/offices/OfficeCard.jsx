import React from "react";
import { MapPin, Phone, Mail, Star, Edit2, Trash2, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WILAYAS } from "../constants";

export default function OfficeCard({ office, lang, editable, onEdit, onDelete, onSetPrimary, showVerified = false }) {
  const lbl = (en, fr, ar) => lang === "ar" ? ar : lang === "fr" ? fr : en;
  const wilayaObj = WILAYAS.find(w => w.value === office.wilaya);
  const wilayaLabel = wilayaObj ? (wilayaObj.label[lang] || wilayaObj.label.fr) : office.wilaya;

  const displayLabel = office.office_label || wilayaLabel;

  return (
    <div className={`bg-white dark:bg-[#13161c] rounded-xl border shadow-sm p-4 flex gap-3 ${office.is_primary ? "border-emerald-300 dark:border-emerald-700" : "border-gray-100 dark:border-gray-800"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{displayLabel}</span>
          {office.is_primary && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">
              <Star className="w-2.5 h-2.5 mr-1" />
              {lbl("Primary", "Principal", "الرئيسي")}
            </Badge>
          )}
          {showVerified && office.is_verified && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs">
              <CheckCircle className="w-2.5 h-2.5 mr-1" />
              {lbl("Verified", "Vérifié", "موثق")}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>{wilayaLabel}</span>
          </div>
          {office.address && (
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-4">{office.address}</p>
          )}
          {office.phone && (
            <a href={`tel:${office.phone}`} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600">
              <Phone className="w-3 h-3 flex-shrink-0" />
              {office.phone}
            </a>
          )}
          {office.email && (
            <a href={`mailto:${office.email}`} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600">
              <Mail className="w-3 h-3 flex-shrink-0" />
              {office.email}
            </a>
          )}
        </div>
      </div>

      {editable && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            title={lbl("Edit", "Modifier", "تعديل")}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title={lbl("Delete", "Supprimer", "حذف")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {!office.is_primary && (
            <button
              onClick={onSetPrimary}
              className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
              title={lbl("Set as primary", "Définir principal", "تعيين كرئيسي")}
            >
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}