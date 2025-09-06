import { toast } from '@/stores/toast.store';

export interface KeyboardShortcut {
  key: string;
  description: string;
  handler?: () => void | Promise<void>;
  category?: 'navigation' | 'form' | 'action' | 'general' | 'custom';
  modifier?: 'ctrl' | 'alt' | 'shift' | 'cmd' | 'ctrl+shift' | 'alt+shift' | 'ctrl+alt';
  enabled?: boolean;
  global?: boolean; // If true, works even when inputs are focused
  preventDefault?: boolean;
}

export interface ShortcutContext {
  id: string;
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  priority?: number; // Higher priority contexts override lower ones
}

class KeyboardShortcutsService {
  private contexts: Map<string, ShortcutContext> = new Map();
  private listeners: Map<string, (event: KeyboardEvent) => void> = new Map();
  private activeContexts: Set<string> = new Set();
  private globalShortcuts: KeyboardShortcut[] = [];
  private isMac: boolean = false;
  private isEnabled: boolean = true;
  private helpModalCallback?: () => void;

  constructor() {
    // Detect platform
    if (typeof window !== 'undefined') {
      this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      this.initializeGlobalListener();
      this.registerGlobalShortcuts();
    }
  }

  /**
   * Initialize the global keyboard event listener
   */
  private initializeGlobalListener() {
    const globalHandler = (event: KeyboardEvent) => {
      if (!this.isEnabled) return;

      // Check if we're in an input field (unless shortcut is global)
      const target = event.target as HTMLElement;
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || 
                           target.contentEditable === 'true';

      // Get all active shortcuts sorted by priority
      const activeShortcuts = this.getActiveShortcuts();

      // Check global shortcuts first
      for (const shortcut of this.globalShortcuts) {
        if (this.matchesShortcut(event, shortcut) && (!isInputField || shortcut.global)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
          }
          shortcut.handler?.();
          return;
        }
      }

      // Then check context shortcuts
      for (const shortcut of activeShortcuts) {
        if (this.matchesShortcut(event, shortcut) && (!isInputField || shortcut.global)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
          }
          shortcut.handler?.();
          return;
        }
      }
    };

    document.addEventListener('keydown', globalHandler);
    this.listeners.set('global', globalHandler);
  }

  /**
   * Register default global shortcuts
   */
  private registerGlobalShortcuts() {
    this.globalShortcuts = [
      {
        key: '?',
        description: 'Show keyboard shortcuts help',
        category: 'general',
        global: true,
        handler: () => this.showHelp(),
      },
      {
        key: '/',
        description: 'Focus search',
        category: 'navigation',
        handler: () => this.focusSearch(),
      },
      {
        key: 'g',
        modifier: 'alt',
        description: 'Go to dashboard',
        category: 'navigation',
        handler: () => this.navigate('/dashboard'),
      },
      {
        key: 'n',
        modifier: 'alt',
        description: 'Create new',
        category: 'action',
        handler: () => this.triggerCreateNew(),
      },
      {
        key: 'escape',
        description: 'Close modal/drawer or go back',
        category: 'navigation',
        global: true,
        handler: () => this.handleEscape(),
      },
    ];
  }

  /**
   * Check if a keyboard event matches a shortcut
   */
  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    if (shortcut.enabled === false) return false;
    if (!shortcut.key) return false;

    // Check key
    const key = event.key?.toLowerCase();
    const shortcutKey = shortcut.key.toLowerCase();
    
    if (!key || key !== shortcutKey) return false;

    // Check modifiers
    if (shortcut.modifier) {
      const modifiers = shortcut.modifier.split('+');
      
      for (const mod of modifiers) {
        switch (mod) {
          case 'ctrl':
            if (!event.ctrlKey && !event.metaKey) return false;
            break;
          case 'cmd':
            if (!event.metaKey) return false;
            break;
          case 'alt':
            if (!event.altKey) return false;
            break;
          case 'shift':
            if (!event.shiftKey) return false;
            break;
        }
      }

      // Check that no extra modifiers are pressed
      const hasCtrl = modifiers.includes('ctrl') || modifiers.includes('cmd');
      const hasAlt = modifiers.includes('alt');
      const hasShift = modifiers.includes('shift');

      if (!hasCtrl && (event.ctrlKey || event.metaKey)) return false;
      if (!hasAlt && event.altKey) return false;
      if (!hasShift && event.shiftKey) return false;
    } else {
      // No modifier required - ensure none are pressed (except for special keys)
      if (shortcutKey !== 'escape' && shortcutKey !== '?' && shortcutKey !== '/') {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
      }
    }

    return true;
  }

  /**
   * Get all active shortcuts sorted by priority
   */
  private getActiveShortcuts(): KeyboardShortcut[] {
    const shortcuts: KeyboardShortcut[] = [];
    
    // Get contexts sorted by priority
    const sortedContexts = Array.from(this.contexts.values())
      .filter(ctx => this.activeContexts.has(ctx.id) && ctx.enabled !== false)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const context of sortedContexts) {
      shortcuts.push(...context.shortcuts.filter(s => s.enabled !== false));
    }

    return shortcuts;
  }

  /**
   * Register a context with shortcuts
   */
  registerContext(context: ShortcutContext): void {
    this.contexts.set(context.id, context);
    if (context.enabled !== false) {
      this.activeContexts.add(context.id);
    }
  }

  /**
   * Unregister a context
   */
  unregisterContext(contextId: string): void {
    this.contexts.delete(contextId);
    this.activeContexts.delete(contextId);
  }

  /**
   * Activate a context
   */
  activateContext(contextId: string): void {
    if (this.contexts.has(contextId)) {
      this.activeContexts.add(contextId);
    }
  }

  /**
   * Deactivate a context
   */
  deactivateContext(contextId: string): void {
    this.activeContexts.delete(contextId);
  }

  /**
   * Update shortcuts for a context
   */
  updateContext(contextId: string, shortcuts: KeyboardShortcut[]): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.shortcuts = shortcuts;
    }
  }

  /**
   * Add a global shortcut
   */
  addGlobalShortcut(shortcut: KeyboardShortcut): void {
    this.globalShortcuts.push(shortcut);
  }

  /**
   * Remove a global shortcut
   */
  removeGlobalShortcut(key: string, modifier?: string): void {
    this.globalShortcuts = this.globalShortcuts.filter(
      s => !(s.key === key && s.modifier === modifier)
    );
  }

  /**
   * Get all shortcuts (global + active contexts)
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return [...this.globalShortcuts, ...this.getActiveShortcuts()];
  }

  /**
   * Get shortcuts grouped by category
   */
  getGroupedShortcuts(): Record<string, KeyboardShortcut[]> {
    const shortcuts = this.getAllShortcuts();
    const grouped: Record<string, KeyboardShortcut[]> = {};

    for (const shortcut of shortcuts) {
      const category = shortcut.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(shortcut);
    }

    return grouped;
  }

  /**
   * Format modifier for display
   */
  formatModifier(modifier?: string): string {
    if (!modifier) return '';
    
    const modifiers = modifier.split('+').map(mod => {
      switch (mod) {
        case 'ctrl':
          return this.isMac ? '⌘' : 'Ctrl';
        case 'cmd':
          return '⌘';
        case 'alt':
          return this.isMac ? '⌥' : 'Alt';
        case 'shift':
          return this.isMac ? '⇧' : 'Shift';
        default:
          return mod;
      }
    });
    
    return modifiers.join(' + ') + ' + ';
  }

  /**
   * Format key for display
   */
  formatKey(key: string): string {
    switch (key.toLowerCase()) {
      case 'enter':
        return this.isMac ? '↵' : 'Enter';
      case 'escape':
      case 'esc':
        return 'Esc';
      case 'tab':
        return this.isMac ? '⇥' : 'Tab';
      case 'space':
        return 'Space';
      case 'backspace':
        return this.isMac ? '⌫' : 'Backspace';
      case 'delete':
        return this.isMac ? '⌦' : 'Delete';
      case 'arrowup':
      case 'up':
        return '↑';
      case 'arrowdown':
      case 'down':
        return '↓';
      case 'arrowleft':
      case 'left':
        return '←';
      case 'arrowright':
      case 'right':
        return '→';
      default:
        return key.toUpperCase();
    }
  }

  /**
   * Enable/disable all shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Set the help modal callback
   */
  setHelpModalCallback(callback: () => void): void {
    this.helpModalCallback = callback;
  }

  /**
   * Built-in handlers
   */
  private showHelp(): void {
    if (this.helpModalCallback) {
      this.helpModalCallback();
    } else {
      // Fallback: try to click the help button if it exists
      const helpButton = document.querySelector('[aria-label="Show keyboard shortcuts"]') as HTMLButtonElement;
      if (helpButton) {
        helpButton.click();
      }
    }
  }

  private focusSearch(): void {
    const searchInput = document.querySelector('[data-search-input], input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  private navigate(path: string): void {
    // This will be overridden by the app's navigation
    window.location.href = path;
  }

  private triggerCreateNew(): void {
    // Look for a create button and click it
    const createButton = document.querySelector('[data-create-button], button:has(.plus), button:contains("New"), button:contains("Create")') as HTMLButtonElement;
    if (createButton) {
      createButton.click();
    }
  }

  private handleEscape(): void {
    // Try to close modals, drawers, or go back
    const closeButton = document.querySelector('[data-close-button], [aria-label="Close"], button:has(.x-mark)') as HTMLButtonElement;
    if (closeButton) {
      closeButton.click();
    } else {
      // Try to go back
      const backButton = document.querySelector('[data-back-button], button:has(.arrow-left)') as HTMLButtonElement;
      if (backButton) {
        backButton.click();
      }
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    // Remove all listeners
    this.listeners.forEach((listener, key) => {
      if (key === 'global') {
        document.removeEventListener('keydown', listener);
      }
    });
    
    this.listeners.clear();
    this.contexts.clear();
    this.activeContexts.clear();
  }
}

// Create singleton instance
export const keyboardShortcutsService = new KeyboardShortcutsService();

// Export default shortcuts collections
export const FORM_SHORTCUTS: KeyboardShortcut[] = [
  { key: 's', modifier: 'ctrl', description: 'Save current form', category: 'form' },
  { key: 'enter', modifier: 'ctrl', description: 'Submit form', category: 'form' },
  { key: 'r', modifier: 'ctrl', description: 'Reset form', category: 'form', preventDefault: true },
  { key: 'tab', description: 'Next field', category: 'navigation', preventDefault: false },
  { key: 'tab', modifier: 'shift', description: 'Previous field', category: 'navigation', preventDefault: false },
];

export const TABLE_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'ArrowUp', description: 'Previous row', category: 'navigation' },
  { key: 'ArrowDown', description: 'Next row', category: 'navigation' },
  { key: 'Enter', description: 'Select/Edit row', category: 'action' },
  { key: 'Delete', description: 'Delete selected', category: 'action' },
  { key: 'a', modifier: 'ctrl', description: 'Select all', category: 'action' },
];

export const MODAL_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Escape', description: 'Close modal', category: 'navigation', global: true },
  { key: 'Enter', modifier: 'ctrl', description: 'Confirm action', category: 'action' },
];

export default keyboardShortcutsService;