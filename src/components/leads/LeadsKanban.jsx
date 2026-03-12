import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MessageSquare, UserCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const COLUMNS = [
  { id: "new",       label: { en: "New",        fr: "Nouveau",    ar: "جديد"        }, headerColor: "bg-blue-500",   bg: "bg-blue-50/60 border-blue-200"    },
  { id: "contacted", label: { en: "Contacted",   fr: "Contacté",   ar: "تم التواصل"  }, headerColor: "bg-amber-500",  bg: "bg-amber-50/60 border-amber-200"  },
  { id: "viewing",   label: { en: "Viewing",     fr: "Visite",     ar: "معاينة"      }, headerColor: "bg-purple-500", bg: "bg-purple-50/60 border-purple-200" },
  { id: "won",       label: { en: "Won 🏆",      fr: "Gagné 🏆",   ar: "ناجح 🏆"     }, headerColor: "bg-emerald-600",bg: "bg-emerald-50/60 border-emerald-200"},
  { id: "lost",      label: { en: "Lost",        fr: "Perdu",      ar: "فاشل"        }, headerColor: "bg-red-400",    bg: "bg-red-50/60 border-red-200"       },
];

export default function LeadsKanban({ leads, onStatusChange, onMessage, lang }) {
  const [mobileCol, setMobileCol] = useState(0);

  // treat legacy "closed" as "lost"
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter(l => {
      const s = l.status || "new";
      if (col.id === "lost") return s === "lost" || s === "closed";
      return s === col.id;
    });
    return acc;
  }, {});

  function onDragEnd(result) {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const lead = leads.find(l => l.id === result.draggableId);
    if (lead && lead.status !== newStatus) {
      onStatusChange(lead, newStatus);
    }
  }

  const col = COLUMNS[mobileCol];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* ── MOBILE: tab-style single column ── */}
      <div className="md:hidden">
        {/* Column tabs */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {COLUMNS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setMobileCol(i)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                i === mobileCol
                  ? `${c.headerColor} text-white shadow-sm`
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {c.label[lang] || c.label.en}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${i === mobileCol ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                {grouped[c.id]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Active column */}
        <Droppable droppableId={col.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-48 p-2 border rounded-xl transition-colors ${col.bg} ${snapshot.isDraggingOver ? "ring-2 ring-inset ring-emerald-300" : ""}`}
            >
              {grouped[col.id]?.map((lead, index) => (
                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                  {(provided, snapshot) => (
                    <LeadCard provided={provided} snapshot={snapshot} lead={lead} onMessage={onMessage} lang={lang} />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {grouped[col.id]?.length === 0 && !snapshot.isDraggingOver && (
                <EmptyCol lang={lang} />
              )}
            </div>
          )}
        </Droppable>

        {/* Prev/Next nav */}
        <div className="flex justify-between items-center mt-3">
          <button disabled={mobileCol === 0} onClick={() => setMobileCol(i => i - 1)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" /> {COLUMNS[mobileCol - 1]?.label[lang]}
          </button>
          <span className="text-xs text-gray-400">{mobileCol + 1} / {COLUMNS.length}</span>
          <button disabled={mobileCol === COLUMNS.length - 1} onClick={() => setMobileCol(i => i + 1)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30">
            {COLUMNS[mobileCol + 1]?.label[lang]} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── DESKTOP: all columns side by side ── */}
      <div className="hidden md:flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-1 min-w-[220px] max-w-[280px]">
            <div className={`rounded-t-xl px-3 py-2.5 flex items-center justify-between ${col.headerColor}`}>
              <span className="text-white font-semibold text-sm">{col.label[lang] || col.label.en}</span>
              <span className="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full font-bold">{grouped[col.id]?.length || 0}</span>
            </div>
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-40 p-2 border border-t-0 rounded-b-xl transition-colors ${col.bg} ${snapshot.isDraggingOver ? "ring-2 ring-inset ring-emerald-300" : ""}`}
                >
                  {grouped[col.id]?.map((lead, index) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(provided, snapshot) => (
                        <LeadCard provided={provided} snapshot={snapshot} lead={lead} onMessage={onMessage} lang={lang} />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {grouped[col.id]?.length === 0 && !snapshot.isDraggingOver && (
                    <EmptyCol lang={lang} />
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

function LeadCard({ provided, snapshot, lead, onMessage, lang }) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-2 select-none transition-shadow ${snapshot.isDragging ? "shadow-xl rotate-1 scale-105" : "hover:shadow-md"}`}
    >
      <p className="font-semibold text-xs text-gray-800 truncate mb-0.5 leading-snug">
        {lead.listing_title || lead.listing_id}
      </p>
      <p className="text-xs text-emerald-700 font-medium truncate mb-0.5">
        {lead.seeker_email?.split("@")[0]}
      </p>
      {lead.listing_wilaya && (
        <p className="text-xs text-gray-400">📍 {lead.listing_wilaya}</p>
      )}
      <div className="flex gap-1.5 mt-2.5">
        <Button size="sm" className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1" onClick={() => onMessage(lead)}>
          <MessageSquare className="w-3 h-3" />
        </Button>
        <Link to={createPageUrl(`Profile?email=${encodeURIComponent(lead.seeker_email)}`)}>
          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
            <UserCircle className="w-3 h-3" />
          </Button>
        </Link>
        <Link to={createPageUrl(`ListingDetail?id=${lead.listing_id}`)}>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-gray-400 hover:text-gray-600">
            🏠
          </Button>
        </Link>
      </div>
    </div>
  );
}

function EmptyCol({ lang }) {
  return (
    <div className="text-center py-8 text-gray-300 text-xs border-2 border-dashed border-current rounded-lg m-1">
      {lang === "ar" ? "اسحب هنا" : lang === "fr" ? "Déposer ici" : "Drop here"}
    </div>
  );
}