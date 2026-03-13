import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Wraps protected routes. Checks auth BEFORE rendering children.
 * The page component never mounts if the user is not authenticated.
 */
export default function AuthGuard({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        if (user) {
          setReady(true);
        } else {
          base44.auth.redirectToLogin(window.location.pathname + window.location.search);
        }
      })
      .catch(() => {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      });
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}