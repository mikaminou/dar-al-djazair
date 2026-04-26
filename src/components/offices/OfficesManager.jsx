import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, GripVertical, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import OfficeCard from "./OfficeCard";
import OfficeForm from "./OfficeForm";

function generateId() {
  return `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function OfficesManager({ offices = [], lang, onChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const lbl = (en, fr, ar) => lang === "ar" ? ar : lang === "fr" ? fr : en;

  function handleAdd(formData) {
    const now = new Date().toISOString();
    const newOffice = {
      ...formData,
      id: generateId(),
      is_verified: false,
      created_at: now,
      updated_at: now,
    };

    let updated = [...offices, newOffice];

    // If first office or marked as primary, enforce single primary
    if (newOffice.is_primary || updated.length === 1) {
      updated = updated.map(o => ({ ...o, is_primary: o.id === newOffice.id }));
    }

    onChange(updated);
    setShowForm(false);
  }

  function handleEdit(formData) {
    const now = new Date().toISOString();
    let updated = offices.map(o =>
      o.id === editingId ? { ...o, ...formData, updated_at: now } : o
    );

    // Enforce single primary
    if (formData.is_primary) {
      updated = updated.map(o => ({ ...o, is_primary: o.id === editingId }));
    }

    // If no primary left, make first one primary
    if (!updated.some(o => o.is_primary) && updated.length > 0) {
      updated[0] = { ...updated[0], is_primary: true };
    }

    onChange(updated);
    setEditingId(null);
  }

  function handleDelete(id) {
    let updated = offices.filter(o => o.id !== id);
    // If deleted was primary, make next first one primary
    if (!updated.some(o => o.is_primary) && updated.length > 0) {
      updated[0] = { ...updated[0], is_primary: true };
    }
    onChange(updated);
  }

  function handleSetPrimary(id) {
    onChange(offices.map(o => ({ ...o, is_primary: o.id === id })));
  }

  function handleDragEnd(result) {
    if (!result.destination) return;
    const reordered = Array.from(offices);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onChange(reordered);
  }

  // Sort: primary first for display
  const sorted = [...offices].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

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
          <Button type="button" size="sm" onClick={() => setShowForm(true)} className="mt-3 bg-emerald-600 hover:bg-emerald-700 gap-1.5 text-xs">
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