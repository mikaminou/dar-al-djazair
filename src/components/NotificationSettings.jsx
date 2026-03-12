import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Volume2 } from 'lucide-react';

export function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (currentUser) {
          const prefs = await base44.entities.NotificationPreference.filter({
            user_email: currentUser.email,
          });
          if (prefs[0]) {
            setPushEnabled(prefs[0].push_enabled);
            setSoundEnabled(prefs[0].sound_enabled);
          }
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const prefs = await base44.entities.NotificationPreference.filter({
        user_email: user.email,
      });

      if (prefs[0]) {
        await base44.entities.NotificationPreference.update(prefs[0].id, {
          push_enabled: pushEnabled,
          sound_enabled: soundEnabled,
        });
      } else {
        await base44.entities.NotificationPreference.create({
          user_email: user.email,
          push_enabled: pushEnabled,
          sound_enabled: soundEnabled,
        });
      }

      // If toggling push off, unsubscribe
      if (!pushEnabled && 'serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await base44.functions.invoke('removePushSubscription', {
            user_email: user.email,
            endpoint: subscription.endpoint,
          });
        }
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="font-semibold flex items-center gap-2">
        <Bell className="w-4 h-4" /> Notification Settings
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4" /> Push Notifications
          </label>
          <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Volume2 className="w-4 h-4" /> Notification Sound
          </label>
          <Switch checked={soundEnabled && pushEnabled} onCheckedChange={setSoundEnabled} disabled={!pushEnabled} />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}

export default NotificationSettings;