import React, { useState, useEffect, useCallback } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  interpretSaleInput,
  getAmbiguousOptions,
  formatSaleDisplay,
  formatRentalDisplay,
  storedValueToTyped,
} from "@/lib/price.config";

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
    if (isNaN(n) || raw === '') { onChange && onChange(''); return; }

    if (!isSale) {
      // Rent: store exactly what was typed
      onChange && onChange(n);
      return;
    }

    const result = interpretSaleInput(raw);
    if (result && !result.isAmbiguous && result.storedValue) {
      onChange && onChange(result.storedValue);
    }
    // Ambiguous: wait for user to pick from options
  }, [isSale, onChange]);

  const handlePickOption = useCallback((option) => {
    onChange && onChange(option.value);
    // Replace the input with the shorthand for the chosen value
    setRawInput(storedValueToTyped(option.value));
  }, [onChange]);

  // Compute display preview
  const displayPreview = (() => {
    if (!rawInput) return null;
    const n = Number(rawInput);
    if (isNaN(n) || n <= 0) return null;
    if (!isSale) return formatRentalDisplay(n, lang);
    if (interpretation && !interpretation.isAmbiguous && interpretation.storedValue) {
      return formatSaleDisplay(interpretation.storedValue, lang);
    }
    return null;
  })();

  const salePlaceholder = placeholder || (
    lang === 'ar' ? 'مثال: 50 أو 1200' : lang === 'fr' ? 'Ex: 50 ou 1200' : 'e.g. 50 or 1200'
  );
  const rentPlaceholder = placeholder || (
    lang === 'ar' ? 'مثال: 35000' : lang === 'fr' ? 'Ex: 35000' : 'e.g. 35000'
  );

  return (
    <div className="space-y-1.5">
      <Input
        type="number"
        value={rawInput}
        onChange={handleChange}
        placeholder={isSale ? salePlaceholder : rentPlaceholder}
        className={`border-gray-200 focus:border-emerald-400 ${className}`}
        inputMode="numeric"
      />

      {/* Unambiguous suggestion */}
      {displayPreview && !interpretation?.isAmbiguous && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
          <Check className="w-3 h-3 flex-shrink-0" />
          <span className="font-medium">{t(isSale ? 'willDisplay' : 'rentPreview', lang)}</span>
          <span className="font-bold">{displayPreview}</span>
        </div>
      )}

      {/* Ambiguous picker */}
      {isSale && interpretation?.isAmbiguous && ambiguousOptions.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
            <ChevronDown className="w-3 h-3" />
            {t('chooseValue', lang)}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {ambiguousOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePickOption(opt)}
                className="text-left text-xs px-3 py-2 bg-white border border-amber-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition-colors font-medium text-gray-800"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}