import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function FullscreenGallery({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 50 && dy < 80) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white/60 text-sm font-medium tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main image area */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 px-12"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Prev arrow */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        <img
          key={index}
          src={images[index]}
          alt={`Photo ${index + 1}`}
          className="max-h-full max-w-full object-contain rounded-lg select-none"
          style={{ animation: "fadeIn 0.18s ease" }}
          draggable={false}
        />

        {/* Next arrow */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none justify-center"
          onClick={e => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                i === index ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0.4; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}