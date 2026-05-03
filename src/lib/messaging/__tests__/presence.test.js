import { describe, it, expect } from 'vitest';
import { getPresenceStatus, getLastSeenLabel } from '../presence';

const NOW = new Date('2025-06-01T12:00:00Z').getTime();
const ago = (ms) => new Date(NOW - ms).toISOString();

describe('getPresenceStatus', () => {
  it("returns 'offline' for a missing record", () => {
    expect(getPresenceStatus(null, NOW)).toBe('offline');
    expect(getPresenceStatus({}, NOW)).toBe('offline');
  });

  it("returns 'online' if seen in the last 2 minutes", () => {
    expect(getPresenceStatus({ last_seen: ago(60_000) }, NOW)).toBe('online');
    expect(getPresenceStatus({ last_seen: ago(119_000) }, NOW)).toBe('online');
  });

  it("returns 'away' between 2 and 10 minutes", () => {
    expect(getPresenceStatus({ last_seen: ago(3 * 60_000) }, NOW)).toBe('away');
    expect(getPresenceStatus({ last_seen: ago(9 * 60_000) }, NOW)).toBe('away');
  });

  it("returns 'offline' beyond 10 minutes", () => {
    expect(getPresenceStatus({ last_seen: ago(11 * 60_000) }, NOW)).toBe('offline');
    expect(getPresenceStatus({ last_seen: ago(24 * 3600_000) }, NOW)).toBe('offline');
  });
});

describe('getLastSeenLabel', () => {
  it('returns null for missing presence', () => {
    expect(getLastSeenLabel(null, 'en', NOW)).toBeNull();
  });

  it('returns null for online users (< 2 min)', () => {
    expect(getLastSeenLabel({ last_seen: ago(30_000) }, 'en', NOW)).toBeNull();
  });

  it('formats minutes in English', () => {
    expect(getLastSeenLabel({ last_seen: ago(5 * 60_000) }, 'en', NOW))
      .toBe('Last seen 5m ago');
  });

  it('formats hours in French', () => {
    expect(getLastSeenLabel({ last_seen: ago(3 * 3600_000) }, 'fr', NOW))
      .toBe('Vu il y a 3h');
  });

  it('formats days in Arabic', () => {
    expect(getLastSeenLabel({ last_seen: ago(2 * 24 * 3600_000) }, 'ar', NOW))
      .toBe('آخر ظهور منذ 2 يوم');
  });
});