import React, { useState, useEffect, useCallback } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  interpretSaleInput,
  getAmbiguousOptions,
  formatSaleDisplay,
  formatRentalDisplay,
  storedValueToTyped,
} from "@/components/price.config";

const L = {
  willDisplay: { fr: "→ Affiché comme", en: "→ Will display as", ar: "→ سيظهر كـ" },
  chooseValue: { fr: "Quelle est la valeur réelle ?", en: "What is the actual value?", ar: "ما القيمة الفعلية؟" },
  rentPreview: { fr: "→ Affiché comme", en: "→ Will display as", ar: "→ سيظهر كـ" },
};
const t = (k, lang) => L[k]?.[lang] || L[k]?.fr;

/**
 * SmartPriceInput — Algerian market-aware price entry field.
 * All interpretation logic is delegated to lib/price.config.js.
 *
 * Props:
 *   listingType: 'sale' | 'rent'
 *   value: number (stored integer DA value)
 *   onChange: (resolvedInteger: number) => void
 *   lang: 'fr' | 'en' | 'ar'
 *   placeholder: string (optional)
 *   className: string (optional)
 */
export default function SmartPriceInput({ listingType = 'sale', value, onChange, lang = 'fr', placeholder, className = '' }) {
  const isSale = listingType === 'sale';

  // rawInput: what the user sees in the input box
  const [rawInput, setRawInput] = useState(() => {
    if (!value) return '';
    return isSale ? storedValueToTyped(value) : String(value);
  });

  // Re-sync when external value changes (e.g. form reset or edit mode load)
  useEffect(() => {
    if (!value) { setRawInput(''); return; }
    const expected = isSale ? storedValueToTyped(value) : String(value);
    setRawInput(prev => prev === expected ? prev : expected);
  }, [value, isSale]);

  const interpretation = isSale ? interpretSaleInput(rawInput) : null;
  const ambiguousOptions = (isSale && interpretation?.isAmbiguous)
    ? getAmbiguousOptions(Number(rawInput), lang)
    : [];

  const handleChange = useCallback((e) => {
    const raw = e.target.value;
    setRawInput(raw);
    const n = Number(raw);
    // Always accept user input as-is, regardless of format
    if (raw === '') { onChange && onChange(''); return; }
    if (isNaN(n)) return; // Don't call onChange for non-numeric input
    onChange && onChange(n); // Store the raw number the user entered
  }, [onChange]);

  const handlePickOption = useCallback((option) => {
    onChange && onChange(option.value);
    setRawInput(String(option.value));
  }, [onChange]);

  // Compute display preview (for reference only, not a binding interpretation)
  const displayPreview = (() => {
    if (!rawInput) return null;
    const n = Number(rawInput);
    if (isNaN(n) || n <= 0) return null;
    // Display the formatted version for reference
    if (!isSale) return formatRentalDisplay(n, lang);
    return formatSaleDisplay(n, lang); // Format the raw user input
  })();

  const salePlaceholder = placeholder || (
    lang === 'ar' ? 'مثال: 50 أو 1200' : lang === 'fr' ? 'Ex: 50 ou 1200' : 'e.g. 50 or 1200'
  );
  const rentPlaceholder = placeholder || (
    lang === 'ar' ? 'مثال: 35000' : lang === 'fr' ? 'Ex: 35000' : 'e.g. 35000'
  );

  return (
    <div className="space-y-2">
      <Input
        type="number"
        value={rawInput}
        onChange={handleChange}
        placeholder={isSale ? salePlaceholder : rentPlaceholder}
        className={`border-gray-200 focus:border-emerald-400 ${className}`}
        inputMode="numeric"
      />

      {/* Display format as reference (minimal) */}
      {displayPreview && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 italic">
          {lang === 'ar' ? 'سيظهر كـ' : lang === 'fr' ? 'Affichage: ' : 'Display: '} <span className="font-medium text-gray-800">{displayPreview}</span>
        </div>
      )}
    </div>
  );
}