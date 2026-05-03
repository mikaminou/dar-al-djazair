import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Create the underlying Base44 client
const base44Raw = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ============================================================
// Supabase-backed entity adapter
// Routes entity calls to backend CRUD functions instead of
// the native Base44 entity API. Each entity below has a
// matching `<name>Crud` backend function that supports
// list/get/create/update/delete operations.
// ============================================================

const ENTITY_TO_FUNCTION = {
  Listing: null, // handled by listingList/listingGet/listingCreate/listingUpdate/listingDelete
  Favorite: 'favoriteCrud',
  Message: 'messageCrud',
  Lead: 'leadCrud',
  AvailabilitySlot: 'availabilitySlotCrud',
  Appointment: 'appointmentCrud',
  AppointmentProposal: 'appointmentProposalCrud',
  Notification: 'notificationCrud',
  NotificationPreference: 'notificationPreferenceCrud',
  PushSubscription: 'pushSubscriptionCrud',
  TypingStatus: 'typingStatusCrud',
  UserPresence: 'userPresenceCrud',
  VerificationRequest: 'verificationRequestCrud',
  Review: 'reviewCrud',
  Tenant: 'tenantCrud',
  TenantPayment: 'tenantPaymentCrud',
  Waitlist: 'waitlistCrud',
  Client: 'clientCrud',
  ClientSearchProfile: 'clientSearchProfileCrud',
  AgencyOffice: 'agencyOfficeCrud',
  SavedSearch: 'savedSearchCrud',
  Project: 'projectCrud',
  ProjectLot: 'projectLotCrud',
  ProjectLotType: 'projectLotTypeCrud',
  UpgradeRequest: 'upgradeRequestCrud',
};

// Map Base44 field names → Supabase column names for sort/query params.
// Base44 uses created_date / updated_date; Supabase tables use created_at / updated_at.
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
    const mappedKey = FIELD_MAP[k] || k;
    out[mappedKey] = v;
  }
  return out;
}

async function invokeCrud(funcName, payload) {
  const mappedPayload = { ...payload };
  if (mappedPayload.sort) mappedPayload.sort = mapSort(mappedPayload.sort);
  if (mappedPayload.query) mappedPayload.query = mapQuery(mappedPayload.query);
  const res = await base44Raw.functions.invoke(funcName, mappedPayload);
  // Axios-style response: data is in res.data
  return res?.data;
}

function makeEntityProxy(funcName) {
  return {
    async list(sort, limit) {
      return invokeCrud(funcName, { operation: 'list', sort, limit });
    },
    async filter(query, sort, limit) {
      return invokeCrud(funcName, { operation: 'list', query, sort, limit });
    },
    async get(id) {
      return invokeCrud(funcName, { operation: 'get', id });
    },
    async create(data) {
      return invokeCrud(funcName, { operation: 'create', data });
    },
    async bulkCreate(items) {
      const results = [];
      for (const item of items || []) {
        results.push(await invokeCrud(funcName, { operation: 'create', data: item }));
      }
      return results;
    },
    async update(id, data) {
      return invokeCrud(funcName, { operation: 'update', id, data });
    },
    async delete(id) {
      return invokeCrud(funcName, { operation: 'delete', id });
    },
    schema() {
      // Schema is consumed by JsonSchemaForm in some pages — return empty obj
      // since backend functions enforce field whitelisting.
      return {};
    },
    subscribe() {
      // Realtime subscriptions not supported by CRUD adapter — noop unsubscribe
      return () => {};
    },
  };
}

// Listing has dedicated functions (listingList/Get/Create/Update/Delete)
const listingProxy = {
  async list(sort, limit) {
    const res = await base44Raw.functions.invoke('listingList', { sort: mapSort(sort), limit });
    return res?.data;
  },
  async filter(query, sort, limit) {
    const res = await base44Raw.functions.invoke('listingList', { query: mapQuery(query), sort: mapSort(sort), limit });
    return res?.data;
  },
  async get(id) {
    const res = await base44Raw.functions.invoke('listingGet', { id });
    return res?.data;
  },
  async create(data) {
    const res = await base44Raw.functions.invoke('listingCreate', { data });
    return res?.data;
  },
  async bulkCreate(items) {
    const results = [];
    for (const item of items || []) {
      const res = await base44Raw.functions.invoke('listingCreate', { data: item });
      results.push(res?.data);
    }
    return results;
  },
  async update(id, data) {
    const res = await base44Raw.functions.invoke('listingUpdate', { id, data });
    return res?.data;
  },
  async delete(id) {
    const res = await base44Raw.functions.invoke('listingDelete', { id });
    return res?.data;
  },
  schema() { return {}; },
  subscribe() { return () => {}; },
};

// Build entity overrides
const entityOverrides = { Listing: listingProxy };
for (const [entity, funcName] of Object.entries(ENTITY_TO_FUNCTION)) {
  if (funcName) entityOverrides[entity] = makeEntityProxy(funcName);
}

// Wrap the entities namespace: use override if present, fallback to native (User, etc.)
const entitiesProxy = new Proxy(base44Raw.entities, {
  get(target, prop) {
    if (entityOverrides[prop]) return entityOverrides[prop];
    return target[prop];
  },
});

export const base44 = new Proxy(base44Raw, {
  get(target, prop) {
    if (prop === 'entities') return entitiesProxy;
    return target[prop];
  },
});