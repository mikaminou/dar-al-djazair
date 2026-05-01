// Supabase client for the Dar El Djazair frontend.
//
// Loads URL + publishable key from the getSupabaseConfig backend
// function (so we don't hardcode them in the bundle), then exposes a
// singleton Supabase client. All data access during Phase B goes
// through this client; Base44 auth still handles login.

import { createClient } from "@supabase/supabase-js";
import { base44 } from "@/api/base44Client";

let _client = null;
let _initPromise = null;

async function initClient() {
  const res = await base44.functions.invoke("getSupabaseConfig", {});
  const { url, publishableKey } = res.data ?? {};
  if (!url || !publishableKey) {
    throw new Error("Supabase config missing");
  }
  return createClient(url, publishableKey, {
    auth: {
      // Base44 owns the session — we don't want supabase-js fighting
      // for localStorage or auto-refreshing tokens we won't use.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getSupabase() {
  if (_client) return _client;
  if (!_initPromise) _initPromise = initClient();
  _client = await _initPromise;
  return _client;
}