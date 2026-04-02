import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Clock, MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLang } from "../components/LanguageContext";

export default function MyWaitlists() {
  const { lang } = useLang();
  const [entries, setEntries] = useState([]);
  const [listingMap, setListingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }
    setUser(me);
    const data = await base44.entities.Waitlist.filter({ user_email: me.email }, "-joined_at", 200).catch(() => []);
    setEntries(data);
    // Fetch listing statuses
    const ids = [...new Set(data.map(e => e.listing_id))];
    const map = {};
    await Promise.all(ids.map(async id => {
      const ls = await base44.entities.Listing.filter({ id }, null, 1).catch(() => []);
      if (ls[0]) map[id] = ls[0];
    }));
    setListingMap(map);
    setLoading(false);
  }

  async function withdraw(entry) {
    await base44.entities.Waitlist.update(entry.id, { status: "withdrawn" });
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: "withdrawn" } : e));
  }

  const statusBadge = {
    waiting:   { en: "Waiting",   fr: "En attente", ar: "ينتظر",   cls: "bg-amber-100 text-amber-700" },
    contacted: { en: "Contacted", fr: "Contacté",   ar: "تم التواصل", cls: "bg-blue-100 text-blue-700" },
    withdrawn: { en: "Withdrawn", fr: "Retiré",     ar: "انسحبت",  cls: "bg-gray-100 text-gray-500" },
  };

  const listingStatusLabel = {
    reserved: { en: "Still reserved", fr: "Toujours réservé", ar: "لا يزال محجوزاً" },
    active:   { en: "Available again!", fr: "Disponible à nouveau !", ar: "متاح مجدداً!" },
    sold:     { en: "Sold", fr: "Vendu", ar: "مُباع" },
    rented:   { en: "Rented", fr: "Loué", ar: "مُؤجَّر" },
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      {lang === "ar" ? "يرجى تسجيل الدخول" : lang === "fr" ? "Veuillez vous connecter" : "Please sign in"}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-amber-700 to-amber-600 text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            {lang === "ar" ? "قوائم انتظاري" : lang === "fr" ? "Mes listes d'attente" : "My Waitlists"}
          </h1>
          <p className="text-amber-200 text-sm mt-1">
            {entries.length} {lang === "ar" ? "قائمة انتظار" : lang === "fr" ? "liste(s)" : "waitlist entry / entries"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{lang === "ar" ? "لم تنضم لأي قائمة انتظار بعد." : lang === "fr" ? "Vous n'avez pas encore rejoint de liste d'attente." : "You haven't joined any waitlists yet."}</p>
          </div>
        ) : entries.map(entry => {
          const lst = listingMap[entry.listing_id];
          const lstStatus = lst?.status || "unknown";
          return (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
              {lst?.images?.[0] && (
                <img src={lst.images[0]} alt="" className="w-16 h-14 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <Link
                      to={createPageUrl(`ListingDetail?id=${entry.listing_id}`)}
                      className="font-semibold text-sm text-gray-900 hover:text-emerald-700"
                    >
                      {entry.listing_title || lst?.title || entry.listing_id}
                    </Link>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {entry.listing_wilaya || lst?.wilaya || "—"}
                    </p>
                  </div>
                  <Badge className={statusBadge[entry.status]?.cls}>
                    {statusBadge[entry.status]?.[lang] || entry.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-500">
                  <span>
                    {lang === "ar" ? `الترتيب: #${entry.position}` : lang === "fr" ? `Position : #${entry.position}` : `Position: #${entry.position}`}
                  </span>
                  <span>
                    {new Date(entry.joined_at).toLocaleDateString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  {lstStatus !== "unknown" && listingStatusLabel[lstStatus] && (
                    <span className={`px-2 py-0.5 rounded-full font-medium ${lstStatus === "active" ? "bg-emerald-50 text-emerald-700" : lstStatus === "reserved" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                      {listingStatusLabel[lstStatus][lang] || listingStatusLabel[lstStatus].en}
                    </span>
                  )}
                </div>
              </div>
              {entry.status === "waiting" && (
                <button
                  onClick={() => withdraw(entry)}
                  className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {lang === "ar" ? "انسحاب" : lang === "fr" ? "Se retirer" : "Withdraw"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}