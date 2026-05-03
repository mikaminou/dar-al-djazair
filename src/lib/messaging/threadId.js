/**
 * Pure helpers for thread ID derivation.
 * No React, no SDK, no DOM — fully unit-testable.
 */

/**
 * Build a deterministic thread id for a (listing, two emails) tuple.
 * The two emails are sorted alphabetically so both directions of the
 * conversation produce the same id.
 */
export function getThreadId(listingId, emailA, emailB) {
  return [listingId, ...[emailA, emailB].sort()].join('__');
}

/**
 * Pull the thread id off a message, falling back to deriving it from
 * (listing_id, sender_email, recipient_email) if the column is empty.
 * This mirrors the legacy fallback used throughout the Messages page.
 */
export function threadIdOf(msg) {
  return msg.thread_id || getThreadId(msg.listing_id, msg.sender_email, msg.recipient_email);
}