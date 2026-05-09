/**
 * Tests for the returnUrl validation logic used in Login.jsx.
 *
 * The logic is:
 *   const rawReturnUrl = new URLSearchParams(search).get('returnUrl') || '/';
 *   const returnUrl = /^\/[^/\\]/.test(rawReturnUrl) ? rawReturnUrl : '/';
 *
 * This ensures only same-origin absolute paths are accepted.
 */
import { describe, it, expect } from 'vitest';

// Mirror the exact same regex used in Login.jsx
const SAFE_PATH_RE = /^\/[^/\\]/;

function sanitizeReturnUrl(raw) {
  const value = raw || '/';
  return SAFE_PATH_RE.test(value) ? value : '/';
}

describe('returnUrl sanitization (Login.jsx logic)', () => {
  // ── Safe paths that should pass through unchanged ──────────────────────

  it('allows a simple absolute path', () => {
    expect(sanitizeReturnUrl('/dashboard')).toBe('/dashboard');
  });

  it('allows a path with query string', () => {
    expect(sanitizeReturnUrl('/listings?wilaya=Alger')).toBe('/listings?wilaya=Alger');
  });

  it('allows a nested path', () => {
    expect(sanitizeReturnUrl('/admin/verification')).toBe('/admin/verification');
  });

  it('allows a path with hash', () => {
    expect(sanitizeReturnUrl('/profile#settings')).toBe('/profile#settings');
  });

  it('defaults to / when the param is missing', () => {
    expect(sanitizeReturnUrl(null)).toBe('/');
    expect(sanitizeReturnUrl(undefined)).toBe('/');
    expect(sanitizeReturnUrl('')).toBe('/');
  });

  // ── Malicious URLs that must be rejected ───────────────────────────────

  it('rejects an http:// URL', () => {
    expect(sanitizeReturnUrl('http://evil.com/steal')).toBe('/');
  });

  it('rejects an https:// URL', () => {
    expect(sanitizeReturnUrl('https://phishing.example.com/')).toBe('/');
  });

  it('rejects a protocol-relative URL (//)', () => {
    expect(sanitizeReturnUrl('//evil.com')).toBe('/');
  });

  it('rejects a back-slash URL (Windows UNC-style)', () => {
    expect(sanitizeReturnUrl('\\/evil.com')).toBe('/');
  });

  it('rejects a bare domain', () => {
    expect(sanitizeReturnUrl('evil.com')).toBe('/');
  });

  it('rejects a javascript: URI', () => {
    expect(sanitizeReturnUrl('javascript:alert(1)')).toBe('/');
  });

  it('rejects a data: URI', () => {
    expect(sanitizeReturnUrl('data:text/html,<script>alert(1)</script>')).toBe('/');
  });

  it('rejects / alone (single slash with nothing after)', () => {
    // The regex requires at least one non-slash char after /
    // '/' is only one char; SAFE_PATH_RE requires a second char that isn't / or \
    expect(sanitizeReturnUrl('/')).toBe('/');
  });
});
