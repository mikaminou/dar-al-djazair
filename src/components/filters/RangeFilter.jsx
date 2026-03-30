import React, { useRef, useCallback, useEffect, useState } from "react";

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function snapToStep(val, step) {
  return Math.round(val / step) * step;
}

function formatLabel(val, unit, formatter) {
  if (formatter) return formatter(val);
  if (unit === "DZD") {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return `${val}`;
  }
  return `${val}${unit ? " " + unit : ""}`;
}

/**
 * RangeFilter — dual-handle drag slider for min/max range selection.
 *
 * Props:
 *   label        — string label shown above the slider
 *   min, max     — absolute bounds (numbers)
 *   step         — snap increment (default 1)
 *   minValue     — current min selection (number or "")
 *   maxValue     — current max selection (number or "")
 *   onMinChange  — (value: number|"") => void
 *   onMaxChange  — (value: number|"") => void
 *   unit         — display unit string ("m²", "DZD", etc.)
 *   formatter    — optional (value) => string for custom label formatting
 */
export default function RangeFilter({
  label,
  min = 0,
  max = 100,
  step = 1,
  minValue = "",
  maxValue = "",
  onMinChange,
  onMaxChange,
  unit = "",
  formatter,
}) {
  const trackRef = useRef(null);
  const dragging = useRef(null); // "min" | "max" | null

  const resolvedMin = minValue === "" ? min : Number(minValue);
  const resolvedMax = maxValue === "" ? max : Number(maxValue);

  function getPct(val) {
    return ((val - min) / (max - min)) * 100;
  }

  function valueFromClientX(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
    return snapToStep(min + pct * (max - min), step);
  }

  const handleMove = useCallback((clientX) => {
    if (!dragging.current || !trackRef.current) return;
    const val = valueFromClientX(clientX);
    if (dragging.current === "min") {
      const newMin = clamp(val, min, resolvedMax - step);
      onMinChange?.(newMin === min ? "" : newMin);
    } else {
      const newMax = clamp(val, resolvedMin + step, max);
      onMaxChange?.(newMax === max ? "" : newMax);
    }
  }, [resolvedMin, resolvedMax, min, max, step]);

  const handleMouseMove = useCallback((e) => handleMove(e.clientX), [handleMove]);
  const handleTouchMove = useCallback((e) => handleMove(e.touches[0].clientX), [handleMove]);
  const stopDrag = useCallback(() => { dragging.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", stopDrag);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [handleMouseMove, handleTouchMove, stopDrag]);

  const minPct = getPct(resolvedMin);
  const maxPct = getPct(resolvedMax);

  const isDefault = minValue === "" && maxValue === "";

  return (
    <div className="select-none">
      {label && (
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs text-gray-500 font-medium">{label}</label>
          <span className="text-xs font-semibold text-emerald-700">
            {isDefault
              ? <span className="text-gray-400 font-normal">—</span>
              : `${formatLabel(resolvedMin, unit, formatter)} – ${formatLabel(resolvedMax, unit, formatter)}`
            }
          </span>
        </div>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-1.5 bg-gray-200 rounded-full mx-2 cursor-pointer"
        onClick={(e) => {
          // Click on track → snap nearest handle
          const val = valueFromClientX(e.clientX);
          const distMin = Math.abs(val - resolvedMin);
          const distMax = Math.abs(val - resolvedMax);
          if (distMin <= distMax) {
            const newMin = clamp(val, min, resolvedMax - step);
            onMinChange?.(newMin === min ? "" : newMin);
          } else {
            const newMax = clamp(val, resolvedMin + step, max);
            onMaxChange?.(newMax === max ? "" : newMax);
          }
        }}
      >
        {/* Active range highlight */}
        <div
          className="absolute top-0 h-full bg-emerald-500 rounded-full"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />

        {/* Min thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
          style={{ left: `${minPct}%` }}
          onMouseDown={(e) => { e.preventDefault(); dragging.current = "min"; }}
          onTouchStart={() => { dragging.current = "min"; }}
        />

        {/* Max thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-full shadow cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10"
          style={{ left: `${maxPct}%` }}
          onMouseDown={(e) => { e.preventDefault(); dragging.current = "max"; }}
          onTouchStart={() => { dragging.current = "max"; }}
        />
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>{formatLabel(min, unit, formatter)}</span>
        <span>{formatLabel(max, unit, formatter)}</span>
      </div>
    </div>
  );
}