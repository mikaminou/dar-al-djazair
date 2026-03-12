import React, { useState, useEffect } from "react";
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
import { User, Phone, MapPin, Globe, Building2, Edit2, Save, X, Home } from "lucide-react";
import ListingCard from "../components/listing/ListingCard";
import VerifiedBadge from "../components/trust/VerifiedBadge";
import VerificationSection from "../components/trust/VerificationSection";
import ReviewsSection from "../components/trust/ReviewsSection";

export default function ProfilePage() {
  const { t, lang } = useLang();
  const params = new URLSearchParams(window.location.search);
  const profileEmail = params.get("email"); // if visiting someone else's profile

  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [favorites, setFavorites] = useState([]);

  const isOwnProfile = !profileEmail || profileEmail === currentUser?.email;

  useEffect(() => {
    load();
  }, [profileEmail]);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    setCurrentUser(me);

    const targetEmail = profileEmail || me?.email;
    if (!targetEmail) { setLoading(false); return; }

    // Load user profile info
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
      wilaya: userInfo?.wilaya || "",
      website: userInfo?.website || "",
      role: userInfo?.role || "user",
    });

    // Load their listings
    const data = await base44.entities.Listing.filter({ created_by: targetEmail, status: "active" }, "-created_date", 20);
    setListings(data);

    // Load my favorites for the card display
    if (me) {
      const favs = await base44.entities.Favorite.filter({ user_email: me.email }).catch(() => []);
      setFavorites(favs.map(f => f.listing_id));
    }

    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    await base44.auth.updateMe(form);
    setProfileUser(prev => ({ ...prev, ...form }));
    setEditing(false);
    setSaving(false);
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!profileUser) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      {lang === "ar" ? "المستخدم غير موجود" : lang === "fr" ? "Utilisateur introuvable" : "User not found"}
    </div>
  );

  const displayName = profileUser.agency_name || profileUser.full_name || profileUser.email;
  const isAgency = profileUser.role === "agency";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-emerald-800 h-40" />

      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 -mt-16 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-white shadow flex items-center justify-center flex-shrink-0 text-3xl font-bold text-emerald-700">
              {profileUser.avatar_url ? (
                <img src={profileUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                (displayName?.[0] || "?").toUpperCase()
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                    {profileUser.is_verified && (
                      <VerifiedBadge type={profileUser.verification_type || "individual"} size="sm" lang={lang} />
                    )}
                  </div>
                  {isAgency && (
                    <Badge className="bg-blue-100 text-blue-700 mt-1">
                      <Building2 className="w-3 h-3 mr-1" />
                      {lang === "ar" ? "وكالة عقارية" : lang === "fr" ? "Agence immobilière" : "Real Estate Agency"}
                    </Badge>
                  )}
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    {profileUser.wilaya && (
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profileUser.wilaya}</span>
                    )}
                    {profileUser.phone && (
                      <a href={`tel:${profileUser.phone}`} className="flex items-center gap-1 hover:text-emerald-700">
                        <Phone className="w-4 h-4" />{profileUser.phone}
                      </a>
                    )}
                    {profileUser.website && (
                      <a href={profileUser.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-700">
                        <Globe className="w-4 h-4" />{profileUser.website}
                      </a>
                    )}
                  </div>
                  {profileUser.bio && (
                    <p className="text-gray-600 text-sm mt-2 max-w-xl">{profileUser.bio}</p>
                  )}
                </div>

                {isOwnProfile && !editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
                    <Edit2 className="w-4 h-4" />
                    {lang === "ar" ? "تعديل الملف" : lang === "fr" ? "Modifier le profil" : "Edit Profile"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Verification section — own profile only */}
          {isOwnProfile && !editing && (
            <VerificationSection user={profileUser} lang={lang} />
          )}

          {/* Edit Form */}
          {editing && (
            <div className="mt-6 border-t pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {lang === "ar" ? "نوع الحساب" : lang === "fr" ? "Type de compte" : "Account Type"}
                  </label>
                  <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{lang === "ar" ? "فرد" : lang === "fr" ? "Particulier" : "Individual"}</SelectItem>
                      <SelectItem value="agency">{lang === "ar" ? "وكالة" : lang === "fr" ? "Agence" : "Agency"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.role === "agency" && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      {lang === "ar" ? "اسم الوكالة" : lang === "fr" ? "Nom de l'agence" : "Agency Name"}
                    </label>
                    <Input value={form.agency_name} onChange={e => setForm(p => ({ ...p, agency_name: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {lang === "ar" ? "رقم الهاتف" : lang === "fr" ? "Téléphone" : "Phone"}
                  </label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+213 ..." />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {lang === "ar" ? "الولاية" : lang === "fr" ? "Wilaya" : "Wilaya"}
                  </label>
                  <Select value={form.wilaya} onValueChange={v => setForm(p => ({ ...p, wilaya: v }))}>
                    <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                    <SelectContent>
                      {WILAYAS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {lang === "ar" ? "الموقع الإلكتروني" : lang === "fr" ? "Site web" : "Website"}
                  </label>
                  <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {lang === "ar" ? "نبذة عنك" : lang === "fr" ? "Présentation" : "Bio"}
                </label>
                <Textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder={lang === "ar" ? "اكتب نبذة عنك..." : lang === "fr" ? "Décrivez-vous..." : "Tell us about yourself..."} className="resize-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "..." : (lang === "ar" ? "حفظ" : lang === "fr" ? "Enregistrer" : "Save")}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} className="gap-2">
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
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-emerald-600" />
          {lang === "ar" ? "إعلانات المستخدم" : lang === "fr" ? "Annonces publiées" : "Published Listings"}
          <span className="text-sm font-normal text-gray-400">({listings.length})</span>
        </h2>

        {listings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 mb-10">
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