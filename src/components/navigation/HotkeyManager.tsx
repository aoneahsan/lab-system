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
      // Cleanup global shortcuts on unmount
      keyboardShortcutsService.removeGlobalShortcut('d', 'ctrl');
      keyboardShortcutsService.removeGlobalShortcut('p', 'ctrl');
      keyboardShortcutsService.removeGlobalShortcut('t', 'ctrl');
      keyboardShortcutsService.removeGlobalShortcut('s', 'ctrl');
      keyboardShortcutsService.removeGlobalShortcut('r', 'ctrl');
      keyboardShortcutsService.removeGlobalShortcut('b', 'ctrl');
      keyboardShortcutsService.removeGlobalShortcut('i', 'ctrl');
      keyboardShortcutsService.removeGlobalShortcut('q', 'ctrl');
      keyboardShortcutsService.removeGlobalShortcut('/', 'ctrl');
    };
  }, [navigate, currentUser?.id]);

  const initializeDefaultShortcuts = () => {
    // Register default navigation shortcuts
    keyboardShortcutsService.addGlobalShortcut({
      key: 'd',
      modifier: 'ctrl',
      description: 'Go to Dashboard',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/dashboard'),
    });

    keyboardShortcutsService.addGlobalShortcut({
      key: 'p',
      modifier: 'ctrl',
      description: 'Go to Patients',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/patients'),
    });

    keyboardShortcutsService.addGlobalShortcut({
      key: 't',
      modifier: 'ctrl',
      description: 'Go to Tests',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/tests'),
    });

    keyboardShortcutsService.addGlobalShortcut({
      key: 's',
      modifier: 'ctrl',
      description: 'Go to Samples',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/samples'),
    });

    keyboardShortcutsService.addGlobalShortcut({
      key: 'r',
      modifier: 'ctrl',
      description: 'Go to Results',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/results'),
    });

    keyboardShortcutsService.addGlobalShortcut({
      key: 'b',
      modifier: 'ctrl',
      description: 'Go to Billing',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/billing'),
    });

    keyboardShortcutsService.addGlobalShortcut({
      key: 'i',
      modifier: 'ctrl',
      description: 'Go to Inventory',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/inventory'),
    });

    keyboardShortcutsService.addGlobalShortcut({
      key: 'q',
      modifier: 'ctrl',
      description: 'Go to Quality Control',
      category: 'navigation',
      enabled: true,
      handler: () => navigate('/quality-control'),
    });

    keyboardShortcutsService.addGlobalShortcut({
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