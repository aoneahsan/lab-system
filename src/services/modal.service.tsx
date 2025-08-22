import React from 'react';
import { createRoot } from 'react-dom/client';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { useModalKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ModalOptions {
  title?: string;
  message: string;
  type?: 'confirm' | 'alert' | 'prompt' | 'danger';
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  icon?: 'warning' | 'info' | 'success' | 'error' | 'danger';
  dangerous?: boolean;
}

interface ModalProps extends ModalOptions {
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

const Modal: React.FC<ModalProps> = ({
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  placeholder = '',
  defaultValue = '',
  icon,
  dangerous = false,
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = React.useState(defaultValue);
  const [isOpen, setIsOpen] = React.useState(true);

  const handleConfirm = () => {
    setIsOpen(false);
    setTimeout(() => {
      if (type === 'prompt') {
        onConfirm(inputValue);
      } else {
        onConfirm();
      }
    }, 200);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setTimeout(() => {
      onCancel();
    }, 200);
  };

  // Use centralized keyboard shortcuts
  useModalKeyboardShortcuts(
    handleCancel,
    type !== 'prompt' ? handleConfirm : undefined,
    { enabled: isOpen }
  );

  const getIcon = () => {
    const iconMap = {
      warning: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
      info: <Info className="h-6 w-6 text-blue-600" />,
      success: <CheckCircle className="h-6 w-6 text-green-600" />,
      error: <AlertCircle className="h-6 w-6 text-red-600" />,
      danger: <AlertTriangle className="h-6 w-6 text-red-600" />,
    };
    return iconMap[icon || (dangerous ? 'danger' : 'info')] || iconMap.info;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all w-full max-w-md">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 sm:mx-0 sm:h-10 sm:w-10">
                {getIcon()}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  {title || (type === 'alert' ? 'Alert' : type === 'prompt' ? 'Input Required' : 'Confirm Action')}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                    {message}
                  </p>
                  
                  {type === 'prompt' && (
                    <input
                      type="text"
                      className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder={placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleConfirm();
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {type !== 'alert' && (
              <>
                <button
                  type="button"
                  className={`inline-flex w-full justify-center rounded-md px-4 py-2 text-base font-medium text-white shadow-sm sm:ml-3 sm:w-auto sm:text-sm transition-colors ${
                    dangerous
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  onClick={handleConfirm}
                  autoFocus={type !== 'prompt'}
                >
                  {confirmText}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={handleCancel}
                >
                  {cancelText}
                </button>
              </>
            )}
            {type === 'alert' && (
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                onClick={handleConfirm}
                autoFocus
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

class ModalService {
  private createModal(options: ModalOptions): Promise<string | boolean> {
    return new Promise((resolve, reject) => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      const cleanup = () => {
        setTimeout(() => {
          root.unmount();
          if (container.parentNode) {
            container.parentNode.removeChild(container);
          }
        }, 200);
      };

      const handleConfirm = (value?: string) => {
        cleanup();
        if (options.type === 'prompt') {
          resolve(value || '');
        } else {
          resolve(true);
        }
      };

      const handleCancel = () => {
        cleanup();
        if (options.type === 'prompt') {
          resolve(null);
        } else {
          resolve(false);
        }
      };

      root.render(
        <Modal
          {...options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );
    });
  }

  async confirm(message: string, options?: Partial<ModalOptions>): Promise<boolean> {
    const result = await this.createModal({
      ...options,
      message,
      type: 'confirm',
      icon: options?.icon || 'warning',
    });
    return result as boolean;
  }

  async confirmDanger(message: string, options?: Partial<ModalOptions>): Promise<boolean> {
    const result = await this.createModal({
      ...options,
      message,
      type: 'confirm',
      dangerous: true,
      icon: 'danger',
      confirmText: options?.confirmText || 'Delete',
      title: options?.title || 'Confirm Deletion',
    });
    return result as boolean;
  }

  async alert(message: string, options?: Partial<ModalOptions>): Promise<void> {
    await this.createModal({
      ...options,
      message,
      type: 'alert',
      icon: options?.icon || 'info',
    });
  }

  async prompt(message: string, options?: Partial<ModalOptions>): Promise<string | null> {
    const result = await this.createModal({
      ...options,
      message,
      type: 'prompt',
      icon: options?.icon || 'info',
    });
    return result === false ? null : result as string;
  }

  async error(message: string, options?: Partial<ModalOptions>): Promise<void> {
    await this.createModal({
      ...options,
      message,
      type: 'alert',
      icon: 'error',
      title: options?.title || 'Error',
    });
  }

  async success(message: string, options?: Partial<ModalOptions>): Promise<void> {
    await this.createModal({
      ...options,
      message,
      type: 'alert',
      icon: 'success',
      title: options?.title || 'Success',
    });
  }
}

export const modalService = new ModalService();