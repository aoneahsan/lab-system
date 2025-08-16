import { toast } from '@/stores/toast.store';

export interface HotkeyBinding {
  id: string;
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Command key on Mac
  action: string;
  description: string;
  category: 'navigation' | 'actions' | 'search' | 'forms' | 'custom';
  customizable: boolean;
  enabled: boolean;
}

export interface GestureBinding {
  id: string;
  gesture: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'double-tap' | 'long-press' | 'pinch' | 'spread';
  action: string;
  description: string;
  enabled: boolean;
}

// Default keyboard shortcuts
const DEFAULT_HOTKEYS: HotkeyBinding[] = [
  // Navigation shortcuts
  {
    id: 'nav-dashboard',
    key: 'd',
    alt: true,
    action: 'navigate.dashboard',
    description: 'Go to Dashboard',
    category: 'navigation',
    customizable: true,
    enabled: true,
  },
  {
    id: 'nav-patients',
    key: 'p',
    alt: true,
    action: 'navigate.patients',
    description: 'Go to Patients',
    category: 'navigation',
    customizable: true,
    enabled: true,
  },
  {
    id: 'nav-tests',
    key: 't',
    alt: true,
    action: 'navigate.tests',
    description: 'Go to Tests',
    category: 'navigation',
    customizable: true,
    enabled: true,
  },
  {
    id: 'nav-samples',
    key: 's',
    alt: true,
    action: 'navigate.samples',
    description: 'Go to Samples',
    category: 'navigation',
    customizable: true,
    enabled: true,
  },
  {
    id: 'nav-results',
    key: 'r',
    alt: true,
    action: 'navigate.results',
    description: 'Go to Results',
    category: 'navigation',
    customizable: true,
    enabled: true,
  },
  {
    id: 'nav-billing',
    key: 'b',
    alt: true,
    action: 'navigate.billing',
    description: 'Go to Billing',
    category: 'navigation',
    customizable: true,
    enabled: true,
  },
  {
    id: 'nav-back',
    key: 'Escape',
    action: 'navigate.back',
    description: 'Go Back',
    category: 'navigation',
    customizable: true,
    enabled: true,
  },
  
  // Action shortcuts
  {
    id: 'action-new',
    key: 'n',
    ctrl: true,
    action: 'action.new',
    description: 'Create New (context-aware)',
    category: 'actions',
    customizable: true,
    enabled: true,
  },
  {
    id: 'action-save',
    key: 's',
    ctrl: true,
    action: 'action.save',
    description: 'Save',
    category: 'actions',
    customizable: true,
    enabled: true,
  },
  {
    id: 'action-delete',
    key: 'Delete',
    action: 'action.delete',
    description: 'Delete Selected',
    category: 'actions',
    customizable: true,
    enabled: true,
  },
  {
    id: 'action-edit',
    key: 'e',
    ctrl: true,
    action: 'action.edit',
    description: 'Edit',
    category: 'actions',
    customizable: true,
    enabled: true,
  },
  {
    id: 'action-refresh',
    key: 'r',
    ctrl: true,
    action: 'action.refresh',
    description: 'Refresh Data',
    category: 'actions',
    customizable: true,
    enabled: true,
  },
  {
    id: 'action-print',
    key: 'p',
    ctrl: true,
    action: 'action.print',
    description: 'Print',
    category: 'actions',
    customizable: true,
    enabled: true,
  },
  
  // Search shortcuts
  {
    id: 'search-global',
    key: 'k',
    ctrl: true,
    action: 'search.global',
    description: 'Global Search',
    category: 'search',
    customizable: true,
    enabled: true,
  },
  {
    id: 'search-patients',
    key: '/',
    action: 'search.patients',
    description: 'Quick Patient Search',
    category: 'search',
    customizable: true,
    enabled: true,
  },
  {
    id: 'search-filter',
    key: 'f',
    ctrl: true,
    shift: true,
    action: 'search.filter',
    description: 'Toggle Filters',
    category: 'search',
    customizable: true,
    enabled: true,
  },
  
  // Form shortcuts
  {
    id: 'form-submit',
    key: 'Enter',
    ctrl: true,
    action: 'form.submit',
    description: 'Submit Form',
    category: 'forms',
    customizable: false,
    enabled: true,
  },
  {
    id: 'form-cancel',
    key: 'Escape',
    action: 'form.cancel',
    description: 'Cancel/Close',
    category: 'forms',
    customizable: false,
    enabled: true,
  },
  {
    id: 'form-next-field',
    key: 'Tab',
    action: 'form.nextField',
    description: 'Next Field',
    category: 'forms',
    customizable: false,
    enabled: true,
  },
  {
    id: 'form-prev-field',
    key: 'Tab',
    shift: true,
    action: 'form.prevField',
    description: 'Previous Field',
    category: 'forms',
    customizable: false,
    enabled: true,
  },
  
  // Custom shortcuts
  {
    id: 'toggle-theme',
    key: 't',
    ctrl: true,
    shift: true,
    action: 'toggle.theme',
    description: 'Toggle Dark Mode',
    category: 'custom',
    customizable: true,
    enabled: true,
  },
  {
    id: 'toggle-sidebar',
    key: 'b',
    ctrl: true,
    action: 'toggle.sidebar',
    description: 'Toggle Sidebar',
    category: 'custom',
    customizable: true,
    enabled: true,
  },
  {
    id: 'show-help',
    key: '?',
    shift: true,
    action: 'show.help',
    description: 'Show Help',
    category: 'custom',
    customizable: true,
    enabled: true,
  },
  {
    id: 'show-shortcuts',
    key: 'h',
    ctrl: true,
    shift: true,
    action: 'show.shortcuts',
    description: 'Show Keyboard Shortcuts',
    category: 'custom',
    customizable: true,
    enabled: true,
  },
];

// Default phone gestures
const DEFAULT_GESTURES: GestureBinding[] = [
  {
    id: 'gesture-back',
    gesture: 'swipe-right',
    action: 'navigate.back',
    description: 'Go Back',
    enabled: true,
  },
  {
    id: 'gesture-forward',
    gesture: 'swipe-left',
    action: 'navigate.forward',
    description: 'Go Forward',
    enabled: true,
  },
  {
    id: 'gesture-refresh',
    gesture: 'swipe-down',
    action: 'action.refresh',
    description: 'Pull to Refresh',
    enabled: true,
  },
  {
    id: 'gesture-menu',
    gesture: 'long-press',
    action: 'show.contextMenu',
    description: 'Show Context Menu',
    enabled: true,
  },
  {
    id: 'gesture-zoom-in',
    gesture: 'spread',
    action: 'zoom.in',
    description: 'Zoom In',
    enabled: true,
  },
  {
    id: 'gesture-zoom-out',
    gesture: 'pinch',
    action: 'zoom.out',
    description: 'Zoom Out',
    enabled: true,
  },
];

class HotkeysService {
  private hotkeys: Map<string, HotkeyBinding> = new Map();
  private gestures: Map<string, GestureBinding> = new Map();
  private listeners: Map<string, Set<(event: KeyboardEvent) => void>> = new Map();
  private gestureListeners: Map<string, Set<(event: TouchEvent) => void>> = new Map();
  private enabled: boolean = true;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private lastTap: number = 0;

  constructor() {
    this.loadHotkeys();
    this.loadGestures();
    this.initializeKeyboardListener();
    this.initializeGestureListeners();
  }

  private loadHotkeys() {
    // Load custom hotkeys from localStorage
    const customHotkeys = localStorage.getItem('labflow_custom_hotkeys');
    if (customHotkeys) {
      try {
        const parsed = JSON.parse(customHotkeys) as HotkeyBinding[];
        parsed.forEach(hotkey => {
          this.hotkeys.set(hotkey.id, hotkey);
        });
      } catch (error) {
        console.error('Failed to load custom hotkeys:', error);
      }
    } else {
      // Load defaults
      DEFAULT_HOTKEYS.forEach(hotkey => {
        this.hotkeys.set(hotkey.id, hotkey);
      });
    }
  }

  private loadGestures() {
    // Load custom gestures from localStorage
    const customGestures = localStorage.getItem('labflow_custom_gestures');
    if (customGestures) {
      try {
        const parsed = JSON.parse(customGestures) as GestureBinding[];
        parsed.forEach(gesture => {
          this.gestures.set(gesture.id, gesture);
        });
      } catch (error) {
        console.error('Failed to load custom gestures:', error);
      }
    } else {
      // Load defaults
      DEFAULT_GESTURES.forEach(gesture => {
        this.gestures.set(gesture.id, gesture);
      });
    }
  }

  private saveHotkeys() {
    const hotkeysArray = Array.from(this.hotkeys.values());
    localStorage.setItem('labflow_custom_hotkeys', JSON.stringify(hotkeysArray));
  }

  private saveGestures() {
    const gesturesArray = Array.from(this.gestures.values());
    localStorage.setItem('labflow_custom_gestures', JSON.stringify(gesturesArray));
  }

  private initializeKeyboardListener() {
    document.addEventListener('keydown', (event) => {
      if (!this.enabled) return;
      
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        // Allow Escape to work in forms
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Check each hotkey
      this.hotkeys.forEach(hotkey => {
        if (!hotkey.enabled) return;

        const matches = 
          event.key === hotkey.key &&
          (hotkey.ctrl === undefined || event.ctrlKey === hotkey.ctrl) &&
          (hotkey.alt === undefined || event.altKey === hotkey.alt) &&
          (hotkey.shift === undefined || event.shiftKey === hotkey.shift) &&
          (hotkey.meta === undefined || event.metaKey === hotkey.meta);

        if (matches) {
          event.preventDefault();
          this.triggerAction(hotkey.action, event);
        }
      });
    });
  }

  private initializeGestureListeners() {
    // Touch start
    document.addEventListener('touchstart', (event) => {
      if (!this.enabled) return;
      
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      this.touchStartTime = Date.now();
      
      // Check for double tap
      const now = Date.now();
      if (now - this.lastTap < 300) {
        this.handleGesture('double-tap', event);
      }
      this.lastTap = now;
    }, { passive: false });

    // Touch end for swipe detection
    document.addEventListener('touchend', (event) => {
      if (!this.enabled) return;
      
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const touchDuration = Date.now() - this.touchStartTime;
      
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      const threshold = 50; // Minimum distance for swipe
      
      // Check for long press
      if (touchDuration > 500 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        this.handleGesture('long-press', event);
        return;
      }
      
      // Check for swipes
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.handleGesture('swipe-right', event);
          } else {
            this.handleGesture('swipe-left', event);
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            this.handleGesture('swipe-down', event);
          } else {
            this.handleGesture('swipe-up', event);
          }
        }
      }
    }, { passive: false });

    // Pinch/spread detection
    let initialDistance = 0;
    document.addEventListener('touchmove', (event) => {
      if (!this.enabled) return;
      
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        if (initialDistance === 0) {
          initialDistance = distance;
        } else {
          const delta = distance - initialDistance;
          if (Math.abs(delta) > 30) {
            if (delta > 0) {
              this.handleGesture('spread', event);
            } else {
              this.handleGesture('pinch', event);
            }
            initialDistance = distance; // Reset for continuous gestures
          }
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      initialDistance = 0; // Reset when touches end
    });
  }

  private handleGesture(gestureType: GestureBinding['gesture'], event: TouchEvent) {
    this.gestures.forEach(gesture => {
      if (gesture.enabled && gesture.gesture === gestureType) {
        event.preventDefault();
        this.triggerAction(gesture.action, event);
      }
    });
  }

  private triggerAction(action: string, event: KeyboardEvent | TouchEvent) {
    // Notify all listeners for this action
    const listeners = this.listeners.get(action);
    if (listeners) {
      listeners.forEach(listener => listener(event as KeyboardEvent));
    }
    
    // Handle built-in actions
    switch (action) {
      case 'navigate.dashboard':
        window.location.href = '/dashboard';
        break;
      case 'navigate.patients':
        window.location.href = '/patients';
        break;
      case 'navigate.tests':
        window.location.href = '/tests';
        break;
      case 'navigate.samples':
        window.location.href = '/samples';
        break;
      case 'navigate.results':
        window.location.href = '/results';
        break;
      case 'navigate.billing':
        window.location.href = '/billing';
        break;
      case 'navigate.back':
        window.history.back();
        break;
      case 'navigate.forward':
        window.history.forward();
        break;
      case 'toggle.theme':
        document.documentElement.classList.toggle('dark');
        break;
      case 'show.shortcuts':
        this.showShortcutsModal();
        break;
      case 'action.refresh':
        window.location.reload();
        break;
    }
  }

  private showShortcutsModal() {
    toast.info('Keyboard Shortcuts', 'Press Ctrl+Shift+H to view all shortcuts');
  }

  // Public methods
  public getHotkeys(): HotkeyBinding[] {
    return Array.from(this.hotkeys.values());
  }
  
  public getAllHotkeys(): HotkeyBinding[] {
    return Array.from(this.hotkeys.values());
  }

  public getAllGestures(): GestureBinding[] {
    return Array.from(this.gestures.values());
  }

  public getHotkeysByCategory(category: HotkeyBinding['category']): HotkeyBinding[] {
    return Array.from(this.hotkeys.values()).filter(h => h.category === category);
  }

  public updateHotkey(id: string, updates: Partial<HotkeyBinding>) {
    const hotkey = this.hotkeys.get(id);
    if (hotkey && hotkey.customizable) {
      const updated = { ...hotkey, ...updates };
      this.hotkeys.set(id, updated);
      this.saveHotkeys();
    }
  }

  public updateGesture(id: string, enabled: boolean) {
    const gesture = this.gestures.get(id);
    if (gesture) {
      gesture.enabled = enabled;
      this.gestures.set(id, gesture);
      this.saveGestures();
    }
  }

  public resetToDefaults() {
    this.hotkeys.clear();
    DEFAULT_HOTKEYS.forEach(hotkey => {
      this.hotkeys.set(hotkey.id, hotkey);
    });
    this.saveHotkeys();
    
    this.gestures.clear();
    DEFAULT_GESTURES.forEach(gesture => {
      this.gestures.set(gesture.id, gesture);
    });
    this.saveGestures();
  }

  public registerActionListener(action: string, callback: (event: KeyboardEvent) => void) {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set());
    }
    this.listeners.get(action)?.add(callback);
  }

  public unregisterActionListener(action: string, callback: (event: KeyboardEvent) => void) {
    this.listeners.get(action)?.delete(callback);
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public formatHotkeyDisplay(hotkey: HotkeyBinding): string {
    const parts: string[] = [];
    if (hotkey.ctrl) parts.push('Ctrl');
    if (hotkey.alt) parts.push('Alt');
    if (hotkey.shift) parts.push('Shift');
    if (hotkey.meta) parts.push('Cmd');
    parts.push(hotkey.key);
    return parts.join('+');
  }

  public initialize(navigate?: any) {
    // Store navigate function if provided for navigation actions
    if (navigate) {
      this.navigate = navigate;
    }
  }

  private navigate?: any;

  public registerCustomAction(actionId: string, handler: () => void) {
    this.registerActionListener(actionId, handler as any);
  }

  public unregisterCustomAction(actionId: string) {
    // Remove all listeners for this action
    this.listeners.delete(actionId);
  }

  public addHotkey(hotkey: HotkeyBinding) {
    this.hotkeys.set(hotkey.id, hotkey);
    this.saveHotkeys();
  }

  public removeHotkey(id: string) {
    this.hotkeys.delete(id);
    this.saveHotkeys();
  }
}

export const hotkeysService = new HotkeysService();