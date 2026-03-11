import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MessageSquare, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const COLUMNS = [
  { id: "new",       label: { en: "New",       fr: "Nouveau",   ar: "جديد"       }, headerColor: "bg-blue-500",   bg: "bg-blue-50 border-blue-200"   },
  { id: "contacted", label: { en: "Contacted", fr: "Contacté",  ar: "تم التواصل"  }, headerColor: "bg-amber-500",  bg: "bg-amber-50 border-amber-200"  },
  { id: "viewing",   label: { en: "Viewing",   fr: "Visite",    ar: "معاينة"      }, headerColor: "bg-purple-500", bg: "bg-purple-50 border-purple-200" },
  { id: "closed",    label: { en: "Closed",    fr: "Clôturé",   ar: "مغلق"       }, headerColor: "bg-gray-400",   bg: "bg-gray-50 border-gray-200"    },
];

export default function LeadsKanban({ leads, onStatusChange, onMessage, lang }) {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter(l => (l.status || "new") === col.id);
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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-68" style={{ minWidth: "260px" }}>
            <div className={`rounded-t-xl px-3 py-2.5 flex items-center justify-between ${col.headerColor}`}>
              <span className="text-white font-semibold text-sm">{col.label[lang] || col.label.en}</span>
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-bold">{grouped[col.id]?.length || 0}</span>
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
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-lg border border-gray-100 shadow-sm p-3 mb-2 select-none transition-shadow ${snapshot.isDragging ? "shadow-xl rotate-1 scale-105" : "hover:shadow-md"}`}
                        >
                          <p className="font-semibold text-xs text-gray-800 truncate mb-1 leading-snug">
                            {lead.listing_title || lead.listing_id}
                          </p>
                          <p className="text-xs text-emerald-700 font-medium truncate mb-1">
                            {lead.seeker_email?.split("@")[0]}
                          </p>
                          {lead.listing_wilaya && (
                            <p className="text-xs text-gray-400 mb-2">📍 {lead.listing_wilaya}</p>
                          )}
                          <div className="flex gap-1.5 mt-2">
                            <Button
                              size="sm"
                              className="h-6 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1"
                              onClick={() => onMessage(lead)}
                            >
                              <MessageSquare className="w-3 h-3" />
                            </Button>
                            <Link to={createPageUrl(`Profile?email=${encodeURIComponent(lead.seeker_email)}`)}>
                              <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                                <UserCircle className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Link to={createPageUrl(`ListingDetail?id=${lead.listing_id}`)}>
                              <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-gray-400">
                                🏠
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {grouped[col.id]?.length === 0 && !snapshot.isDraggingOver && (
                    <div className="text-center py-6 text-gray-300 text-xs">
                      {lang === "ar" ? "لا يوجد" : lang === "fr" ? "Vide" : "Empty"}
                    </div>
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