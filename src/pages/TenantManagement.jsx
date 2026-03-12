import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Users, Plus, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "../components/LanguageContext";
import TenantList from "../components/tenants/TenantList";
import TenantForm from "../components/tenants/TenantForm";

export default function TenantManagementPage() {
  const { lang } = useLang();
  const [currentUser, setCurrentUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      setLoading(false);
      return;
    }
    setCurrentUser(me);

    const data = await base44.entities.Tenant.filter({ landlord_email: me.email }, "-created_date");
    setTenants(data);
    setLoading(false);
  }

  async function handleSave(tenantData) {
    if (editingTenant) {
      await base44.entities.Tenant.update(editingTenant.id, tenantData);
      setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...t, ...tenantData } : t));
    } else {
      const created = await base44.entities.Tenant.create({ ...tenantData, landlord_email: currentUser.email });
      setTenants(prev => [created, ...prev]);
    }
    setShowForm(false);
    setEditingTenant(null);
  }

  async function handleDelete(tenantId) {
    if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا المستأجر؟" : lang === "fr" ? "Êtes-vous sûr?" : "Are you sure?")) {
      await base44.entities.Tenant.delete(tenantId);
      setTenants(prev => prev.filter(t => t.id !== tenantId));
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Button onClick={() => base44.auth.redirectToLogin()}>
          {lang === "ar" ? "تسجيل الدخول" : lang === "fr" ? "Se connecter" : "Sign In"}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {lang === "ar" ? "إدارة المستأجرين" : lang === "fr" ? "Gestion des locataires" : "Tenant Management"}
            </h1>
          </div>
          <Button onClick={() => { setEditingTenant(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="w-4 h-4" />
            {lang === "ar" ? "إضافة مستأجر" : lang === "fr" ? "Ajouter un locataire" : "Add Tenant"}
          </Button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <TenantForm
                tenant={editingTenant}
                currentUser={currentUser}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingTenant(null); }}
                lang={lang}
              />
            </div>
          </div>
        )}

        {/* Tenants List */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">
              {lang === "ar" ? "لا توجد سجلات مستأجرين" : lang === "fr" ? "Aucun locataire enregistré" : "No tenant records yet"}
            </p>
            <Button onClick={() => { setEditingTenant(null); setShowForm(true); }} className="bg-emerald-600">
              {lang === "ar" ? "أضف مستأجرك الأول" : lang === "fr" ? "Ajouter votre premier locataire" : "Add Your First Tenant"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tenants.map(tenant => (
              <TenantList
                key={tenant.id}
                tenant={tenant}
                onEdit={() => { setEditingTenant(tenant); setShowForm(true); }}
                onDelete={() => handleDelete(tenant.id)}
                lang={lang}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}