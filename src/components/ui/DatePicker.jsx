import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MONTHS_AR = ["جانفي","فيفري","مارس","أفريل","ماي","جوان","جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAYS_EN = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const DAYS_FR = ["Di","Lu","Ma","Me","Je","Ve","Sa"];
const DAYS_AR = ["أح","إث","ثل","أر","خم","جم","سب"];

function formatDisplay(dateStr, lang) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return "";
  return d.toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function DatePicker({ value, onChange, placeholder, lang = "en", disabled = false, className = "" }) {
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? new Date(value + "T00:00:00").getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value + "T00:00:00").getMonth() : today.getMonth());
  const [mode, setMode] = useState("days"); // "days" | "months" | "years"
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const months = lang === "ar" ? MONTHS_AR : lang === "fr" ? MONTHS_FR : MONTHS_EN;
  const days = lang === "ar" ? DAYS_AR : lang === "fr" ? DAYS_FR : DAYS_EN;

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function selectDay(day) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  }

  const selectedDate = value ? new Date(value + "T00:00:00") : null;
  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const isSelected = (day) => selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
  const isToday = (day) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  // Year range for year picker
  const baseYear = Math.floor(viewYear / 12) * 12;
  const yearRange = Array.from({ length: 12 }, (_, i) => baseYear + i);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 h-10 border rounded-lg text-sm transition-all text-left
          ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" : "bg-white border-gray-200 hover:border-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 text-gray-900 dark:bg-[#1a1d24] dark:border-gray-700 dark:text-gray-100"}
        `}
      >
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className={value ? "" : "text-gray-400"}>{value ? formatDisplay(value, lang) : (placeholder || (lang === "ar" ? "اختر تاريخاً" : lang === "fr" ? "Choisir une date" : "Pick a date"))}</span>
      </button>

      {open && (
        <div className="absolute z-[200] mt-1 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-72 select-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => {
              if (mode === "days") { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
              else if (mode === "years") setViewYear(y => y - 12);
            }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>

            <button type="button" onClick={() => setMode(m => m === "days" ? "months" : m === "months" ? "years" : "years")}
              className="text-sm font-semibold text-gray-800 dark:text-gray-100 hover:text-emerald-600 transition-colors px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
              {mode === "days" && `${months[viewMonth]} ${viewYear}`}
              {mode === "months" && viewYear}
              {mode === "years" && `${baseYear} – ${baseYear + 11}`}
            </button>

            <button type="button" onClick={() => {
              if (mode === "days") { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
              else if (mode === "years") setViewYear(y => y + 12);
            }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Days view */}
          {mode === "days" && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {days.map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => day === null ? <div key={`e-${i}`} /> : (
                  <button key={day} type="button" onClick={() => selectDay(day)}
                    className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm transition-colors
                      ${isSelected(day) ? "bg-emerald-600 text-white font-semibold" : isToday(day) ? "border border-emerald-400 text-emerald-600 font-semibold hover:bg-emerald-50" : "text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-700"}`}>
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Months view */}
          {mode === "months" && (
            <div className="grid grid-cols-3 gap-1">
              {months.map((m, i) => (
                <button key={m} type="button" onClick={() => { setViewMonth(i); setMode("days"); }}
                  className={`py-2 rounded-lg text-sm transition-colors ${viewMonth === i ? "bg-emerald-600 text-white font-semibold" : "hover:bg-emerald-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Years view */}
          {mode === "years" && (
            <div className="grid grid-cols-4 gap-1">
              {yearRange.map(y => (
                <button key={y} type="button" onClick={() => { setViewYear(y); setMode("months"); }}
                  className={`py-2 rounded-lg text-sm transition-colors ${viewYear === y ? "bg-emerald-600 text-white font-semibold" : "hover:bg-emerald-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"}`}>
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Today shortcut */}
          {mode === "days" && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-center">
              <button type="button" onClick={() => {
                const t = new Date();
                setViewYear(t.getFullYear()); setViewMonth(t.getMonth());
                selectDay(t.getDate());
              }} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                {lang === "ar" ? "اليوم" : lang === "fr" ? "Aujourd'hui" : "Today"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}