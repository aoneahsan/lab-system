import React, { useState, useEffect } from 'react';
import { Keyboard, FileText, X, Command } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export interface KeyboardShortcut {
  key: string;
  description: string;
  category?: 'navigation' | 'form' | 'action' | 'general';
  modifier?: 'ctrl' | 'alt' | 'shift' | 'cmd' | 'ctrl+shift' | 'alt+shift';
}

interface KeyboardShortcutsHelperProps {
  shortcuts: KeyboardShortcut[];
  type?: 'form' | 'page';
  title?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const KeyboardShortcutsHelper: React.FC<KeyboardShortcutsHelperProps> = ({
  shortcuts,
  type = 'page',
  title,
  position = 'top-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect if user is on Mac
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'navigation':
        return 'Navigation';
      case 'form':
        return 'Form Controls';
      case 'action':
        return 'Actions';
      case 'general':
        return 'General';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const formatModifier = (modifier?: string) => {
    if (!modifier) return '';
    
    const modifiers = modifier.split('+').map(mod => {
      switch (mod) {
        case 'ctrl':
          return isMac ? '⌘' : 'Ctrl';
        case 'cmd':
          return '⌘';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'shift':
          return isMac ? '⇧' : 'Shift';
        default:
          return mod;
      }
    });
    
    return modifiers.join(' + ') + ' + ';
  };

  const formatKey = (key: string) => {
    // Special key formatting
    switch (key.toLowerCase()) {
      case 'enter':
        return isMac ? '↵' : 'Enter';
      case 'esc':
      case 'escape':
        return 'Esc';
      case 'tab':
        return isMac ? '⇥' : 'Tab';
      case 'space':
        return 'Space';
      case 'backspace':
        return isMac ? '⌫' : 'Backspace';
      case 'delete':
        return isMac ? '⌦' : 'Delete';
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'left':
        return '←';
      case 'right':
        return '→';
      default:
        return key.toUpperCase();
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses[position]} z-40 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group border border-gray-200 dark:border-gray-700`}
        title="Keyboard Shortcuts"
        aria-label="Show keyboard shortcuts"
      >
        {type === 'form' ? (
          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
        ) : (
          <Keyboard className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
        )}
        
        {/* Badge indicator */}
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary-500 rounded-full animate-pulse" />
      </button>

      {/* Shortcuts Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title || `${type === 'form' ? 'Form' : 'Page'} Keyboard Shortcuts`}
        size="md"
      >
        <div className="space-y-6">
          {/* Quick tip */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Command className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Pro Tip</p>
                <p className="mt-1">
                  {isMac 
                    ? 'Use ⌘ (Command) instead of Ctrl on macOS'
                    : 'Press ? anytime to show this help'}
                </p>
              </div>
            </div>
          </div>

          {/* Shortcuts List */}
          <div className="space-y-4">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {getCategoryLabel(category)}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={`${shortcut.key}-${index}`}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 dark:text-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                          {formatModifier(shortcut.modifier)}
                          {formatKey(shortcut.key)}
                        </kbd>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 rounded">?</kbd> anytime to show this help
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Hook to register keyboard shortcuts
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  handlers: Record<string, () => void>,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Check for help shortcut (?)
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const helpButton = document.querySelector('[aria-label="Show keyboard shortcuts"]') as HTMLButtonElement;
        if (helpButton) {
          helpButton.click();
          e.preventDefault();
          return;
        }
      }

      // Check for other shortcuts
      shortcuts.forEach(shortcut => {
        const handler = handlers[shortcut.key];
        if (!handler) return;

        let modifierMatch = true;
        
        if (shortcut.modifier) {
          const modifiers = shortcut.modifier.split('+');
          modifierMatch = modifiers.every(mod => {
            switch (mod) {
              case 'ctrl':
                return e.ctrlKey || e.metaKey;
              case 'cmd':
                return e.metaKey;
              case 'alt':
                return e.altKey;
              case 'shift':
                return e.shiftKey;
              default:
                return false;
            }
          });
        } else {
          // No modifier required - ensure none are pressed
          modifierMatch = !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
        }

        if (modifierMatch && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
          e.preventDefault();
          handler();
        }
      });
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [shortcuts, handlers, enabled]);
};

// Preset shortcuts for common form operations
export const FORM_SHORTCUTS: KeyboardShortcut[] = [
  { key: 's', modifier: 'ctrl', description: 'Save current step', category: 'form' },
  { key: 'enter', modifier: 'ctrl', description: 'Save and continue', category: 'form' },
  { key: 'tab', description: 'Next field', category: 'navigation' },
  { key: 'tab', modifier: 'shift', description: 'Previous field', category: 'navigation' },
  { key: 'escape', description: 'Cancel/Close', category: 'navigation' },
  { key: 'r', modifier: 'ctrl', description: 'Reset form', category: 'form' },
  { key: 'up', description: 'Previous step', category: 'navigation' },
  { key: 'down', description: 'Next step', category: 'navigation' },
];

// Preset shortcuts for page navigation
export const PAGE_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'g', modifier: 'alt', description: 'Go to dashboard', category: 'navigation' },
  { key: 'n', modifier: 'alt', description: 'Create new', category: 'action' },
  { key: '/', description: 'Focus search', category: 'navigation' },
  { key: 'escape', description: 'Close modal/drawer', category: 'navigation' },
  { key: '?', description: 'Show this help', category: 'general' },
];