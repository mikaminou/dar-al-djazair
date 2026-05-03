/**
 * Pure presence helpers: classify a UserPresence record into a status,
 * and format its "last seen" label.
 *
 * Status windows:
 *   • online  : active in the last 2 minutes
 *   • away    : active in the last 10 minutes
 *   • offline : older than that, or no presence record at all
 *
 * `now` is injected for testability — defaults to Date.now().
 */

const TWO_MIN  = 2 * 60 * 1000;
const TEN_MIN  = 10 * 60 * 1000;

export function getPresenceStatus(presence, now = Date.now()) {
  if (!presence?.last_seen) return 'offline';
  const diff = now - new Date(presence.last_seen).getTime();
  if (diff < TWO_MIN) return 'online';
  if (diff < TEN_MIN) return 'away';
  return 'offline';
}

/**
 * Returns a localised "last seen" label, or null when the user is currently
 * online (label is unnecessary in that case) or has no presence record.
 */
export function getLastSeenLabel(presence, lang, now = Date.now()) {
  if (!presence?.last_seen) return null;
  const diff = now - new Date(presence.last_seen).getTime();
  if (diff < TWO_MIN) return null;

  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (lang === 'ar') {
    if (mins < 60) return `آخر ظهور منذ ${mins} دقيقة`;
    if (hrs  < 24) return `آخر ظهور منذ ${hrs} ساعة`;
    return `آخر ظهور منذ ${days} يوم`;
  }
  if (lang === 'fr') {
    if (mins < 60) return `Vu il y a ${mins} min`;
    if (hrs  < 24) return `Vu il y a ${hrs}h`;
    return `Vu il y a ${days}j`;
  }
  if (mins < 60) return `Last seen ${mins}m ago`;
  if (hrs  < 24) return `Last seen ${hrs}h ago`;
  return `Last seen ${days}d ago`;
}