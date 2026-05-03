/**
 * Pure conversation grouping + unread counting.
 * Operates on plain message objects; no side effects.
 */

import { threadIdOf } from './threadId';

/**
 * Group a flat list of messages into conversations keyed by thread id.
 *
 * Each returned conversation has:
 *   - thread_id
 *   - listing_id
 *   - other         : the email of the other participant (relative to userEmail)
 *   - messages      : sorted oldest → newest
 *
 * The conversations array itself is sorted by latest message, newest first.
 */
export function groupConversations(messages, userEmail) {
  const threads = {};
  for (const msg of messages) {
    const tid = threadIdOf(msg);
    if (!threads[tid]) {
      threads[tid] = {
        thread_id: tid,
        messages: [],
        listing_id: msg.listing_id,
        other: msg.sender_email === userEmail ? msg.recipient_email : msg.sender_email,
      };
    }
    threads[tid].messages.push(msg);
  }

  return Object.values(threads)
    .map(t => ({
      ...t,
      messages: t.messages.slice().sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      ),
    }))
    .sort((a, b) => {
      const la = a.messages[a.messages.length - 1];
      const lb = b.messages[b.messages.length - 1];
      return new Date(lb.created_date) - new Date(la.created_date);
    });
}

/**
 * Count messages in a conversation that are unread AND addressed to userEmail.
 * Messages I sent never count, even if they're not "read" yet from my side.
 */
export function countUnread(conv, userEmail) {
  return conv.messages.filter(
    m => !m.is_read && m.recipient_email === userEmail
  ).length;
}