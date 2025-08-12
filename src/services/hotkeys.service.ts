import { NavigateFunction } from 'react-router-dom';

export interface Hotkey {
  id: string;
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: string;
  category: 'navigation' | 'action' | 'custom';
}

export interface HotkeyConfig {
  [key: string]: Hotkey;
}

// Default hotkeys configuration
export const defaultHotkeys: HotkeyConfig = {
  navigatePatients: {
    id: 'navigatePatients',
    key: 'p',
    altKey: true,
    description: 'Go to Patients',
    action: '/patients',
    category: 'navigation',
  },
  navigateTests: {
    id: 'navigateTests',
    key: 't',
    altKey: true,
    description: 'Go to Tests',
    action: '/tests',
    category: 'navigation',
  },
  navigateSamples: {
    id: 'navigateSamples',
    key: 's',
    altKey: true,
    description: 'Go to Samples',
    action: '/samples',
    category: 'navigation',
  },
  navigateResults: {
    id: 'navigateResults',
    key: 'r',
    altKey: true,
    description: 'Go to Results',
    action: '/results',
    category: 'navigation',
  },
  navigateBilling: {
    id: 'navigateBilling',
    key: 'b',
    altKey: true,
    description: 'Go to Billing',
    action: '/billing',
    category: 'navigation',
  },
  navigateDashboard: {
    id: 'navigateDashboard',
    key: 'd',
    altKey: true,
    description: 'Go to Dashboard',
    action: '/dashboard',
    category: 'navigation',
  },
  navigateAppointments: {
    id: 'navigateAppointments',
    key: 'a',
    altKey: true,
    description: 'Go to Appointments',
    action: '/appointments',
    category: 'navigation',
  },
  navigateInventory: {
    id: 'navigateInventory',
    key: 'i',
    altKey: true,
    description: 'Go to Inventory',
    action: '/inventory',
    category: 'navigation',
  },
  newPatient: {
    id: 'newPatient',
    key: 'n',
    altKey: true,
    shiftKey: true,
    description: 'New Patient',
    action: '/patients?action=new',
    category: 'action',
  },
  newTestOrder: {
    id: 'newTestOrder',
    key: 't',
    altKey: true,
    shiftKey: true,
    description: 'New Test Order',
    action: '/tests/orders?action=new',
    category: 'action',
  },
  quickSearch: {
    id: 'quickSearch',
    key: '/',
    ctrlKey: true,
    description: 'Quick Search',
    action: 'search',
    category: 'action',
  },
  help: {
    id: 'help',
    key: '?',
    shiftKey: true,
    description: 'Show Help/Features',
    action: 'help',
    category: 'action',
  },
};

class HotkeysService {
  private hotkeys: HotkeyConfig = { ...defaultHotkeys };
  private listeners: Map<string, (event: KeyboardEvent) => void> = new Map();
  private navigate: NavigateFunction | null = null;
  private customActions: Map<string, () => void> = new Map();
  private enabled: boolean = true;

  initialize(navigate: NavigateFunction) {
    this.navigate = navigate;
    this.loadUserHotkeys();
    this.setupGlobalListener();
  }

  private setupGlobalListener() {
    const globalListener = (event: KeyboardEvent) => {
      if (!this.enabled) return;
      
      // Skip if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      Object.values(this.hotkeys).forEach((hotkey) => {
        if (this.matchesHotkey(event, hotkey)) {
          event.preventDefault();
          this.executeHotkey(hotkey);
        }
      });
    };

    document.addEventListener('keydown', globalListener);
    this.listeners.set('global', globalListener);
  }

  private matchesHotkey(event: KeyboardEvent, hotkey: Hotkey): boolean {
    const keyMatches = event.key.toLowerCase() === hotkey.key.toLowerCase();
    const ctrlMatches = (hotkey.ctrlKey || false) === (event.ctrlKey || event.metaKey);
    const altMatches = (hotkey.altKey || false) === event.altKey;
    const shiftMatches = (hotkey.shiftKey || false) === event.shiftKey;
    const metaMatches = (hotkey.metaKey || false) === event.metaKey;

    return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
  }

  private executeHotkey(hotkey: Hotkey) {
    if (hotkey.category === 'navigation' && this.navigate) {
      this.navigate(hotkey.action);
    } else if (hotkey.category === 'action') {
      const customAction = this.customActions.get(hotkey.action);
      if (customAction) {
        customAction();
      } else if (hotkey.action.startsWith('/') && this.navigate) {
        this.navigate(hotkey.action);
      }
    }
  }

  registerCustomAction(actionId: string, handler: () => void) {
    this.customActions.set(actionId, handler);
  }

  unregisterCustomAction(actionId: string) {
    this.customActions.delete(actionId);
  }

  updateHotkey(id: string, newHotkey: Partial<Hotkey>) {
    if (this.hotkeys[id]) {
      this.hotkeys[id] = { ...this.hotkeys[id], ...newHotkey };
      this.saveUserHotkeys();
    }
  }

  addHotkey(hotkey: Hotkey) {
    this.hotkeys[hotkey.id] = hotkey;
    this.saveUserHotkeys();
  }

  removeHotkey(id: string) {
    delete this.hotkeys[id];
    this.saveUserHotkeys();
  }

  getHotkeys(): HotkeyConfig {
    return { ...this.hotkeys };
  }

  getHotkeysByCategory(category: 'navigation' | 'action' | 'custom'): Hotkey[] {
    return Object.values(this.hotkeys).filter((h) => h.category === category);
  }

  resetToDefaults() {
    this.hotkeys = { ...defaultHotkeys };
    this.saveUserHotkeys();
  }

  private loadUserHotkeys() {
    try {
      const saved = localStorage.getItem('userHotkeys');
      if (saved) {
        const userHotkeys = JSON.parse(saved);
        this.hotkeys = { ...defaultHotkeys, ...userHotkeys };
      }
    } catch (error) {
      console.error('Failed to load user hotkeys:', error);
    }
  }

  private saveUserHotkeys() {
    try {
      // Only save customizations (differences from defaults)
      const customizations: HotkeyConfig = {};
      Object.keys(this.hotkeys).forEach((key) => {
        if (
          !defaultHotkeys[key] ||
          JSON.stringify(this.hotkeys[key]) !== JSON.stringify(defaultHotkeys[key])
        ) {
          customizations[key] = this.hotkeys[key];
        }
      });
      localStorage.setItem('userHotkeys', JSON.stringify(customizations));
    } catch (error) {
      console.error('Failed to save user hotkeys:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  formatHotkeyDisplay(hotkey: Hotkey): string {
    const parts: string[] = [];
    if (hotkey.ctrlKey) parts.push('Ctrl');
    if (hotkey.altKey) parts.push('Alt');
    if (hotkey.shiftKey) parts.push('Shift');
    if (hotkey.metaKey) parts.push('Cmd');
    parts.push(hotkey.key.toUpperCase());
    return parts.join('+');
  }

  destroy() {
    this.listeners.forEach((listener, key) => {
      if (key === 'global') {
        document.removeEventListener('keydown', listener);
      }
    });
    this.listeners.clear();
    this.customActions.clear();
  }
}

export const hotkeysService = new HotkeysService();