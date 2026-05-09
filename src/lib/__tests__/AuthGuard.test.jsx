// @vitest-environment jsdom
/**
 * Tests for src/components/AuthGuard.jsx
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import AuthGuard from '../../components/AuthGuard';

// ─── Mock AuthContext ─────────────────────────────────────────────────────────

const mockNavigateToLogin = vi.fn();
let mockAuthState = {
  isAuthenticated: false,
  isLoadingAuth: true,
  navigateToLogin: mockNavigateToLogin,
};

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthState = {
    isAuthenticated: false,
    isLoadingAuth: true,
    navigateToLogin: mockNavigateToLogin,
  };
});

afterEach(() => {
  cleanup();
});

describe('AuthGuard', () => {
  it('shows a loading spinner while auth is being determined', () => {
    mockAuthState.isLoadingAuth = true;
    const { container } = render(
      React.createElement(AuthGuard, null, React.createElement('div', null, 'Protected Content'))
    );
    // The spinner is the border-t-emerald-600 animated div
    expect(container.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('calls navigateToLogin when not authenticated', () => {
    mockAuthState.isLoadingAuth = false;
    mockAuthState.isAuthenticated = false;
    render(
      React.createElement(AuthGuard, null, React.createElement('div', null, 'Protected Content'))
    );
    expect(mockNavigateToLogin).toHaveBeenCalledOnce();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders children when authenticated', () => {
    mockAuthState.isLoadingAuth = false;
    mockAuthState.isAuthenticated = true;
    render(
      React.createElement(AuthGuard, null, React.createElement('div', null, 'Protected Content'))
    );
    expect(screen.getByText('Protected Content')).toBeTruthy();
    expect(mockNavigateToLogin).not.toHaveBeenCalled();
  });

  it('shows a spinner (not children) when loading even if isAuthenticated is true', () => {
    mockAuthState.isLoadingAuth = true;
    mockAuthState.isAuthenticated = true;
    const { container } = render(
      React.createElement(AuthGuard, null, React.createElement('div', null, 'Protected Content'))
    );
    // Loading spinner must be present
    expect(container.querySelector('.animate-spin')).not.toBeNull();
    // Children must NOT be rendered
    expect(screen.queryByText('Protected Content')).toBeNull();
    expect(mockNavigateToLogin).not.toHaveBeenCalled();
  });
});
