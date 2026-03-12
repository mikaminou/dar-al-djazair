/**
 * Invisible background component mounted in Layout.
 * Every 5 minutes it checks if new listings match any alert-enabled saved search,
 * then fires a browser notification for each new match since last check.
 */
import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

function matchesFilters(listing, filters) {
  if (!filters) return false;
  if (filters.listing_type  && listing.listing_type  !== filters.listing_type)  return false;
  if (filters.property_type && listing.property_type !== filters.property_type) return false;
  if (filters.wilaya        && listing.wilaya        !== filters.wilaya)        return false;
  if (filters.min_price     && listing.price < Number(filters.min_price))       return false;
  if (filters.max_price     && listing.price > Number(filters.max_price))       return false;
  if (filters.min_area      && listing.area < Number(filters.min_area))         return false;
  if (filters.furnished     && listing.furnished !== filters.furnished)          return false;
  if (filters.min_bedrooms) {
    const min = filters.min_bedrooms === "5+" ? 5 : Number(filters.min_bedrooms);
    if ((listing.bedrooms || 0) < min) return false;
  }
  if (filters.min_bathrooms) {
    const min = filters.min_bathrooms === "4+" ? 4 : Number(filters.min_bathrooms);
    if ((listing.bathrooms || 0) < min) return false;
  }
  if (filters.features?.length) {
    if (!filters.features.every(f => (listing.features || []).includes(f))) return false;
  }
  return true;
}

function notify(searchName, listing) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(`🏠 ${searchName}`, {
    body: `${listing.title} — ${listing.wilaya}${listing.price ? ` · ${Number(listing.price).toLocaleString()} DA` : ""}`,
    icon: "/favicon.ico",
    tag: `search-alert-${listing.id}`,
  });
}

async function requestPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission().catch(() => {});
  }
}

export default function SavedSearchAlerts() {
  useEffect(() => {
    let cancelled = false;

    // Request notification permission on mount
    requestPermission();

    async function check() {
      if (cancelled) return;
      const me = await base44.auth.me().catch(() => null);
      if (!me) return;

      const alertSearches = await base44.entities.SavedSearch.filter(
        { created_by: me.email, alert_enabled: true }, "-created_date", 50
      ).catch(() => []);

      for (const search of alertSearches) {
        const since = search.last_checked ? new Date(search.last_checked) : new Date(search.created_date);
        // fetch recent active listings (increased limit for better coverage)
        const allListings = await base44.entities.Listing.filter(
          { status: "active" }, "-created_date", 100
        ).catch(() => []);

        const newMatches = allListings.filter(l =>
          new Date(l.created_date) > since && matchesFilters(l, search.filters)
        );

        if (newMatches.length > 0) {
          newMatches.forEach(l => notify(search.name || "Search Alert", l));
        }

        // Always update last_checked so we don't re-check old listings next time
        await base44.entities.SavedSearch.update(search.id, {
          last_checked: new Date().toISOString()
        }).catch(() => {});
      }
    }

    // run once shortly after mount, then every 5 min
    const t0 = setTimeout(check, 10_000);
    const interval = setInterval(check, 5 * 60 * 1000);

    return () => { cancelled = true; clearTimeout(t0); clearInterval(interval); };
  }, []);

  return null;
}