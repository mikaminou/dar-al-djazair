export const PUSH_CONFIG = {
  // Keep push features disabled unless explicitly enabled via env.
  ENABLED: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true',
};

