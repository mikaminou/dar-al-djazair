import { describe, it, expect } from 'vitest';
import { groupConversations, countUnread } from '../conversations';

const me = 'me@x.com';

function msg(overrides) {
  return {
    id: Math.random().toString(36).slice(2),
    listing_id: 'L1',
    sender_email: 'other@x.com',
    recipient_email: me,
    is_read: false,
    thread_id: null,
    content: 'hi',
    created_date: '2025-01-01T10:00:00Z',
    ...overrides,
  };
}

describe('groupConversations', () => {
  it('returns an empty array for no messages', () => {
    expect(groupConversations([], me)).toEqual([]);
  });

  it('groups messages by thread_id', () => {
    const m1 = msg({ thread_id: 'T1', created_date: '2025-01-01T10:00:00Z' });
    const m2 = msg({ thread_id: 'T1', created_date: '2025-01-01T11:00:00Z' });
    const m3 = msg({ thread_id: 'T2', created_date: '2025-01-01T09:00:00Z' });

    const out = groupConversations([m1, m2, m3], me);
    expect(out).toHaveLength(2);

    const t1 = out.find(c => c.thread_id === 'T1');
    expect(t1.messages).toHaveLength(2);
  });

  it('sorts messages within a thread oldest → newest', () => {
    const newer = msg({ thread_id: 'T', id: 'newer', created_date: '2025-01-02T10:00:00Z' });
    const older = msg({ thread_id: 'T', id: 'older', created_date: '2025-01-01T10:00:00Z' });

    const [conv] = groupConversations([newer, older], me);
    expect(conv.messages.map(m => m.id)).toEqual(['older', 'newer']);
  });

  it('sorts conversations by their latest message, newest first', () => {
    const olderThread = msg({ thread_id: 'T_OLD', created_date: '2025-01-01T10:00:00Z' });
    const newerThread = msg({ thread_id: 'T_NEW', created_date: '2025-01-05T10:00:00Z' });

    const out = groupConversations([olderThread, newerThread], me);
    expect(out.map(c => c.thread_id)).toEqual(['T_NEW', 'T_OLD']);
  });

  it("identifies the 'other' participant relative to userEmail", () => {
    const sentByMe = msg({ thread_id: 'T1', sender_email: me, recipient_email: 'them@x.com' });
    const sentToMe = msg({ thread_id: 'T2', sender_email: 'them@x.com', recipient_email: me });

    const out = groupConversations([sentByMe, sentToMe], me);
    expect(out.find(c => c.thread_id === 'T1').other).toBe('them@x.com');
    expect(out.find(c => c.thread_id === 'T2').other).toBe('them@x.com');
  });

  it('derives thread id when the column is missing', () => {
    const m = msg({ thread_id: null, listing_id: 'L9', sender_email: 'b@x', recipient_email: 'a@x' });
    const [conv] = groupConversations([m], 'a@x');
    expect(conv.thread_id).toBe('L9__a@x__b@x');
  });
});

describe('countUnread', () => {
  it('counts only unread messages addressed to me', () => {
    const conv = {
      messages: [
        msg({ is_read: false, recipient_email: me }),
        msg({ is_read: false, recipient_email: me }),
        msg({ is_read: true,  recipient_email: me }),
        msg({ is_read: false, recipient_email: 'other@x', sender_email: me }),
      ],
    };
    expect(countUnread(conv, me)).toBe(2);
  });

  it('returns 0 when no messages match', () => {
    expect(countUnread({ messages: [] }, me)).toBe(0);
  });
});