import React, { useMemo, useState } from 'react';
import { Lock, Mail, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MIN_PASSWORD_LENGTH = 8;
const AUTH_REQUEST_TIMEOUT_MS = 15000;

export default function Login() {
  const [activeTab, setActiveTab] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const returnUrl = useMemo(() => {
    const rawReturnUrl = window.sessionStorage.getItem('postLoginReturnUrl') || '/';
    return /^\/[^/\\]/.test(rawReturnUrl) ? rawReturnUrl : '/';
  }, []);

  function clearFeedback() {
    setError('');
    setMessage('');
  }

  async function withTimeout(promise, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('La connexion prend trop de temps. Vérifiez votre réseau, VPN/proxy, puis réessayez.'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    clearFeedback();

    try {
      const { error: err } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password })
      );
      if (err) {
        setError(err.message);
        return;
      }

      window.sessionStorage.removeItem('postLoginReturnUrl');
      window.location.href = returnUrl;
    } catch (err) {
      setError(err?.message || 'Connexion impossible pour le moment.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    clearFeedback();

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const emailPrefix = email.includes('@') ? email.split('@')[0].trim() : '';
    try {
      const { data, error: err } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + returnUrl,
            data: { full_name: fullName.trim() || emailPrefix || 'User' },
          },
        })
      );

      if (err) {
        setError(err.message);
        return;
      }

      if (data.session) {
        window.sessionStorage.removeItem('postLoginReturnUrl');
        window.location.href = returnUrl;
        return;
      }

      setMessage('Compte créé. Vérifiez votre email pour confirmer votre inscription.');
      setActiveTab('sign-in');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err?.message || 'Inscription impossible pour le moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-4rem] h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20" />
        <div className="absolute -right-20 bottom-[-3rem] h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-600/20" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md border-emerald-200/60 bg-card/95 shadow-2xl backdrop-blur-sm dark:border-emerald-900/40">
          <CardHeader className="space-y-4 pb-4 text-center">
            <div className="mx-auto inline-flex items-center justify-center">
              <img
                src="/favicon.svg"
                alt="Dar Al Djazair"
                className="h-14 w-14 rounded-2xl p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-[#13161c]"
              />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">Dar Al Djazair</CardTitle>
              <CardDescription className="mt-1">Accédez à votre espace immobilier</CardDescription>
            </div>
            <div className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50/90 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Moderne • Sécurisé
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                clearFeedback();
              }}
              className="w-full"
            >
              <TabsList className="grid h-11 w-full grid-cols-2">
                <TabsTrigger value="sign-in">Se connecter</TabsTrigger>
                <TabsTrigger value="sign-up">Créer un compte</TabsTrigger>
              </TabsList>

              <TabsContent value="sign-in">
                <form onSubmit={handleSignIn} className="space-y-4 pt-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        autoComplete="email"
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mot de passe</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={loading}
                  >
                    {loading ? 'Connexion…' : 'Se connecter'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="sign-up">
                <form onSubmit={handleSignUp} className="space-y-4 pt-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom complet</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Votre nom"
                      autoComplete="name"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        required
                        autoComplete="email"
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mot de passe</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="8 caractères minimum"
                        required
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirmer le mot de passe</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Répétez le mot de passe"
                        required
                        autoComplete="new-password"
                        minLength={MIN_PASSWORD_LENGTH}
                        className="h-11 pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={loading}
                  >
                    {loading ? 'Création…' : 'Créer mon compte'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                {message}
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Google et téléphone arrivent bientôt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
