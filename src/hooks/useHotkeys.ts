import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotkeysService, Hotkey, HotkeyConfig } from '@/services/hotkeys.service';

export const useHotkeys = () => {
  const navigate = useNavigate();
  const [hotkeys, setHotkeys] = useState<HotkeyConfig>(hotkeysService.getHotkeys());
  const [enabled, setEnabled] = useState(hotkeysService.isEnabled());

  useEffect(() => {
    // Initialize hotkeys service with navigate function
    hotkeysService.initialize(navigate);

    return () => {
      // Cleanup is handled by the service
    };
  }, [navigate]);

  const registerAction = useCallback((actionId: string, handler: () => void) => {
    hotkeysService.registerCustomAction(actionId, handler);
  }, []);

  const unregisterAction = useCallback((actionId: string) => {
    hotkeysService.unregisterCustomAction(actionId);
  }, []);

  const updateHotkey = useCallback((id: string, newHotkey: Partial<Hotkey>) => {
    hotkeysService.updateHotkey(id, newHotkey);
    setHotkeys(hotkeysService.getHotkeys());
  }, []);

  const addHotkey = useCallback((hotkey: Hotkey) => {
    hotkeysService.addHotkey(hotkey);
    setHotkeys(hotkeysService.getHotkeys());
  }, []);

  const removeHotkey = useCallback((id: string) => {
    hotkeysService.removeHotkey(id);
    setHotkeys(hotkeysService.getHotkeys());
  }, []);

  const resetToDefaults = useCallback(() => {
    hotkeysService.resetToDefaults();
    setHotkeys(hotkeysService.getHotkeys());
  }, []);

  const toggleEnabled = useCallback(() => {
    const newEnabled = !enabled;
    hotkeysService.setEnabled(newEnabled);
    setEnabled(newEnabled);
  }, [enabled]);

  const formatHotkey = useCallback((hotkey: Hotkey) => {
    return hotkeysService.formatHotkeyDisplay(hotkey);
  }, []);

  return {
    hotkeys,
    enabled,
    registerAction,
    unregisterAction,
    updateHotkey,
    addHotkey,
    removeHotkey,
    resetToDefaults,
    toggleEnabled,
    formatHotkey,
  };
};

// Hook for registering a single custom action
export const useHotkeyAction = (actionId: string, handler: () => void, deps: any[] = []) => {
  const { registerAction, unregisterAction } = useHotkeys();

  useEffect(() => {
    registerAction(actionId, handler);
    return () => {
      unregisterAction(actionId);
    };
  }, [actionId, ...deps]);
};