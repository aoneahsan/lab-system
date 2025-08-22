/**
 * Legacy hotkeys service - Now wraps the new KeyboardShortcutsService
 * @deprecated Use KeyboardShortcutsService directly for new implementations
 */

import keyboardShortcutsService, { KeyboardShortcut } from './KeyboardShortcutsService';
import { toast } from '@/stores/toast.store';

export interface HotkeyBinding {
  id: string;
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: string;
  description: string;
  category: 'navigation' | 'actions' | 'search' | 'forms' | 'custom';
  customizable: boolean;
  enabled: boolean;
}

// Alias for backward compatibility
export type Hotkey = HotkeyBinding;

export interface GestureBinding {
  id: string;
  gesture: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'double-tap' | 'long-press' | 'pinch' | 'spread';
  action: string;
  description: string;
  enabled: boolean;
}

class HotkeysService {
  private actionHandlers: Map<string, () => void> = new Map();
  private actionListeners: Map<string, ((event: KeyboardEvent) => void)[]> = new Map();
  private contextId = 'legacy-hotkeys';
  private enabled: boolean = true;
  private navigate: any = null;
  private gestures: GestureBinding[] = [];

  constructor() {
    console.warn('HotkeysService is deprecated. Use KeyboardShortcutsService directly.');
  }

  /**
   * Convert legacy hotkey to new shortcut format
   */
  private convertToShortcut(hotkey: HotkeyBinding): KeyboardShortcut {
    let modifier: string | undefined;
    const modifiers: string[] = [];
    
    if (hotkey.ctrl || hotkey.meta) modifiers.push('ctrl');
    if (hotkey.alt) modifiers.push('alt');
    if (hotkey.shift) modifiers.push('shift');
    
    if (modifiers.length > 0) {
      modifier = modifiers.join('+');
    }

    const category = hotkey.category === 'actions' ? 'action' : 
                    hotkey.category === 'search' ? 'navigation' : 
                    hotkey.category === 'forms' ? 'form' : 
                    hotkey.category as any;

    return {
      key: hotkey.key,
      modifier: modifier as any,
      description: hotkey.description,
      category,
      enabled: hotkey.enabled,
      handler: () => this.executeAction(hotkey.action),
    };
  }

  /**
   * Register a hotkey (legacy method)
   */
  registerHotkey(hotkey: HotkeyBinding): void {
    const shortcut = this.convertToShortcut(hotkey);
    keyboardShortcutsService.addGlobalShortcut(shortcut);
  }

  /**
   * Unregister a hotkey (legacy method)
   */
  unregisterHotkey(id: string): void {
    // Find the hotkey by id and remove it
    // Note: This is a simplified implementation
    console.warn('unregisterHotkey is deprecated');
  }

  /**
   * Register an action handler
   */
  registerActionHandler(action: string, handler: () => void): void {
    this.actionHandlers.set(action, handler);
  }

  /**
   * Execute an action
   */
  executeAction(action: string): void {
    const handler = this.actionHandlers.get(action);
    if (handler) {
      handler();
    } else {
      // Default navigation actions
      if (action.startsWith('navigate.')) {
        const route = action.replace('navigate.', '');
        this.navigate(route);
      }
    }
  }

  /**
   * Navigate to a route
   */
  private navigate(route: string): void {
    const routeMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'patients': '/patients',
      'tests': '/tests',
      'samples': '/samples',
      'results': '/results',
      'billing': '/billing',
      'inventory': '/inventory',
      'quality-control': '/quality-control',
      'reports': '/reports',
      'settings': '/settings',
    };

    const path = routeMap[route] || `/${route}`;
    window.location.href = path;
  }

  /**
   * Check if a hotkey combination is already in use
   */
  isHotkeyInUse(key: string, modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean }): boolean {
    // This would need to check against registered shortcuts in the new service
    return false;
  }

  /**
   * Get all registered hotkeys (legacy method)
   */
  getHotkeys(): HotkeyBinding[] {
    console.warn('getHotkeys is deprecated. Use keyboardShortcutsService.getAllShortcuts()');
    return [];
  }

  /**
   * Update a hotkey binding
   */
  updateHotkey(id: string, updates: Partial<HotkeyBinding>): void {
    console.warn('updateHotkey is deprecated. Use keyboardShortcutsService methods directly');
  }

  /**
   * Save custom hotkeys to storage
   */
  saveCustomHotkeys(hotkeys: HotkeyBinding[]): void {
    localStorage.setItem('custom-hotkeys', JSON.stringify(hotkeys));
  }

  /**
   * Load custom hotkeys from storage
   */
  loadCustomHotkeys(): HotkeyBinding[] {
    const stored = localStorage.getItem('custom-hotkeys');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Reset to default hotkeys
   */
  resetToDefaults(): void {
    localStorage.removeItem('custom-hotkeys');
    toast.success('Hotkeys reset', 'Keyboard shortcuts have been reset to defaults');
  }

  /**
   * Gesture support (not implemented in new service yet)
   */
  registerGesture(gesture: GestureBinding): void {
    console.warn('Gesture support not yet implemented in new KeyboardShortcutsService');
  }

  unregisterGesture(id: string): void {
    console.warn('Gesture support not yet implemented in new KeyboardShortcutsService');
  }

  /**
   * Initialize the service with navigation
   */
  initialize(navigateFn?: any): void {
    this.navigate = navigateFn;
    console.warn('initialize is deprecated. KeyboardShortcutsService auto-initializes.');
  }

  /**
   * Register an action listener
   */
  registerActionListener(action: string, listener: (event: KeyboardEvent) => void): void {
    if (!this.actionListeners.has(action)) {
      this.actionListeners.set(action, []);
    }
    this.actionListeners.get(action)?.push(listener);
    
    // Also register the handler
    this.registerActionHandler(action, () => listener(new KeyboardEvent('keydown')));
  }

  /**
   * Get all hotkeys (returns mock data for backward compatibility)
   */
  getAllHotkeys(): HotkeyBinding[] {
    // Return default hotkeys for backward compatibility
    return [
      {
        id: 'dashboard',
        key: 'd',
        ctrl: true,
        action: 'navigate.dashboard',
        description: 'Go to Dashboard',
        category: 'navigation',
        customizable: true,
        enabled: true,
      },
      {
        id: 'patients',
        key: 'p',
        ctrl: true,
        action: 'navigate.patients',
        description: 'Go to Patients',
        category: 'navigation',
        customizable: true,
        enabled: true,
      },
      {
        id: 'tests',
        key: 't',
        ctrl: true,
        action: 'navigate.tests',
        description: 'Go to Tests',
        category: 'navigation',
        customizable: true,
        enabled: true,
      },
      {
        id: 'search',
        key: '/',
        ctrl: true,
        action: 'search.global',
        description: 'Global Search',
        category: 'search',
        customizable: true,
        enabled: true,
      },
      {
        id: 'new',
        key: 'n',
        ctrl: true,
        action: 'action.new',
        description: 'Create New',
        category: 'actions',
        customizable: true,
        enabled: true,
      },
      {
        id: 'save',
        key: 's',
        ctrl: true,
        action: 'action.save',
        description: 'Save',
        category: 'actions',
        customizable: true,
        enabled: true,
      },
    ];
  }

  /**
   * Get all gestures (returns mock data for backward compatibility)
   */
  getAllGestures(): GestureBinding[] {
    if (this.gestures.length === 0) {
      this.gestures = [
        {
          id: 'swipe-back',
          gesture: 'swipe-right',
          action: 'navigate.back',
          description: 'Go Back',
          enabled: true,
        },
        {
          id: 'swipe-forward',
          gesture: 'swipe-left',
          action: 'navigate.forward',
          description: 'Go Forward',
          enabled: false,
        },
        {
          id: 'pull-refresh',
          gesture: 'swipe-down',
          action: 'action.refresh',
          description: 'Refresh Page',
          enabled: true,
        },
      ];
    }
    return this.gestures;
  }

  /**
   * Update a gesture
   */
  updateGesture(id: string, enabled: boolean): void {
    const gesture = this.gestures.find(g => g.id === id);
    if (gesture) {
      gesture.enabled = enabled;
    }
  }

  /**
   * Format hotkey for display
   */
  formatHotkeyDisplay(hotkey: HotkeyBinding): string {
    const parts: string[] = [];
    if (hotkey.ctrl) parts.push('Ctrl');
    if (hotkey.alt) parts.push('Alt');
    if (hotkey.shift) parts.push('Shift');
    if (hotkey.meta) parts.push('Cmd');
    parts.push(hotkey.key.toUpperCase());
    return parts.join('+');
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Add a hotkey
   */
  addHotkey(hotkey: HotkeyBinding): void {
    this.registerHotkey(hotkey);
  }

  /**
   * Remove a hotkey
   */
  removeHotkey(id: string): void {
    this.unregisterHotkey(id);
  }

  /**
   * Register custom action
   */
  registerCustomAction(actionId: string, handler: () => void): void {
    this.registerActionHandler(actionId, handler);
  }

  /**
   * Unregister custom action
   */
  unregisterCustomAction(actionId: string): void {
    this.actionHandlers.delete(actionId);
    this.actionListeners.delete(actionId);
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.actionHandlers.clear();
    this.actionListeners.clear();
  }
}

// Export singleton instance for backward compatibility
export const hotkeysService = new HotkeysService();
export default hotkeysService;