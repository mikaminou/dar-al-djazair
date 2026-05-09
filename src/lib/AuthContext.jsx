import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

async function fetchProfile(authUser) {
  if (!authUser) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', authUser.email)
    .maybeSingle();
  if (!profile) return null;
  return {
    ...profile,
    id: authUser.id,
    email: authUser.email,
    full_name:
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.agency_name ||
      authUser.email,
    role: profile.account_type,
    lang: profile.language_preference,
    is_verified: profile.verification_status === 'verified',
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Resolve initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
        setIsAuthenticated(!!profile);
      }
      setIsLoadingAuth(false);
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
          setIsAuthenticated(!!profile);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = useCallback(async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/Login';
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    const path = window.location.pathname + window.location.search;
    window.location.href = `/Login?returnUrl=${encodeURIComponent(path)}`;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // Legacy properties kept so existing consumers don't break
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

