/**
 * Tests for the pure utility functions in apiClient.js.
 *
 * All Supabase I/O is mocked via vi.mock so no real network call is made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock supabaseClient BEFORE importing apiClient ───────────────────────────

// We build a minimal mock that lets us override behaviour per-test.
const mockGetUser = vi.fn();
const mockSignOut = vi.fn();
const mockFrom = vi.fn();
const mockFunctionsInvoke = vi.fn();
const mockStorageFrom = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockUpload = vi.fn();

// Every call to supabase.from('table') returns a chainable builder
function buildQuery(overrides = {}) {
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    ilike: vi.fn(() => q),
    order: vi.fn(() => q),
    limit: vi.fn(() => q),
    update: vi.fn(() => q),
    insert: vi.fn(() => q),
    delete: vi.fn(() => q),
    maybeSingle: vi.fn(),
    single: vi.fn(),
    ...overrides,
  };
  return q;
}

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
    from: mockFrom,
    functions: { invoke: mockFunctionsInvoke },
    storage: { from: mockStorageFrom },
  },
}));

// Also mock uploadToSupabase so integrations.Core.UploadFile doesn't error out
vi.mock('@/lib/uploadToSupabase', () => ({
  uploadToSupabase: vi.fn().mockResolvedValue({ url: 'https://mock-url/file.jpg' }),
}));

// Now import the module under test
const { api } = await import('@/api/apiClient.js');

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── normalizeProfile (tested via auth.me) ────────────────────────────────────

describe('normalizeProfile via auth.me', () => {
  it('returns null when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await api.auth.me();
    expect(result).toBeNull();
  });

  it('returns fallback user when profile row does not exist', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'uid-1', email: 'a@b.com' } },
      error: null,
    });
    const q = buildQuery({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    mockFrom.mockReturnValue(q);

    const result = await api.auth.me();
    expect(result).toMatchObject({
      id: 'uid-1',
      email: 'a@b.com',
      role: 'individual',
      lang: 'fr',
      is_verified: false,
      account_type: 'individual',
    });
  });

  it('merges auth user id into profile', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-uid', email: 'me@test.com' } },
      error: null,
    });
    const q = buildQuery({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'profile-id', email: 'me@test.com', first_name: 'Alice', last_name: 'Bob', account_type: 'agent', language_preference: 'fr', verification_status: 'verified' },
        error: null,
      }),
    });
    mockFrom.mockReturnValue(q);

    const result = await api.auth.me();
    expect(result.id).toBe('auth-uid');         // auth uid wins
    expect(result.email).toBe('me@test.com');
    expect(result.full_name).toBe('Alice Bob');
    expect(result.role).toBe('agent');           // account_type alias
    expect(result.lang).toBe('fr');              // language_preference alias
    expect(result.is_verified).toBe(true);
  });

  it('builds full_name from agency_name when names are empty', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'agency@co.dz' } },
      error: null,
    });
    const q = buildQuery({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'p1', email: 'agency@co.dz', first_name: '', last_name: '', agency_name: 'Immo DZ', account_type: 'agent', language_preference: 'ar', verification_status: 'pending' },
        error: null,
      }),
    });
    mockFrom.mockReturnValue(q);

    const result = await api.auth.me();
    expect(result.full_name).toBe('Immo DZ');
    expect(result.is_verified).toBe(false);
  });
});

// ─── denormalizeProfile (tested via auth.updateMe) ───────────────────────────

describe('denormalizeProfile via auth.updateMe', () => {
  it('maps role → account_type and lang → language_preference', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'me@x.com' } },
      error: null,
    });
    const q = buildQuery({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'p1', email: 'me@x.com', account_type: 'admin', language_preference: 'en', verification_status: 'verified', first_name: 'X', last_name: '', agency_name: '' },
        error: null,
      }),
    });
    mockFrom.mockReturnValue(q);

    await api.auth.updateMe({ role: 'admin', lang: 'en', full_name: 'ignored', is_verified: true });

    // updateMe calls supabase.from('profiles').update(mapped).eq(...)
    expect(q.update).toHaveBeenCalled();
    const [payload] = q.update.mock.calls[0];
    expect(payload.account_type).toBe('admin');
    expect(payload.language_preference).toBe('en');
    // full_name and is_verified are stripped (computed fields)
    expect(payload.full_name).toBeUndefined();
    expect(payload.is_verified).toBeUndefined();
    expect(payload.role).toBeUndefined();
    expect(payload.lang).toBeUndefined();
  });

  it('throws when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(api.auth.updateMe({ first_name: 'X' })).rejects.toThrow('Not authenticated');
  });
});

// ─── mapSort / mapQuery (tested through listingProxy) ────────────────────────

describe('field mapping for sort and query', () => {
  it('maps created_date → created_at in sort', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: [], error: null });
    await api.entities.Listing.list('-created_date', 10);
    const [, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(body.sort).toBe('-created_at');
  });

  it('maps updated_date → updated_at in query', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: [], error: null });
    await api.entities.Listing.filter({ updated_date: '2025-01-01' }, null, 5);
    const [, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(body.query.updated_at).toBe('2025-01-01');
    expect(body.query.updated_date).toBeUndefined();
  });
});

// ─── userProxy ────────────────────────────────────────────────────────────────

describe('userProxy.filter', () => {
  it('maps role query field → account_type column', async () => {
    const q = buildQuery({ maybeSingle: vi.fn() });
    q.eq.mockReturnValue(q);
    // .select('*') at the top returns q, then subsequent chaining also returns q
    // we need the final await to resolve
    const finalQ = { ...q, then: (res) => res({ data: [], error: null }) };
    // Actually, the query chain doesn't call .then directly; it awaits the object.
    // Override to simulate: when the query object is awaited, resolve with data.
    Object.defineProperty(q, Symbol.asyncIterator, { value: undefined });
    // Simpler: spy on from to return a query that resolves when awaited
    const resolveQ = Object.assign(q, {
      // Vitest can await the object if it has a .then method
      then(res, rej) { return Promise.resolve({ data: [{ id: 'p1', email: 'ag@x.com', account_type: 'agent', language_preference: 'fr', first_name: 'A', last_name: 'B', verification_status: 'verified' }], error: null }).then(res, rej); },
    });
    mockFrom.mockReturnValue(resolveQ);

    const results = await api.entities.User.filter({ role: 'agent' });
    // The eq() should have been called with 'account_type' (not 'role')
    expect(resolveQ.eq).toHaveBeenCalledWith('account_type', 'agent');
    expect(results[0].role).toBe('agent');
  });

  it('returns empty array on null query', async () => {
    const resolveQ = buildQuery();
    Object.assign(resolveQ, {
      then(res, rej) { return Promise.resolve({ data: [], error: null }).then(res, rej); },
    });
    mockFrom.mockReturnValue(resolveQ);
    const results = await api.entities.User.filter(null);
    expect(results).toEqual([]);
  });
});

describe('userProxy.update', () => {
  it('uses email column when given an email', async () => {
    const q = buildQuery({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'p1', email: 'user@x.com', first_name: 'Z', last_name: '', agency_name: '', account_type: 'user', language_preference: 'fr', verification_status: 'pending' },
        error: null,
      }),
    });
    mockFrom.mockReturnValue(q);

    await api.entities.User.update('user@x.com', { first_name: 'Z' });
    // Chain is: .from().update().eq().select().maybeSingle()
    // After the fix, eq is called before select/maybeSingle
    expect(q.update).toHaveBeenCalled();
    // The eq method is called with 'email' because idOrEmail contains '@'
    expect(q.eq).toHaveBeenCalledWith('email', 'user@x.com');
  });

  it('uses id column when given a UUID', async () => {
    const q = buildQuery({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'uuid-123', email: 'user@x.com', first_name: 'Z', last_name: '', agency_name: '', account_type: 'user', language_preference: 'fr', verification_status: 'pending' },
        error: null,
      }),
    });
    mockFrom.mockReturnValue(q);

    await api.entities.User.update('uuid-123', { first_name: 'Z' });
    expect(q.eq).toHaveBeenCalledWith('id', 'uuid-123');
  });
});

// ─── Generic entity proxy via entityCrud ─────────────────────────────────────

describe('makeEntityProxy (entityCrud)', () => {
  it('calls entityCrud with entity name and operation', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: [{ id: 'f1' }], error: null });
    const result = await api.entities.Favorite.list(null, 10);
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('entityCrud', {
      body: { entity: 'Favorite', operation: 'list', sort: null, limit: 10 },
    });
    expect(result).toEqual([{ id: 'f1' }]);
  });

  it('passes query and sort to filter', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: [], error: null });
    await api.entities.Notification.filter({ user_email: 'a@b.com' }, '-created_at', 5);
    const [fnName, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(fnName).toBe('entityCrud');
    expect(body.operation).toBe('list');
    expect(body.query).toEqual({ user_email: 'a@b.com' });
    expect(body.sort).toBe('-created_at');
    expect(body.limit).toBe(5);
  });

  it('creates an entity', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { id: 'new-1' }, error: null });
    const result = await api.entities.Review.create({ rating: 5 });
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('entityCrud', {
      body: { entity: 'Review', operation: 'create', data: { rating: 5 } },
    });
    expect(result).toEqual({ id: 'new-1' });
  });

  it('updates an entity', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { id: 'e1', is_read: true }, error: null });
    await api.entities.Notification.update('e1', { is_read: true });
    const [, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(body.operation).toBe('update');
    expect(body.id).toBe('e1');
    expect(body.data.is_read).toBe(true);
  });

  it('deletes an entity', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });
    await api.entities.Favorite.delete('f-99');
    const [, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(body.operation).toBe('delete');
    expect(body.id).toBe('f-99');
  });

  it('throws when the function returns an error', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: new Error('DB error') });
    await expect(api.entities.Message.create({ content: 'hi' })).rejects.toThrow('DB error');
  });
});

// ─── listingProxy ─────────────────────────────────────────────────────────────

describe('listingProxy', () => {
  it('calls listingList with mapped sort and query', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: [{ id: 'L1' }], error: null });
    const result = await api.entities.Listing.filter({ status: 'active' }, '-updated_date', 20);
    const [name, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(name).toBe('listingList');
    expect(body.sort).toBe('-updated_at');
    expect(body.query).toEqual({ status: 'active' });
    expect(result).toEqual([{ id: 'L1' }]);
  });

  it('calls listingGet with id', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { id: 'L2' }, error: null });
    const result = await api.entities.Listing.get('L2');
    const [name, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(name).toBe('listingGet');
    expect(body.id).toBe('L2');
    expect(result).toEqual({ id: 'L2' });
  });

  it('calls listingCreate with data payload', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { id: 'L3', title: 'New' }, error: null });
    await api.entities.Listing.create({ title: 'New' });
    const [name, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(name).toBe('listingCreate');
    expect(body.data.title).toBe('New');
  });

  it('calls listingUpdate with id and data', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { id: 'L4', price: 5000 }, error: null });
    await api.entities.Listing.update('L4', { price: 5000 });
    const [name, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(name).toBe('listingUpdate');
    expect(body.id).toBe('L4');
    expect(body.data.price).toBe(5000);
  });

  it('calls listingDelete with id', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { success: true }, error: null });
    await api.entities.Listing.delete('L5');
    const [name, { body }] = mockFunctionsInvoke.mock.calls[0];
    expect(name).toBe('listingDelete');
    expect(body.id).toBe('L5');
  });

  it('bulkCreate invokes listingCreate for each item', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { id: 'x' }, error: null });
    await api.entities.Listing.bulkCreate([{ title: 'A' }, { title: 'B' }]);
    expect(mockFunctionsInvoke).toHaveBeenCalledTimes(2);
  });
});

// ─── functions.invoke ─────────────────────────────────────────────────────────

describe('functions.invoke', () => {
  it('passes name and body to supabase.functions.invoke', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    const result = await api.functions.invoke('myFunction', { foo: 'bar' });
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('myFunction', { body: { foo: 'bar' } });
    expect(result).toEqual({ data: { ok: true } });
  });

  it('throws on error', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: new Error('edge fn error') });
    await expect(api.functions.invoke('boom')).rejects.toThrow('edge fn error');
  });
});

// ─── integrations.Core.SendEmail ──────────────────────────────────────────────

describe('integrations.Core.SendEmail', () => {
  it('calls the sendEmail edge function', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: { sent: true }, error: null });
    const result = await api.integrations.Core.SendEmail({ to: 'x@y.com', subject: 'Hi', body: '<p>Hello</p>' });
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('sendEmail', { body: { to: 'x@y.com', subject: 'Hi', body: '<p>Hello</p>' } });
    expect(result).toEqual({ sent: true });
  });

  it('returns null (does not throw) when sendEmail function errors', async () => {
    mockFunctionsInvoke.mockResolvedValue({ data: null, error: new Error('no function') });
    const result = await api.integrations.Core.SendEmail({ to: 'x@y.com', subject: 'Hi' });
    expect(result).toBeNull();
  });
});

// ─── auth.logout ──────────────────────────────────────────────────────────────

describe('auth.logout', () => {
  it('calls supabase.auth.signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null });
    // auth.logout calls signOut then sets window.location.href.
    // We only verify signOut is called; the navigation side-effect is not
    // testable in node environment (no window).
    // Catch any ReferenceError from window access gracefully.
    try {
      await api.auth.logout('/Login');
    } catch {
      // window.location assignment may throw in node env — that's OK
    }
    expect(mockSignOut).toHaveBeenCalled();
  });
});
