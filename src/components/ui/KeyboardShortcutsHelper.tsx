import React, { useState, useEffect } from 'react';
import { Keyboard, FileText, Command } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import keyboardShortcutsService, { KeyboardShortcut } from '@/services/KeyboardShortcutsService';

interface KeyboardShortcutsHelperProps {
  type?: 'form' | 'page';
  title?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const KeyboardShortcutsHelper: React.FC<KeyboardShortcutsHelperProps> = ({
  type = 'page',
  title,
  position = 'top-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groupedShortcuts, setGroupedShortcuts] = useState<Record<string, KeyboardShortcut[]>>({});

  useEffect(() => {
    // Register the help modal callback
    keyboardShortcutsService.setHelpModalCallback(() => setIsOpen(true));
    
    // Get shortcuts from service
    const updateShortcuts = () => {
      setGroupedShortcuts(keyboardShortcutsService.getGroupedShortcuts());
    };
    
    updateShortcuts();
    
    // Update when shortcuts change (could add event emitter to service for this)
    const interval = setInterval(updateShortcuts, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

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
                  Press ? anytime to show this help
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
                          {keyboardShortcutsService.formatModifier(shortcut.modifier)}
                          {keyboardShortcutsService.formatKey(shortcut.key)}
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