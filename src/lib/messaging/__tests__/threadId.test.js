import { describe, it, expect } from 'vitest';
import { getThreadId, threadIdOf } from '../threadId';

describe('getThreadId', () => {
  it('produces the same id regardless of email order', () => {
    const a = getThreadId('listing-1', 'alice@x.com', 'bob@x.com');
    const b = getThreadId('listing-1', 'bob@x.com', 'alice@x.com');
    expect(a).toBe(b);
  });

  it('includes the listing id as the first segment', () => {
    expect(getThreadId('L42', 'a@x', 'b@x')).toBe('L42__a@x__b@x');
  });

  it('produces different ids for different listings', () => {
    expect(getThreadId('L1', 'a@x', 'b@x'))
      .not.toBe(getThreadId('L2', 'a@x', 'b@x'));
  });
});

describe('threadIdOf', () => {
  it('uses the message thread_id column when present', () => {
    expect(threadIdOf({ thread_id: 'preset', listing_id: 'L', sender_email: 'a', recipient_email: 'b' }))
      .toBe('preset');
  });

  it('falls back to deriving from (listing, sender, recipient)', () => {
    const msg = { thread_id: null, listing_id: 'L', sender_email: 'b@x', recipient_email: 'a@x' };
    expect(threadIdOf(msg)).toBe('L__a@x__b@x');
  });
});