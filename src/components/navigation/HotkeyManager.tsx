import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import keyboardShortcutsService from '@/services/KeyboardShortcutsService';
import { useAuthStore } from '@/stores/auth.store';
import { userPreferencesService } from '@/services/user-preferences.service';
import { uiLogger } from '@/services/logger.service';

export const HotkeyManager: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    // Initialize default navigation shortcuts
    initializeDefaultShortcuts();

    // Load user's custom hotkeys if logged in
    if (currentUser?.id) {
      loadUserHotkeys(currentUser.id);
    }

    return () => {
      // Cleanup is handled by the service
      keyboardShortcutsService.removeContext('user-navigation');
    };
  }, [navigate, currentUser?.id]);

  const initializeDefaultShortcuts = () => {
    // Register default navigation shortcuts
    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: 'd',
      modifier: 'ctrl',
      description: 'Go to Dashboard',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/dashboard'),
    });

    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: 'p',
      modifier: 'ctrl',
      description: 'Go to Patients',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/patients'),
    });

    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: 't',
      modifier: 'ctrl',
      description: 'Go to Tests',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/tests'),
    });

    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: 's',
      modifier: 'ctrl',
      description: 'Go to Samples',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/samples'),
    });

    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: 'r',
      modifier: 'ctrl',
      description: 'Go to Results',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/results'),
    });

    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: 'b',
      modifier: 'ctrl',
      description: 'Go to Billing',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/billing'),
    });

    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: 'i',
      modifier: 'ctrl',
      description: 'Go to Inventory',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/inventory'),
    });

    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: 'q',
      modifier: 'ctrl',
      description: 'Go to Quality Control',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/quality-control'),
    });

    keyboardShortcutsService.addContextShortcut('user-navigation', {
      key: '/',
      modifier: 'ctrl',
      description: 'Global Search',
      category: 'navigation',
      enabled: true,
      handler: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
    });
  };

  const loadUserHotkeys = async (userId: string) => {
    try {
      const preferences = await userPreferencesService.getUserPreferences(userId);
      if (preferences?.hotkeys) {
        // Apply user's custom hotkeys (simplified for now)
        uiLogger.info('User custom hotkeys loaded:', Object.keys(preferences.hotkeys).length);
      }
    } catch (error) {
      uiLogger.error('Failed to load user hotkeys:', error);
    }
  };

  // This component doesn't render anything
  return null;
};