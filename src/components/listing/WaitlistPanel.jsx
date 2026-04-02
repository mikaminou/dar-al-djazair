import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Loader2, Trash2, CheckCircle, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function WaitlistPanel({ listing, lang }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editNotes, setEditNotes] = useState({}); // id -> note text
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!listing?.id) return;
    base44.entities.Waitlist.filter({ listing_id: listing.id }, "position", 200)
      .then(res => { setEntries(res); setLoading(false); })
      .catch(() => setLoading(false));
  }, [listing?.id]);

  const waiting = entries.filter(e => e.status !== "withdrawn");

  async function markContacted(entry) {
    setSavingId(entry.id);
    await base44.entities.Waitlist.update(entry.id, { status: "contacted" });
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "contacted" } : e));
    setSavingId(null);
  }

  async function remove(entry) {
    if (!confirm(lang === "ar" ? "حذف هذا الشخص من قائمة الانتظار؟" : lang === "fr" ? "Retirer de la liste d'attente ?" : "Remove from waitlist?")) return;
    await base44.entities.Waitlist.update(entry.id, { status: "withdrawn" });
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "withdrawn" } : e));
  }

  async function saveNote(entry) {
    setSavingId(entry.id + "_note");
    const note = editNotes[entry.id] ?? entry.notes ?? "";
    await base44.entities.Waitlist.update(entry.id, { notes: note });
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, notes: note } : e));
    setEditNotes(prev => { const n = { ...prev }; delete n[entry.id]; return n; });
    setSavingId(null);
  }

  if (loading || waiting.length === 0) return null;

  const statusBadge = {
    waiting:   { en: "Waiting",   fr: "En attente", ar: "ينتظر",   cls: "bg-amber-100 text-amber-700" },
    contacted: { en: "Contacted", fr: "Contacté",   ar: "تم التواصل", cls: "bg-blue-100 text-blue-700" },
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-amber-50 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            {lang === "ar" ? `قائمة الانتظار (${waiting.length})` : lang === "fr" ? `Liste d'attente (${waiting.length})` : `Waitlist (${waiting.length})`}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
      </button>

      {open && (
        <div className="divide-y divide-gray-50">
          {waiting.map(entry => (
            <div key={entry.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    #{entry.position} — {entry.user_name || `${lang === "ar" ? "زائر" : lang === "fr" ? "Visiteur" : "Visitor"} #${entry.position}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.joined_at).toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={statusBadge[entry.status]?.cls || "bg-gray-100"}>
                    {statusBadge[entry.status]?.[lang] || statusBadge[entry.status]?.en || entry.status}
                  </Badge>
                  {entry.status === "waiting" && (
                    <button
                      onClick={() => markContacted(entry)}
                      disabled={savingId === entry.id}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      title={lang === "ar" ? "تم التواصل" : lang === "fr" ? "Marquer contacté" : "Mark as Contacted"}
                    >
                      {savingId === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    </button>
                  )}
                  <button
                    onClick={() => remove(entry)}
                    className="text-red-400 hover:text-red-600"
                    title={lang === "ar" ? "إزالة" : lang === "fr" ? "Retirer" : "Remove"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Notes */}
              <Textarea
                value={editNotes[entry.id] ?? entry.notes ?? ""}
                onChange={e => setEditNotes(prev => ({ ...prev, [entry.id]: e.target.value }))}
                placeholder={lang === "ar" ? "ملاحظات داخلية (غير مرئية للزائر)..." : lang === "fr" ? "Notes internes (non visibles par le visiteur)..." : "Internal notes (not visible to seeker)..."}
                rows={2}
                className="text-xs resize-none"
              />
              {editNotes[entry.id] !== undefined && editNotes[entry.id] !== (entry.notes ?? "") && (
                <button
                  onClick={() => saveNote(entry)}
                  disabled={savingId === entry.id + "_note"}
                  className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  {savingId === entry.id + "_note" ? "..." : (lang === "ar" ? "حفظ الملاحظة" : lang === "fr" ? "Sauvegarder" : "Save note")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}