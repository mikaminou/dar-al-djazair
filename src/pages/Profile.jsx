import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useLang } from "../components/LanguageContext";
import { formatPrice, WILAYAS } from "../components/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Phone, MapPin, Globe, Building2, Edit2, Save, X, Home, Trash2, Camera } from "lucide-react";
import UserAvatar from "../components/UserAvatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ListingCard from "../components/listing/ListingCard";
import VerifiedBadge from "../components/trust/VerifiedBadge";
import VerificationSection from "../components/trust/VerificationSection";
import ReviewsSection from "../components/trust/ReviewsSection";
import MobileHeader from "../components/MobileHeader";

const inputCls = "bg-white text-gray-900 placeholder-gray-400 dark:bg-[#1a1d24] dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500";
const labelCls = "text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block";
const selectCls = "w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d24] text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

export default function ProfilePage() {
  const { t, lang } = useLang();
  const params = new URLSearchParams(window.location.search);
  const profileEmail = params.get("email");

  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef();

  const isOwnProfile = !profileEmail || profileEmail === currentUser?.email;

  useEffect(() => { load(); }, [profileEmail]);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setCurrentUser(me);

    const targetEmail = profileEmail || me?.email;
    if (!targetEmail) { setLoading(false); return; }

    let userInfo = null;
    if (profileEmail) {
      const users = await base44.entities.User.filter({ email: profileEmail }).catch(() => []);
      userInfo = users[0] || { email: profileEmail };
    } else {
      userInfo = me;
    }
    setProfileUser(userInfo);
    setForm({
      phone: userInfo?.phone || "",
      bio: userInfo?.bio || "",
      agency_name: userInfo?.agency_name || "",
      owner_full_name: userInfo?.owner_full_name || "",
      professional_type: userInfo?.professional_type || "",
      years_of_experience: userInfo?.years_of_experience ?? "",
      wilaya: userInfo?.wilaya || "",
      website: userInfo?.website || "",
      avatar_url: userInfo?.avatar_url || "",
    });

    const data = await base44.entities.Listing.filter({ created_by: targetEmail, status: "active" }, "-created_date", 20);
    setListings(data);

    if (me) {
      const favs = await base44.entities.Favorite.filter({ user_email: me.email }).catch(() => []);
      setFavorites(favs.map(f => f.listing_id));
    }

    setLoading(false);
  }

  async function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, avatar_url: file_url }));
    setUploadingAvatar(false);
  }

  async function saveProfile() {
    setSaving(true);
    await base44.auth.updateMe(form);
    setProfileUser(prev => ({ ...prev, ...form }));
    setAvatarPreview('');
    setEditing(false);
    setSaving(false);
  }

  async function deleteAccount() {
    setDeletingAccount(true);
    const userListings = await base44.entities.Listing.filter({ created_by: currentUser.email }, "", 1000);
    for (const listing of userListings) {
      await base44.entities.Listing.delete(listing.id);
    }
    base44.auth.logout("/");
  }

  async function toggleFavorite(listing) {
    const isFav = favorites.includes(listing.id);
    if (isFav) {
      const favs = await base44.entities.Favorite.filter({ listing_id: listing.id, user_email: currentUser?.email });
      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      setFavorites(prev => prev.filter(id => id !== listing.id));
    } else {
      await base44.entities.Favorite.create({ listing_id: listing.id, user_email: currentUser?.email });
      setFavorites(prev => [...prev, listing.id]);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1115]">
      <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!profileUser) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#0f1115]">
      {lang === "ar" ? "المستخدم غير موجود" : lang === "fr" ? "Utilisateur introuvable" : "User not found"}
    </div>
  );

  const displayName = profileUser.agency_name || profileUser.full_name || profileUser.email;
  const isProfessional = profileUser.role === "professional";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115]">
      <MobileHeader title={displayName || (lang === "ar" ? "الملف الشخصي" : lang === "fr" ? "Profil" : "Profile")} />

      {/* Header Banner */}
      <div className="bg-emerald-800 h-40" />

      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-[#13161c] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 -mt-16 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-700 shadow overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserAvatar user={profileUser} size="xl" />
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {isOwnProfile && editing && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-emerald-600 text-white rounded-full p-1.5 shadow hover:bg-emerald-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarFileChange} />
                </>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h1>
                    {profileUser.is_verified && (
                      <VerifiedBadge type={profileUser.verification_type || "individual"} size="sm" lang={lang} />
                    )}
                  </div>
                  {isProfessional && profileUser.is_verified && (
                    <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 mt-1">
                      <Building2 className="w-3 h-3 mr-1" />
                      {profileUser.professional_type === 'agence_immobiliere'
                        ? (lang === 'ar' ? 'وكالة عقارية' : lang === 'fr' ? 'Agence immobilière' : 'Real Estate Agency')
                        : profileUser.professional_type === 'promoteur'
                        ? (lang === 'ar' ? 'مرقي عقاري' : lang === 'fr' ? 'Promoteur immobilier' : 'Property Developer')
                        : (lang === 'ar' ? 'محترف عقاري' : lang === 'fr' ? 'Professionnel immobilier' : 'Real Estate Professional')}
                      {profileUser.years_of_experience ? ` · ${profileUser.years_of_experience} ${lang === 'ar' ? 'سنة' : lang === 'fr' ? 'ans' : 'yrs'}` : ''}
                    </Badge>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {profileUser.wilaya && (
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profileUser.wilaya}</span>
                    )}
                    {profileUser.phone && (
                      <a href={`tel:${profileUser.phone}`} className="flex items-center gap-1 hover:text-emerald-600">
                        <Phone className="w-4 h-4" />{profileUser.phone}
                      </a>
                    )}
                    {profileUser.website && (
                      <a href={profileUser.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-600">
                        <Globe className="w-4 h-4" />{profileUser.website}
                      </a>
                    )}
                  </div>
                  {profileUser.bio && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 max-w-xl">{profileUser.bio}</p>
                  )}
                </div>

                {isOwnProfile && !editing && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      {lang === "ar" ? "تعديل الملف" : lang === "fr" ? "Modifier le profil" : "Edit Profile"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950">
                          <Trash2 className="w-4 h-4" />
                          {lang === "ar" ? "حذف الحساب" : lang === "fr" ? "Supprimer le compte" : "Delete Account"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{lang === "ar" ? "حذف الحساب" : lang === "fr" ? "Supprimer le compte" : "Delete Account"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {lang === "ar" ? "هذا الإجراء لا يمكن التراجع عنه. سيتم حذف حسابك وجميع إعلاناتك بشكل نهائي." : lang === "fr" ? "Cette action est irréversible. Votre compte et toutes vos annonces seront supprimés définitivement." : "This action is irreversible. Your account and all your listings will be permanently deleted."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3">
                          <AlertDialogCancel>
                            {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={deleteAccount} disabled={deletingAccount} className="bg-red-600 hover:bg-red-700">
                            {deletingAccount ? "..." : (lang === "ar" ? "حذف نهائياً" : lang === "fr" ? "Supprimer" : "Delete Permanently")}
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verification section */}
          {isOwnProfile && !editing && (
            <VerificationSection user={profileUser} lang={lang} />
          )}

          {/* Edit Form */}
          {editing && (
            <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isProfessional && (
                  <>
                    <div>
                      <label className={labelCls}>
                        {lang === "ar" ? "اسم المالك" : lang === "fr" ? "Nom du propriétaire" : "Owner Name"}
                      </label>
                      <Input value={form.owner_full_name} onChange={e => setForm(p => ({ ...p, owner_full_name: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>
                        {lang === "ar" ? "اسم النشاط التجاري" : lang === "fr" ? "Nom de l'entreprise" : "Business Name"}
                      </label>
                      <Input value={form.agency_name} onChange={e => setForm(p => ({ ...p, agency_name: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>
                        {lang === "ar" ? "نوع المحترف" : lang === "fr" ? "Type de professionnel" : "Professional Type"}
                      </label>
                      <select
                        value={form.professional_type}
                        onChange={e => setForm(p => ({ ...p, professional_type: e.target.value }))}
                        className={selectCls}
                      >
                        <option value="">—</option>
                        <option value="agence_immobiliere">{lang === "ar" ? "وكالة عقارية" : lang === "fr" ? "Agence immobilière" : "Real Estate Agency"}</option>
                        <option value="promoteur">{lang === "ar" ? "مرقي عقاري" : lang === "fr" ? "Promoteur immobilier" : "Property Developer"}</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>
                        {lang === "ar" ? "سنوات الخبرة" : lang === "fr" ? "Années d'expérience" : "Years of Experience"}
                      </label>
                      <Input type="number" min="0" max="60" value={form.years_of_experience} onChange={e => setForm(p => ({ ...p, years_of_experience: e.target.value }))} placeholder="0" className={inputCls} />
                    </div>
                  </>
                )}
                <div>
                  <label className={labelCls}>
                    {lang === "ar" ? "رقم الهاتف" : lang === "fr" ? "Téléphone" : "Phone"}
                  </label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+213 ..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>
                    {lang === "ar" ? "الولاية" : lang === "fr" ? "Wilaya" : "Wilaya"}
                  </label>
                  <Select value={form.wilaya} onValueChange={v => setForm(p => ({ ...p, wilaya: v }))}>
                    <SelectTrigger className="bg-white text-gray-900 dark:bg-[#1a1d24] dark:border-gray-700 dark:text-gray-100">
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent>
                      {WILAYAS.map(w => <SelectItem key={w.value} value={w.value}>{w.label[lang] || w.label.fr}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelCls}>
                    {lang === "ar" ? "الموقع الإلكتروني" : lang === "fr" ? "Site web" : "Website"}
                  </label>
                  <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  {lang === "ar" ? "نبذة عنك" : lang === "fr" ? "Présentation" : "Bio"}
                </label>
                <Textarea
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  placeholder={lang === "ar" ? "اكتب نبذة عنك..." : lang === "fr" ? "Décrivez-vous..." : "Tell us about yourself..."}
                  className={`resize-none ${inputCls}`}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "..." : (lang === "ar" ? "حفظ" : lang === "fr" ? "Enregistrer" : "Save")}
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); setAvatarPreview(''); }} className="gap-2">
                  <X className="w-4 h-4" />
                  {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Reviews */}
        <ReviewsSection userEmail={profileUser.email} lang={lang} />

        {/* Listings */}
        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-emerald-600" />
          {lang === "ar" ? "إعلانات المستخدم" : lang === "fr" ? "Annonces publiées" : "Published Listings"}
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({listings.length})</span>
        </h2>

        {listings.length === 0 ? (
          <div className="bg-white dark:bg-[#13161c] rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center text-gray-400 dark:text-gray-500 mb-10">
            {lang === "ar" ? "لا توجد إعلانات" : lang === "fr" ? "Aucune annonce" : "No listings yet"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}