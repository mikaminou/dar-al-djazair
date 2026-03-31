import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function PushAlertManager() {
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    
    const initializePushAlert = async () => {
      try {
        // Check if PushAlert is available
        if (!window.PushAlert) {
          if (retryCount < maxRetries) {
            retryCount++;
            console.log('PushAlert not yet loaded, retry', retryCount);
            setTimeout(initializePushAlert, 1000);
          }
          return;
        }
        
        // Only call auth.me() once PushAlert is loaded
        const user = await base44.auth.me();
        if (!user) return;

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