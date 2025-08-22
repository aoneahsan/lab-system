import React, { useState } from 'react';
import { Keyboard, Command, X, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ShortcutItem {
  key: string;
  description: string;
  modifier?: 'ctrl' | 'alt' | 'shift' | 'ctrl+shift' | 'ctrl+alt' | 'alt+shift';
}

interface KeyboardShortcutsIndicatorProps {
  shortcuts?: ShortcutItem[];
  showFormShortcuts?: boolean;
  showNavigationShortcuts?: boolean;
  showTableShortcuts?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

const defaultFormShortcuts: ShortcutItem[] = [
  { key: 'S', modifier: 'ctrl', description: 'Save form' },
  { key: 'Enter', modifier: 'ctrl', description: 'Submit form' },
  { key: 'Esc', description: 'Cancel/Close' },
];

const defaultNavigationShortcuts: ShortcutItem[] = [
  { key: '/', modifier: 'ctrl', description: 'Global search' },
  { key: 'K', modifier: 'ctrl', description: 'Command palette' },
  { key: '?', modifier: 'shift', description: 'Show all shortcuts' },
];

const defaultTableShortcuts: ShortcutItem[] = [
  { key: '↑↓', description: 'Navigate rows' },
  { key: 'Enter', description: 'Edit/Select' },
  { key: 'Space', description: 'Toggle selection' },
  { key: 'Esc', description: 'Clear selection' },
];

export const KeyboardShortcutsIndicator: React.FC<KeyboardShortcutsIndicatorProps> = ({
  shortcuts = [],
  showFormShortcuts = false,
  showNavigationShortcuts = false,
  showTableShortcuts = false,
  position = 'bottom-right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Combine all applicable shortcuts
  const allShortcuts = [
    ...shortcuts,
    ...(showFormShortcuts ? defaultFormShortcuts : []),
    ...(showNavigationShortcuts ? defaultNavigationShortcuts : []),
    ...(showTableShortcuts ? defaultTableShortcuts : []),
  ];

  if (allShortcuts.length === 0) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  const formatModifier = (modifier?: string) => {
    if (!modifier) return '';
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    return modifier
      .split('+')
      .map(m => {
        switch (m) {
          case 'ctrl': return isMac ? '⌘' : 'Ctrl';
          case 'alt': return isMac ? '⌥' : 'Alt';
          case 'shift': return isMac ? '⇧' : 'Shift';
          default: return m;
        }
      })
      .join('+');
  };

  const ShortcutModal = () => {
    if (!isExpanded) return null;

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
        
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid gap-6">
              {/* Page-specific shortcuts */}
              {shortcuts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Current Page
                  </h3>
                  <div className="grid gap-2">
                    {shortcuts.map((shortcut, index) => (
                      <ShortcutRow key={index} shortcut={shortcut} formatModifier={formatModifier} />
                    ))}
                  </div>
                </div>
              )}

              {/* Form shortcuts */}
              {showFormShortcuts && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Form Controls
                  </h3>
                  <div className="grid gap-2">
                    {defaultFormShortcuts.map((shortcut, index) => (
                      <ShortcutRow key={index} shortcut={shortcut} formatModifier={formatModifier} />
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation shortcuts */}
              {showNavigationShortcuts && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Navigation
                  </h3>
                  <div className="grid gap-2">
                    {defaultNavigationShortcuts.map((shortcut, index) => (
                      <ShortcutRow key={index} shortcut={shortcut} formatModifier={formatModifier} />
                    ))}
                  </div>
                </div>
              )}

              {/* Table shortcuts */}
              {showTableShortcuts && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Table Navigation
                  </h3>
                  <div className="grid gap-2">
                    {defaultTableShortcuts.map((shortcut, index) => (
                      <ShortcutRow key={index} shortcut={shortcut} formatModifier={formatModifier} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs border border-gray-300 dark:border-gray-600">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs border border-gray-300 dark:border-gray-600">?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const ShortcutRow = ({ shortcut, formatModifier }: { shortcut: ShortcutItem; formatModifier: (m?: string) => string }) => (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {shortcut.description}
      </span>
      <div className="flex items-center gap-1">
        {shortcut.modifier && (
          <>
            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono border border-gray-300 dark:border-gray-600">
              {formatModifier(shortcut.modifier)}
            </kbd>
            <span className="text-gray-400">+</span>
          </>
        )}
        <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono border border-gray-300 dark:border-gray-600">
          {shortcut.key}
        </kbd>
      </div>
    </div>
  );

  return (
    <>
      {/* Floating indicators */}
      <div className={`fixed ${positionClasses[position]} flex gap-2 z-50 ${className}`}>
        {/* Quick help button */}
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          title="Show keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
            Shortcuts
          </span>
        </button>

        {/* Form indicator (if page has form) */}
        {showFormShortcuts && (
          <div
            className="group flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg shadow-lg cursor-help"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <Command className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
              Ctrl+S to Save
            </span>
          </div>
        )}

        {/* Tooltip */}
        {isOpen && !isExpanded && (
          <div className="absolute bottom-full mb-2 right-0 bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-xl p-3 min-w-[200px]">
            <div className="text-xs space-y-1">
              {allShortcuts.slice(0, 5).map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="opacity-90">{shortcut.description}</span>
                  <div className="flex items-center gap-1 ml-2">
                    {shortcut.modifier && (
                      <span className="opacity-70">{formatModifier(shortcut.modifier)}+</span>
                    )}
                    <span className="font-mono">{shortcut.key}</span>
                  </div>
                </div>
              ))}
              {allShortcuts.length > 5 && (
                <div className="pt-1 border-t border-gray-700 dark:border-gray-600 mt-1 text-center opacity-70">
                  Click to see all shortcuts
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full modal */}
      <ShortcutModal />
    </>
  );
};

export default KeyboardShortcutsIndicator;