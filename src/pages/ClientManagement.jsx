import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { WILAYAS, PROPERTY_TYPES } from "../components/constants";
import { Users, Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const FURNISHED_OPTIONS = ["furnished", "semi_furnished", "unfurnished"];

function SearchProfileForm({ agentEmail, clientId, clientName, profile, lang, onSave, onCancel }) {
  const empty = { name: "", filters: {} };
  const [form, setForm] = useState(profile ? { name: profile.name || "", filters: { ...profile.filters } } : empty);
  const [saving, setSaving] = useState(false);

  const setFilter = (k, v) => setForm(f => ({ ...f, filters: { ...f.filters, [k]: v === "" ? undefined : v } }));

  async function save() {
    setSaving(true);
    const data = { client_id: clientId, client_name: clientName, agent_email: agentEmail, name: form.name, filters: form.filters };
    if (profile?.id) {
      await base44.entities.ClientSearchProfile.update(profile.id, data);
    } else {
      await base44.entities.ClientSearchProfile.create(data);
    }
    setSaving(false);
    onSave();
  }

  const f = form.filters;
  const L = lang;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">
          {L === "ar" ? "اسم الملف" : L === "fr" ? "Nom du profil" : "Profile name"}
        </label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder={L === "ar" ? "مثال: شقة في وهران" : L === "fr" ? "Ex: Appart Oran" : "Ex: Apt Oran"} className="h-8 text-sm" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {/* Listing type */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "نوع العملية" : L === "fr" ? "Type" : "Type"}</p>
          <Select value={f.listing_type || ""} onValueChange={v => setFilter("listing_type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>—</SelectItem>
              <SelectItem value="sale">{L === "ar" ? "بيع" : L === "fr" ? "Vente" : "Sale"}</SelectItem>
              <SelectItem value="rent">{L === "ar" ? "إيجار" : L === "fr" ? "Location" : "Rent"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Property type */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "نوع العقار" : L === "fr" ? "Bien" : "Property"}</p>
          <Select value={f.property_type || ""} onValueChange={v => setFilter("property_type", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>—</SelectItem>
              {PROPERTY_TYPES.map(pt => <SelectItem key={pt.value} value={pt.value}>{pt.label[L] || pt.label.fr}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {/* Wilaya */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "الولاية" : L === "fr" ? "Wilaya" : "Wilaya"}</p>
          <Select value={f.wilaya || ""} onValueChange={v => setFilter("wilaya", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent className="max-h-52">
              <SelectItem value={null}>—</SelectItem>
              {WILAYAS.map(w => <SelectItem key={w.value} value={w.value}>{w.label[L] || w.label.fr}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {/* Min price */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "سعر أدنى" : L === "fr" ? "Prix min" : "Min price"}</p>
          <Input type="number" value={f.min_price || ""} onChange={e => setFilter("min_price", e.target.value ? Number(e.target.value) : undefined)} className="h-8 text-xs" placeholder="0" />
        </div>
        {/* Max price */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "سعر أقصى" : L === "fr" ? "Prix max" : "Max price"}</p>
          <Input type="number" value={f.max_price || ""} onChange={e => setFilter("max_price", e.target.value ? Number(e.target.value) : undefined)} className="h-8 text-xs" placeholder="—" />
        </div>
        {/* Min area */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "مساحة أدنى (م²)" : L === "fr" ? "Surface min (m²)" : "Min area (m²)"}</p>
          <Input type="number" value={f.min_area || ""} onChange={e => setFilter("min_area", e.target.value ? Number(e.target.value) : undefined)} className="h-8 text-xs" placeholder="0" />
        </div>
        {/* Min bedrooms */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "غرف نوم أدنى" : L === "fr" ? "Chambres min" : "Min beds"}</p>
          <Input type="number" value={f.min_bedrooms || ""} onChange={e => setFilter("min_bedrooms", e.target.value ? Number(e.target.value) : undefined)} className="h-8 text-xs" placeholder="0" />
        </div>
        {/* Min bathrooms */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "حمامات أدنى" : L === "fr" ? "SDB min" : "Min baths"}</p>
          <Input type="number" value={f.min_bathrooms || ""} onChange={e => setFilter("min_bathrooms", e.target.value ? Number(e.target.value) : undefined)} className="h-8 text-xs" placeholder="0" />
        </div>
        {/* Furnished */}
        <div>
          <p className="text-xs text-gray-500 mb-1">{L === "ar" ? "تأثيث" : L === "fr" ? "Meublé" : "Furnished"}</p>
          <Select value={f.furnished || ""} onValueChange={v => setFilter("furnished", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>—</SelectItem>
              <SelectItem value="furnished">{L === "ar" ? "مفروش" : L === "fr" ? "Meublé" : "Furnished"}</SelectItem>
              <SelectItem value="semi_furnished">{L === "ar" ? "مفروش جزئياً" : L === "fr" ? "Semi-meublé" : "Semi"}</SelectItem>
              <SelectItem value="unfurnished">{L === "ar" ? "غير مفروش" : L === "fr" ? "Vide" : "Unfurnished"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1.5">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {L === "ar" ? "حفظ" : L === "fr" ? "Enregistrer" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" className="text-xs text-gray-500" onClick={onCancel}>
          {L === "ar" ? "إلغاء" : L === "fr" ? "Annuler" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}

function ClientCard({ client, lang, agentEmail, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: client.full_name, phone: client.phone || "", email: client.email || "", notes: client.notes || "" });
  const [profiles, setProfiles] = useState([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadProfiles() {
    if (profilesLoaded) return;
    const data = await base44.entities.ClientSearchProfile.filter({ client_id: client.id }, "-created_date", 50).catch(() => []);
    setProfiles(data);
    setProfilesLoaded(true);
  }

  async function saveEdit() {
    setSaving(true);
    await base44.entities.Client.update(client.id, editForm);
    onUpdate({ ...client, ...editForm });
    setEditing(false);
    setSaving(false);
  }

  async function deleteProfile(profileId) {
    await base44.entities.ClientSearchProfile.delete(profileId);
    setProfiles(prev => prev.filter(p => p.id !== profileId));
  }

  const L = lang;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {client.full_name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} className="h-8 text-sm font-medium" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="h-8 text-xs" placeholder={L === "ar" ? "الهاتف" : "Tél."} />
                <Input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-xs" placeholder="Email" />
              </div>
              <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-xs resize-none" placeholder={L === "ar" ? "ملاحظات..." : L === "fr" ? "Notes..." : "Notes..."} />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  {L === "ar" ? "حفظ" : L === "fr" ? "Sauvegarder" : "Save"}
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditing(false)}>{L === "ar" ? "إلغاء" : "Annuler"}</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-semibold text-gray-900 text-sm">{client.full_name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                {client.phone && <span className="text-xs text-gray-500">📞 {client.phone}</span>}
                {client.email && <span className="text-xs text-gray-500">✉️ {client.email}</span>}
              </div>
              {client.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{client.notes}</p>}
            </>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(client.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setExpanded(o => !o); if (!profilesLoaded) loadProfiles(); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-50 p-4 bg-gray-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              {L === "ar" ? "ملفات البحث" : L === "fr" ? "Profils de recherche" : "Search Profiles"}
              {profiles.length > 0 && <span className="ml-1.5 bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">{profiles.length}</span>}
            </p>
            {!addingProfile && (
              <button onClick={() => setAddingProfile(true)} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                <Plus className="w-3 h-3" />
                {L === "ar" ? "إضافة ملف بحث" : L === "fr" ? "Ajouter un profil" : "Add profile"}
              </button>
            )}
          </div>

          {addingProfile && (
            <SearchProfileForm
              agentEmail={agentEmail} clientId={client.id} clientName={client.full_name} lang={L}
              onSave={() => { setAddingProfile(false); setProfilesLoaded(false); loadProfiles(); }}
              onCancel={() => setAddingProfile(false)}
            />
          )}

          {profiles.length === 0 && !addingProfile && (
            <p className="text-xs text-gray-400 text-center py-2">
              {L === "ar" ? "لا توجد ملفات بحث بعد." : L === "fr" ? "Aucun profil de recherche." : "No search profiles yet."}
            </p>
          )}

          {profiles.map(profile => (
            <div key={profile.id}>
              {editingProfileId === profile.id ? (
                <SearchProfileForm
                  agentEmail={agentEmail} clientId={client.id} clientName={client.full_name} lang={L}
                  profile={profile}
                  onSave={() => { setEditingProfileId(null); setProfilesLoaded(false); loadProfiles(); }}
                  onCancel={() => setEditingProfileId(null)}
                />
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{profile.name || (L === "ar" ? "بدون اسم" : L === "fr" ? "Sans nom" : "Unnamed")}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(profile.filters || {}).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => (
                        <Badge key={k} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5">{k}: {String(v)}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setEditingProfileId(profile.id)} className="p-1 text-gray-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => deleteProfile(profile.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientManagement() {
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newClient, setNewClient] = useState({ full_name: "", phone: "", email: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }
    setUser(me);
    const data = await base44.entities.Client.filter({ agent_email: me.email }, "-created_date", 200).catch(() => []);
    setClients(data);
    setLoading(false);
  }

  async function addClient() {
    if (!newClient.full_name.trim() || !user) return;
    setSaving(true);
    const created = await base44.entities.Client.create({ ...newClient, agent_email: user.email });
    setClients(prev => [created, ...prev]);
    setNewClient({ full_name: "", phone: "", email: "", notes: "" });
    setShowForm(false);
    setSaving(false);
  }

  async function deleteClient(id) {
    if (!confirm(lang === "ar" ? "حذف هذا العميل؟" : lang === "fr" ? "Supprimer ce client ?" : "Delete this client?")) return;
    // Also delete their search profiles
    const profiles = await base44.entities.ClientSearchProfile.filter({ client_id: id }, null, 100).catch(() => []);
    await Promise.all(profiles.map(p => base44.entities.ClientSearchProfile.delete(p.id)));
    await base44.entities.Client.delete(id);
    setClients(prev => prev.filter(c => c.id !== id));
  }

  const isPro = user?.role === "professional" || user?.role === "admin";
  const L = lang;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );

  if (!user || !isPro) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-sm border">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {L === "ar" ? "متاح للمحترفين فقط" : L === "fr" ? "Réservé aux professionnels" : "Professionals Only"}
        </h2>
      </div>
    </div>
  );

  const filtered = clients.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                {L === "ar" ? "إدارة العملاء" : L === "fr" ? "Gestion des clients" : "Client Management"}
              </h1>
              <p className="text-emerald-200 text-sm mt-1">
                {clients.length} {L === "ar" ? "عميل" : L === "fr" ? "client(s)" : "client(s)"}
              </p>
            </div>
            <Button onClick={() => setShowForm(o => !o)} className="bg-white/20 hover:bg-white/30 text-white gap-2 border border-white/30">
              <Plus className="w-4 h-4" />
              {L === "ar" ? "إضافة عميل" : L === "fr" ? "Nouveau client" : "New Client"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Add client form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-800">
              {L === "ar" ? "إضافة عميل جديد" : L === "fr" ? "Nouveau client" : "New Client"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  {L === "ar" ? "الاسم الكامل *" : L === "fr" ? "Nom complet *" : "Full Name *"}
                </label>
                <Input value={newClient.full_name} onChange={e => setNewClient(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{L === "ar" ? "الهاتف" : L === "fr" ? "Téléphone" : "Phone"}</label>
                <Input value={newClient.phone} onChange={e => setNewClient(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
                <Input type="email" value={newClient.email} onChange={e => setNewClient(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">{L === "ar" ? "ملاحظات" : L === "fr" ? "Notes" : "Notes"}</label>
                <Input value={newClient.notes} onChange={e => setNewClient(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={addClient} disabled={saving || !newClient.full_name.trim()} className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {L === "ar" ? "إضافة" : L === "fr" ? "Ajouter" : "Add"}
              </Button>
              <Button variant="ghost" className="text-sm text-gray-500" onClick={() => setShowForm(false)}>
                {L === "ar" ? "إلغاء" : L === "fr" ? "Annuler" : "Cancel"}
              </Button>
            </div>
          </div>
        )}

        {/* Search bar */}
        {clients.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={L === "ar" ? "بحث في العملاء..." : L === "fr" ? "Rechercher un client..." : "Search clients..."}
              className="pl-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Client list */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white h-20 rounded-xl animate-pulse border" />)}</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-4">{L === "ar" ? "لا يوجد عملاء بعد." : L === "fr" ? "Aucun client pour l'instant." : "No clients yet."}</p>
            <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />{L === "ar" ? "إضافة أول عميل" : L === "fr" ? "Ajouter un client" : "Add first client"}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            {L === "ar" ? "لا توجد نتائج." : L === "fr" ? "Aucun résultat." : "No results."}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                lang={L}
                agentEmail={user.email}
                onDelete={deleteClient}
                onUpdate={updated => setClients(prev => prev.map(c => c.id === updated.id ? updated : c))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}