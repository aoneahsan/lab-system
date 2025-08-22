import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import keyboardShortcutsService, { 
  KeyboardShortcut, 
  ShortcutContext 
} from '@/services/KeyboardShortcutsService';

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  priority?: number;
  overrideGlobalNavigation?: boolean;
}

/**
 * Hook to register keyboard shortcuts for a component
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, priority = 0, overrideGlobalNavigation = false } = options;
  const contextIdRef = useRef<string>(`context-${Date.now()}-${Math.random()}`);
  const navigate = useNavigate();

  // Override navigation if needed
  useEffect(() => {
    if (overrideGlobalNavigation && navigate) {
      // Add navigation handler to service
      keyboardShortcutsService.addGlobalShortcut({
        key: 'g',
        modifier: 'alt',
        description: 'Go to dashboard',
        category: 'navigation',
        handler: () => navigate('/dashboard'),
      });
    }
  }, [navigate, overrideGlobalNavigation]);

  useEffect(() => {
    if (!enabled) {
      keyboardShortcutsService.deactivateContext(contextIdRef.current);
      return;
    }

    const context: ShortcutContext = {
      id: contextIdRef.current,
      shortcuts,
      enabled,
      priority,
    };

    keyboardShortcutsService.registerContext(context);

    return () => {
      keyboardShortcutsService.unregisterContext(contextIdRef.current);
    };
  }, [shortcuts, enabled, priority]);

  // Update shortcuts when they change
  useEffect(() => {
    if (enabled) {
      keyboardShortcutsService.updateContext(contextIdRef.current, shortcuts);
    }
  }, [shortcuts, enabled]);

  // Utility functions
  const activateContext = useCallback(() => {
    keyboardShortcutsService.activateContext(contextIdRef.current);
  }, []);

  const deactivateContext = useCallback(() => {
    keyboardShortcutsService.deactivateContext(contextIdRef.current);
  }, []);

  const updateShortcuts = useCallback((newShortcuts: KeyboardShortcut[]) => {
    keyboardShortcutsService.updateContext(contextIdRef.current, newShortcuts);
  }, []);

  return {
    activateContext,
    deactivateContext,
    updateShortcuts,
    contextId: contextIdRef.current,
  };
};

/**
 * Hook to use global keyboard shortcuts
 */
export const useGlobalKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set up navigation handlers
    const navigationShortcuts: KeyboardShortcut[] = [
      {
        key: 'g',
        modifier: 'alt',
        description: 'Go to dashboard',
        category: 'navigation',
        handler: () => navigate('/dashboard'),
      },
      {
        key: 'p',
        modifier: 'alt',
        description: 'Go to patients',
        category: 'navigation',
        handler: () => navigate('/patients'),
      },
      {
        key: 't',
        modifier: 'alt',
        description: 'Go to tests',
        category: 'navigation',
        handler: () => navigate('/tests'),
      },
      {
        key: 's',
        modifier: 'alt',
        description: 'Go to samples',
        category: 'navigation',
        handler: () => navigate('/samples'),
      },
      {
        key: 'r',
        modifier: 'alt',
        description: 'Go to results',
        category: 'navigation',
        handler: () => navigate('/results'),
      },
      {
        key: 'b',
        modifier: 'alt',
        description: 'Go to billing',
        category: 'navigation',
        handler: () => navigate('/billing'),
      },
    ];

    navigationShortcuts.forEach(shortcut => {
      keyboardShortcutsService.addGlobalShortcut(shortcut);
    });

    // Cleanup
    return () => {
      navigationShortcuts.forEach(shortcut => {
        keyboardShortcutsService.removeGlobalShortcut(shortcut.key, shortcut.modifier);
      });
    };
  }, [navigate]);
};

/**
 * Hook for form keyboard shortcuts
 */
export const useFormKeyboardShortcuts = (
  onSave?: () => void,
  onSubmit?: () => void,
  onReset?: () => void,
  onCancel?: () => void,
  options: UseKeyboardShortcutsOptions = {}
) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (onSave) {
    shortcuts.push({
      key: 's',
      modifier: 'ctrl',
      description: 'Save form',
      category: 'form',
      handler: onSave,
    });
  }

  if (onSubmit) {
    shortcuts.push({
      key: 'enter',
      modifier: 'ctrl',
      description: 'Submit form',
      category: 'form',
      handler: onSubmit,
    });
  }

  if (onReset) {
    shortcuts.push({
      key: 'r',
      modifier: 'ctrl',
      description: 'Reset form',
      category: 'form',
      handler: onReset,
      preventDefault: true,
    });
  }

  if (onCancel) {
    shortcuts.push({
      key: 'escape',
      description: 'Cancel',
      category: 'navigation',
      handler: onCancel,
      global: true,
    });
  }

  return useKeyboardShortcuts(shortcuts, options);
};

/**
 * Hook for table/list keyboard shortcuts
 */
export const useTableKeyboardShortcuts = (
  onSelectPrevious?: () => void,
  onSelectNext?: () => void,
  onSelectItem?: () => void,
  onDeleteSelected?: () => void,
  onSelectAll?: () => void,
  options: UseKeyboardShortcutsOptions = {}
) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (onSelectPrevious) {
    shortcuts.push({
      key: 'ArrowUp',
      description: 'Previous item',
      category: 'navigation',
      handler: onSelectPrevious,
    });
  }

  if (onSelectNext) {
    shortcuts.push({
      key: 'ArrowDown',
      description: 'Next item',
      category: 'navigation',
      handler: onSelectNext,
    });
  }

  if (onSelectItem) {
    shortcuts.push({
      key: 'Enter',
      description: 'Select item',
      category: 'action',
      handler: onSelectItem,
    });
  }

  if (onDeleteSelected) {
    shortcuts.push({
      key: 'Delete',
      description: 'Delete selected',
      category: 'action',
      handler: onDeleteSelected,
    });
  }

  if (onSelectAll) {
    shortcuts.push({
      key: 'a',
      modifier: 'ctrl',
      description: 'Select all',
      category: 'action',
      handler: onSelectAll,
    });
  }

  return useKeyboardShortcuts(shortcuts, options);
};

/**
 * Hook for modal keyboard shortcuts
 */
export const useModalKeyboardShortcuts = (
  onClose?: () => void,
  onConfirm?: () => void,
  options: UseKeyboardShortcutsOptions = {}
) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (onClose) {
    shortcuts.push({
      key: 'Escape',
      description: 'Close',
      category: 'navigation',
      handler: onClose,
      global: true,
    });
  }

  if (onConfirm) {
    shortcuts.push({
      key: 'Enter',
      modifier: 'ctrl',
      description: 'Confirm',
      category: 'action',
      handler: onConfirm,
    });
  }

  return useKeyboardShortcuts(shortcuts, { ...options, priority: 100 }); // Higher priority for modals
};

export default useKeyboardShortcuts;