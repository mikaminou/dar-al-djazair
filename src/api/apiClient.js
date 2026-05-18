import { supabase } from '@/lib/supabaseClient';
import { uploadToSupabase } from '@/lib/uploadToSupabase';

// ============================================================
// Profile normalization: maps profiles table → user shape
// ============================================================

function normalizeProfile(profile, authUser = null) {
  if (!profile) return null;
  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.agency_name ||
    profile.email ||
    '';
  return {
    ...profile,
    // Supabase auth UID takes precedence when available
    id: authUser?.id || profile.id,
    email: profile.email,
    full_name: fullName,
    // Compatibility aliases so existing code keeps working unchanged
    role: profile.account_type,
    lang: profile.language_preference,
    is_verified: profile.verification_status === 'verified',
  };
}

function buildFallbackUser(authUser) {
  if (!authUser) return null;
  const emailPrefix =
    authUser.email && authUser.email.includes('@')
      ? authUser.email.split('@')[0].trim()
      : '';
  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    emailPrefix ||
    authUser.email ||
    'Utilisateur';

  return {
    id: authUser.id,
    email: authUser.email,
    full_name: fullName,
    role: 'individual',
    lang: 'fr',
    is_verified: false,
    account_type: 'individual',
    first_name: authUser.user_metadata?.first_name,
    last_name: authUser.user_metadata?.last_name,
    verification_status: null,
  };
}

function denormalizeProfile(data) {
  if (!data || typeof data !== 'object') return data;
  const out = { ...data };
  // Map compatibility aliases → actual column names
  if ('role' in out) { out.account_type = out.role; delete out.role; }
  if ('lang' in out) { out.language_preference = out.lang; delete out.lang; }
  // Remove computed/read-only fields that cannot be persisted
  delete out.full_name;
  delete out.is_verified;
  return out;
}

// ============================================================
// auth
// ============================================================

const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (profileError || !profile) {
        return buildFallbackUser(user);
      }

      return normalizeProfile(profile, user);
    } catch {
      return buildFallbackUser(user);
    }
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    window.location.href = redirectUrl || '/Login';
  },

  redirectToLogin(returnUrl) {
    const url = returnUrl
      ? `/Login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/Login';
    window.location.href = url;
  },

  async updateMe(data) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    const mapped = denormalizeProfile(data);
    const { data: profile, error: upErr } = await supabase
      .from('profiles')
      .update(mapped)
      .eq('email', user.email)
      .select()
      .maybeSingle();
    if (upErr) throw upErr;
    return normalizeProfile(profile, user);
  },
};

// ============================================================
// Field mapping helpers (legacy field names → Supabase columns)
// ============================================================

const FIELD_MAP = {
  created_date: 'created_at',
  updated_date: 'updated_at',
  '-created_date': '-created_at',
  '-updated_date': '-updated_at',
};

function mapSort(sort) {
  if (!sort) return sort;
  return FIELD_MAP[sort] || sort;
}

function mapQuery(query) {
  if (!query || typeof query !== 'object') return query;
  const out = {};
  for (const [k, v] of Object.entries(query)) {
    out[FIELD_MAP[k] || k] = v;
  }
  return out;
}

// ============================================================
// Generic entity CRUD via a single Supabase edge function
// ============================================================

async function invokeCrud(entityName, payload) {
  const body = { entity: entityName, ...payload };
  if (body.sort) body.sort = mapSort(body.sort);
  if (body.query) body.query = mapQuery(body.query);
  const { data, error } = await supabase.functions.invoke('entityCrud', { body });
  if (error) throw error;
  return data;
}

function makeEntityProxy(entityName) {
  return {
    async list(sort, limit) {
      return invokeCrud(entityName, { operation: 'list', sort, limit });
    },
    async filter(query, sort, limit) {
      return invokeCrud(entityName, { operation: 'list', query, sort, limit });
    },
    async get(id) {
      return invokeCrud(entityName, { operation: 'get', id });
    },
    async create(data) {
      return invokeCrud(entityName, { operation: 'create', data });
    },
    async bulkCreate(items) {
      const results = [];
      for (const item of items || []) {
        results.push(await invokeCrud(entityName, { operation: 'create', data: item }));
      }
      return results;
    },
    async update(id, data) {
      return invokeCrud(entityName, { operation: 'update', id, data });
    },
    async delete(id) {
      return invokeCrud(entityName, { operation: 'delete', id });
    },
    schema() { return {}; },
    subscribe() { return () => {}; },
  };
}

// ============================================================
// Listing entity — dedicated functions (complex type-table logic)
// ============================================================

const listingProxy = {
  async list(sort, limit) {
    const { data, error } = await supabase.functions.invoke('listingList', {
      body: { sort: mapSort(sort), limit },
    });
    if (error) throw error;
    return data;
  },
  async filter(query, sort, limit) {
    const { data, error } = await supabase.functions.invoke('listingList', {
      body: { query: mapQuery(query), sort: mapSort(sort), limit },
    });
    if (error) throw error;
    return data;
  },
  async get(id) {
    const { data, error } = await supabase.functions.invoke('listingGet', { body: { id } });
    if (error) throw error;
    return data;
  },
  async create(d) {
    const { data, error } = await supabase.functions.invoke('listingCreate', { body: { data: d } });
    if (error) throw error;
    return data;
  },
  async bulkCreate(items) {
    const results = [];
    for (const item of items || []) {
      const { data, error } = await supabase.functions.invoke('listingCreate', { body: { data: item } });
      if (error) throw error;
      results.push(data);
    }
    return results;
  },
  async update(id, d) {
    const { data, error } = await supabase.functions.invoke('listingUpdate', { body: { id, data: d } });
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { data, error } = await supabase.functions.invoke('listingDelete', { body: { id } });
    if (error) throw error;
    return data;
  },
  schema() { return {}; },
  subscribe() { return () => {}; },
};

// ============================================================
// User entity — backed by the profiles table
// ============================================================

const userProxy = {
  async filter(query, sort, limit) {
    let q = supabase.from('profiles').select('*');
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        // Map legacy field aliases to actual column names
        const col = k === 'role' ? 'account_type' : k;
        q = q.eq(col, v);
      }
    }
    if (sort) {
      const desc = sort.startsWith('-');
      const rawField = desc ? sort.slice(1) : sort;
      const col =
        rawField === 'created_date' ? 'created_at' :
        rawField === 'updated_date' ? 'updated_at' : rawField;
      q = q.order(col, { ascending: !desc });
    }
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return (data || []).map(p => normalizeProfile(p));
  },

  async get(id) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    return data ? normalizeProfile(data) : null;
  },

  // id can be a UUID or an email address
  async update(idOrEmail, data) {
    const mapped = denormalizeProfile(data);
    const isEmail = typeof idOrEmail === 'string' && idOrEmail.includes('@');
    const col = isEmail ? 'email' : 'id';
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(mapped)
      .eq(col, idOrEmail)
      .select()
      .maybeSingle();
    if (error) throw error;
    return profile ? normalizeProfile(profile) : null;
  },
};

// ============================================================
// Entities namespace
// ============================================================

const ENTITY_NAMES = [
  'Favorite', 'Message', 'Lead', 'AvailabilitySlot', 'Appointment',
  'AppointmentProposal', 'Notification', 'NotificationPreference',
  'PushSubscription', 'TypingStatus', 'UserPresence', 'VerificationRequest',
  'Review', 'Tenant', 'TenantPayment', 'Waitlist', 'Client',
  'ClientSearchProfile', 'AgencyOffice', 'SavedSearch',
  'Project', 'ProjectLot', 'ProjectLotType', 'UpgradeRequest',
];

const entities = { Listing: listingProxy, User: userProxy };
for (const name of ENTITY_NAMES) {
  entities[name] = makeEntityProxy(name);
}

// ============================================================
// functions
// ============================================================

const functions = {
  async invoke(name, payload) {
    const { data, error } = await supabase.functions.invoke(name, { body: payload });
    if (error) throw error;
    return { data };
  },
};

// ============================================================
// integrations — UploadFile / SendEmail
// ============================================================

const integrations = {
  Core: {
    async UploadFile({ file, bucket = 'listing-photos' }) {
      const result = await uploadToSupabase(file, bucket);
      return { file_url: result.url };
    },
    async SendEmail(params) {
      // Best-effort: invoke the sendEmail edge function if available
      try {
        const { data } = await supabase.functions.invoke('sendEmail', { body: params });
        return data;
      } catch {
        console.warn('[apiClient] sendEmail function not available');
        return null;
      }
    },
  },
};

// ============================================================
// Export
// ============================================================

export const api = { auth, entities, functions, integrations };
