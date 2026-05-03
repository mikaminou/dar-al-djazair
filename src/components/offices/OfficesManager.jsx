import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, GripVertical, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import OfficeCard from "./OfficeCard";
import OfficeForm from "./OfficeForm";

// Manages an agency's offices via the AgencyOffice entity (one row per office,
// owned by the agency through agent_email -> profiles.id on the server).
// Replaces the old JSON-blob-on-user model.

export default function OfficesManager({ agentEmail, lang }) {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const lbl = (en, fr, ar) => lang === "ar" ? ar : lang === "fr" ? fr : en;

  async function load() {
    if (!agentEmail) { setLoading(false); return; }
    const data = await base44.entities.AgencyOffice
      .filter({ agent_email: agentEmail }, null, 100)
      .catch(() => []);
    setOffices(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [agentEmail]);

  async function handleAdd(formData) {
    setBusy(true);
    await base44.entities.AgencyOffice.create({
      ...formData,
      agent_email: agentEmail,
      display_order: offices.length,
    });
    setShowForm(false);
    await load();
    setBusy(false);
  }

  async function handleEdit(formData) {
    setBusy(true);
    await base44.entities.AgencyOffice.update(editingId, formData);
    setEditingId(null);
    await load();
    setBusy(false);
  }

  async function handleDelete(id) {
    setBusy(true);
    await base44.entities.AgencyOffice.delete(id);
    await load();
    setBusy(false);
  }

  async function handleSetPrimary(id) {
    setBusy(true);
    await base44.entities.AgencyOffice.update(id, { is_primary: true });
    await load();
    setBusy(false);
  }

  async function handleDragEnd(result) {
    if (!result.destination) return;
    const reordered = Array.from(offices);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setOffices(reordered); // optimistic
    // Persist new display_order
    await Promise.all(
      reordered.map((o, idx) =>
        o.display_order === idx
          ? null
          : base44.entities.AgencyOffice.update(o.id, { display_order: idx })
      ).filter(Boolean)
    );
  }

  // Sort: primary first for display
  const sorted = [...offices].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm">{lbl("Loading offices…", "Chargement…", "جارٍ التحميل…")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          {lbl("Our Offices", "Nos bureaux", "مكاتبنا")}
        </h3>
        {!showForm && !editingId && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="gap-1.5 text-xs"
            disabled={busy}
          >
            <Plus className="w-3.5 h-3.5" />
            {lbl("Add an office", "Ajouter un bureau", "إضافة مكتب")}
          </Button>
        )}
      </div>

      {offices.length === 0 && !showForm && (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
          <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {lbl("No office locations added yet.", "Aucun bureau ajouté.", "لم تتم إضافة أي مكتب بعد.")}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {lbl(
              "Add your office locations to help seekers find you. Optional but recommended.",
              "Ajoutez vos bureaux pour aider les chercheurs à vous trouver. Optionnel mais recommandé.",
              "أضف مواقع مكاتبك لمساعدة الباحثين في العثور عليك. اختياري ولكن موصى به."
            )}
          </p>
          <Button type="button" size="sm" onClick={() => setShowForm(true)} className="mt-3 bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs" disabled={busy}>
            <Plus className="w-3.5 h-3.5" />
            {lbl("Add an office", "Ajouter un bureau", "إضافة مكتب")}
          </Button>
        </div>
      )}

      {showForm && (
        <OfficeForm
          lang={lang}
          isPrimary={offices.length === 0}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="offices">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {sorted.map((office, index) => (
                <Draggable key={office.id} draggableId={office.id} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`flex items-start gap-2 ${snapshot.isDragging ? "opacity-80" : ""}`}
                    >
                      <div
                        {...drag.dragHandleProps}
                        className="mt-3 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingId === office.id ? (
                          <OfficeForm
                            office={office}
                            lang={lang}
                            onSave={handleEdit}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <OfficeCard
                            office={office}
                            lang={lang}
                            editable
                            onEdit={() => setEditingId(office.id)}
                            onDelete={() => handleDelete(office.id)}
                            onSetPrimary={() => handleSetPrimary(office.id)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}