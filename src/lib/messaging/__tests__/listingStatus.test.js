import { describe, it, expect } from 'vitest';
import {
  UNAVAILABLE_STATUSES,
  CLOSED_STATUSES,
  isListingUnavailable,
  isListingClosed,
  getUnavailableNoticeText,
} from '../listingStatus';

describe('isListingUnavailable', () => {
  it('flags reserved/sold/rented/deleted as unavailable', () => {
    for (const s of UNAVAILABLE_STATUSES) expect(isListingUnavailable(s)).toBe(true);
  });

  it('treats active and pending as available', () => {
    expect(isListingUnavailable('active')).toBe(false);
    expect(isListingUnavailable('pending')).toBe(false);
    expect(isListingUnavailable(undefined)).toBe(false);
  });
});

describe('isListingClosed', () => {
  it('considers sold/rented/reserved as closed but not deleted', () => {
    for (const s of CLOSED_STATUSES) expect(isListingClosed(s)).toBe(true);
    expect(isListingClosed('deleted')).toBe(false);
    expect(isListingClosed('active')).toBe(false);
  });
});

describe('getUnavailableNoticeText', () => {
  it('returns a status-specific message for known statuses', () => {
    expect(getUnavailableNoticeText('reserved', 'en')).toMatch(/reserved/i);
    expect(getUnavailableNoticeText('sold', 'en')).toMatch(/sold/i);
    expect(getUnavailableNoticeText('rented', 'en')).toMatch(/rented/i);
  });

  it('falls back to a generic message for deleted / unknown', () => {
    expect(getUnavailableNoticeText('deleted', 'en')).toMatch(/no longer available/i);
    expect(getUnavailableNoticeText('weird', 'en')).toMatch(/no longer available/i);
  });

  it('localises into Arabic and French', () => {
    expect(getUnavailableNoticeText('sold', 'ar')).toContain('تم بيع');
    expect(getUnavailableNoticeText('sold', 'fr')).toContain('vendu');
  });
});