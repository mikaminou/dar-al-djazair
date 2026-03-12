import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PushAlertManager() {
  useEffect(() => {
    const initializePushAlert = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        // Check if PushAlert is available
        if (!window.PushAlert) {
          console.log('PushAlert not yet loaded');
          // Retry in 1 second
          setTimeout(initializePushAlert, 1000);
          return;
        }

        // Subscribe user to PushAlert
        window.PushAlert.push([
          'setUser',
          {
            email: user.email,
            name: user.full_name
          }
        ]);

        console.log('PushAlert initialized for user:', user.email);
      } catch (error) {
        console.log('PushAlert initialization skipped:', error.message);
      }
    };

    // Delay initialization to ensure PushAlert script is loaded
    const timeout = setTimeout(initializePushAlert, 2000);
    return () => clearTimeout(timeout);
  }, []);

  return null;
}