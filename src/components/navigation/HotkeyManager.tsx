import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotkeysService } from '@/services/hotkeys.service';
import { useAuthStore } from '@/stores/auth.store';
import { userPreferencesService } from '@/services/user-preferences.service';

export const HotkeyManager: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    // Initialize hotkeys service
    hotkeysService.initialize(navigate);

    // Load user's custom hotkeys if logged in
    if (currentUser?.id) {
      loadUserHotkeys(currentUser.id);
    }

    return () => {
      // Cleanup is handled by the service
    };
  }, [navigate, currentUser?.id]);

  const loadUserHotkeys = async (userId: string) => {
    try {
      const preferences = await userPreferencesService.getUserPreferences(userId);
      if (preferences?.hotkeys) {
        // Apply user's custom hotkeys
        Object.entries(preferences.hotkeys).forEach(([id, hotkey]) => {
          hotkeysService.updateHotkey(id, hotkey);
        });
      }
    } catch (error) {
      console.error('Failed to load user hotkeys:', error);
    }
  };

  // This component doesn't render anything
  return null;
};