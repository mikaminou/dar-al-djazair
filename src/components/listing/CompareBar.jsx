import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "../LanguageContext";
import { formatPrice } from "../constants";

export default function CompareBar({ compareList, onRemove, onClear }) {
  const { lang } = useLang();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Scale className="w-4 h-4 text-emerald-600" />
          {lang === "ar" ? "المقارنة" : lang === "fr" ? "Comparer" : "Compare"} ({compareList.length}/2)
        </div>

        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {compareList.map(listing => (
            <div key={listing.id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
              <img
                src={listing.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=100&q=60"}
                alt={listing.title}
                className="w-8 h-8 rounded object-cover"
              />
              <div className="text-xs">
                <div className="font-medium text-gray-800 max-w-[100px] truncate">{listing.title}</div>
                <div className="text-emerald-700">{formatPrice(listing.price, lang)}</div>
              </div>
              <button onClick={() => onRemove(listing.id)} className="ml-1 text-gray-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {compareList.length < 2 && (
            <div className="flex items-center justify-center w-32 h-12 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-400">
              {lang === "ar" ? "+ أضف عقاراً" : lang === "fr" ? "+ Ajouter" : "+ Add property"}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600 underline">
            {lang === "ar" ? "مسح" : lang === "fr" ? "Effacer" : "Clear"}
          </button>
          {compareList.length === 2 && (
            <Link to={createPageUrl(`Compare?ids=${compareList.map(l => l.id).join(",")}`)}>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Scale className="w-4 h-4" />
                {lang === "ar" ? "قارن الآن" : lang === "fr" ? "Comparer maintenant" : "Compare Now"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}