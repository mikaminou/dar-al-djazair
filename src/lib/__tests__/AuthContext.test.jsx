// @vitest-environment jsdom
/**
 * Tests for src/lib/AuthContext.jsx
 *
 * Uses jsdom environment so React hooks can run.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// vi.mock factories are hoisted above imports, so we must use vi.hoisted()
// for any variables that the factory closure needs.

const { mockGetSession, mockSignOut, mockOnAuthStateChange, mockMaybySingle } = vi.hoisted(() => {
  let authStateCallback = null;
  const mockGetSession = vi.fn();
  const mockSignOut = vi.fn();
  const mockMaybySingle = vi.fn();
  const mockOnAuthStateChange = vi.fn((cb) => {
    authStateCallback = cb;
    // Expose callback so tests can trigger auth state changes
    mockOnAuthStateChange._cb = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  return { mockGetSession, mockSignOut, mockOnAuthStateChange, mockMaybySingle };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybySingle,
    })),
  },
}));

// Import AFTER mocks are set up
const { AuthProvider, useAuth } = await import('../AuthContext');

// ─────────────────────────────────────────────────────────────────────────────

const profileRow = {
  id: 'profile-id',
  email: 'alice@test.com',
  first_name: 'Alice',
  last_name: 'Smith',
  agency_name: '',
  account_type: 'agent',
  language_preference: 'fr',
  verification_status: 'verified',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSignOut.mockResolvedValue({ error: null });
  // Reset the callback reference
  mockOnAuthStateChange._cb = null;
  mockOnAuthStateChange.mockImplementation((cb) => {
    mockOnAuthStateChange._cb = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
});

function wrapper({ children }) {
  return React.createElement(AuthProvider, null, children);
}

describe('useAuth outside AuthProvider', () => {
  it('throws an error', () => {
    expect(() => {
      const { result } = renderHook(() => useAuth());
      void result.current.user;
    }).toThrow();
  });
});

describe('AuthProvider initial loading', () => {
  it('starts with isLoadingAuth = true, then resolves false on no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockMaybySingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.isLoadingAuth).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    // Wait for the async getSession to complete
    await act(async () => {});

    expect(result.current.isLoadingAuth).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('loads the user profile when a session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'uid-1', email: 'alice@test.com' } } },
    });
    mockMaybySingle.mockResolvedValue({ data: profileRow, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.email).toBe('alice@test.com');
    expect(result.current.user.full_name).toBe('Alice Smith');
    expect(result.current.user.role).toBe('agent');
    expect(result.current.user.lang).toBe('fr');
    expect(result.current.user.is_verified).toBe(true);
  });

  it('uses auth user fallback when profile row is not found', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'uid-norow', email: 'ghost@test.com' } } },
    });
    mockMaybySingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).not.toBeNull();
    expect(result.current.user.email).toBe('ghost@test.com');
    expect(result.current.user.role).toBe('individual');
    expect(result.current.isLoadingAuth).toBe(false);
  });
});

describe('AuthProvider onAuthStateChange', () => {
  it('updates user when a SIGNED_IN event fires', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockMaybySingle.mockResolvedValue({ data: profileRow, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    // Simulate sign-in event from Supabase via the captured callback
    const cb = mockOnAuthStateChange._cb;
    expect(cb).not.toBeNull();
    await act(async () => {
      cb('SIGNED_IN', { user: { id: 'uid-1', email: 'alice@test.com' } });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user.email).toBe('alice@test.com');
  });

  it('clears user when a SIGNED_OUT event fires', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'uid-1', email: 'alice@test.com' } } },
    });
    mockMaybySingle.mockResolvedValue({ data: profileRow, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    const cb = mockOnAuthStateChange._cb;
    await act(async () => {
      cb('SIGNED_OUT', null);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe('logout', () => {
  it('calls supabase.auth.signOut and clears the user', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'uid-1', email: 'alice@test.com' } } },
    });
    mockMaybySingle.mockResolvedValue({ data: profileRow, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    // Override window.location so redirect doesn't error in jsdom
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });

    await act(async () => {
      await result.current.logout(false); // false = skip redirect
    });

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});

describe('legacy context properties', () => {
  it('exposes isLoadingPublicSettings = false and authError = null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    expect(result.current.isLoadingPublicSettings).toBe(false);
    expect(result.current.authError).toBeNull();
    expect(result.current.appPublicSettings).toBeNull();
    expect(typeof result.current.checkAppState).toBe('function');
  });
});
