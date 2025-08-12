import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HotkeySettings } from '@/components/settings/HotkeySettings';

const HotkeysPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back Button */}
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Keyboard Shortcuts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Customize keyboard shortcuts to navigate and perform actions quickly
        </p>
      </div>

      {/* Hotkey Settings Component */}
      <HotkeySettings />
    </div>
  );
};

export default HotkeysPage;