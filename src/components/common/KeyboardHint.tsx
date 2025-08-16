import React from 'react';

interface KeyboardHintProps {
  keys: string[];
  className?: string;
}

export const KeyboardHint: React.FC<KeyboardHintProps> = ({ keys, className = '' }) => {
  return (
    <span className={`hidden lg:inline-flex items-center gap-1 ml-2 ${className}`}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-gray-400 dark:text-gray-500">+</span>}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
            {key}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
};

export default KeyboardHint;