import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('password'); // 'password' | 'magic'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/';

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (mode === 'magic') {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + returnUrl },
      });
      if (err) setError(err.message);
      else setMessage('Check your email for the login link!');
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else window.location.href = returnUrl;
    }
    setLoading(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + returnUrl },
    });
    if (err) setError(err.message);
    else setMessage('Account created! Check your email to confirm.');
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dar Al Djazair</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">منصة العقار الجزائرية</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoComplete="email"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
              {message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={loading}
          >
            {loading ? 'Chargement…' : mode === 'magic' ? 'Envoyer le lien magique' : 'Se connecter'}
          </Button>

          {mode === 'password' && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignUp}
              disabled={loading}
            >
              Créer un compte
            </Button>
          )}
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => { setMode(mode === 'magic' ? 'password' : 'magic'); setError(''); setMessage(''); }}
            className="text-sm text-emerald-600 hover:underline focus:outline-none"
          >
            {mode === 'magic' ? 'Utiliser un mot de passe' : 'Se connecter avec un lien magique'}
          </button>
        </div>
      </div>
    </div>
  );
}
