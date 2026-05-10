import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

function buildFallbackUser(authUser) {
  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split('@')[0]?.trim() ||
    authUser.email ||
    'Utilisateur';

  return {
    id: authUser.id,
    email: authUser.email,
    full_name: fullName,
    // Keep "role" for legacy consumers that still read user.role.
    role: 'individual',
    lang: 'fr',
    is_verified: false,
    account_type: 'individual',
    first_name: authUser.user_metadata?.first_name,
    last_name: authUser.user_metadata?.last_name,
    verification_status: null,
  };
}

async function fetchProfile(authUser) {
  if (!authUser) return null;
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle();

    if (!profile) {
      return buildFallbackUser(authUser);
    }

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
  } catch (err) {
    console.warn('[AuthContext] Failed to load profile, using auth user fallback.', err);
    return buildFallbackUser(authUser);
  }
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
        setIsAuthenticated(!!session.user);
      }
      setIsLoadingAuth(false);
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
          setIsAuthenticated(!!session.user);
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
    try {
      window.sessionStorage.setItem('postLoginReturnUrl', path);
    } catch {
      // Ignore storage failures and continue to login.
    }
    window.location.href = '/Login';
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
