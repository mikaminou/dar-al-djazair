import React from 'react';
import { useAuth } from '@/lib/AuthContext';

/**
 * Wraps protected routes. Redirects to /Login if the user is not authenticated.
 * The page component never mounts until auth is confirmed.
 */
export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigateToLogin();
    return null;
  }

  return children;
}