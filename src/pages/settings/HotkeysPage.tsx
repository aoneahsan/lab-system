import React, { useState, useEffect } from 'react';
import { Keyboard, Smartphone, RotateCcw, Save, Info } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { hotkeysService, type HotkeyBinding, type GestureBinding } from '@/services/hotkeys.service';
import { toast } from '@/stores/toast.store';

const HotkeysPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'keyboard' | 'gestures'>('keyboard');
  const [hotkeys, setHotkeys] = useState<HotkeyBinding[]>([]);
  const [gestures, setGestures] = useState<GestureBinding[]>([]);
  const [editingHotkey, setEditingHotkey] = useState<string | null>(null);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setHotkeys(hotkeysService.getAllHotkeys());
    setGestures(hotkeysService.getAllGestures());
  };

  const handleKeyRecord = (hotkeyId: string, event: React.KeyboardEvent) => {
    event.preventDefault();
    
    if (recordingKey !== hotkeyId) return;
    
    const updates: Partial<HotkeyBinding> = {
      key: event.key,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey,
    };
    
    hotkeysService.updateHotkey(hotkeyId, updates);
    setRecordingKey(null);
    loadSettings();
    toast.success('Hotkey Updated', 'The keyboard shortcut has been updated');
  };

  const toggleHotkey = (hotkeyId: string, enabled: boolean) => {
    hotkeysService.updateHotkey(hotkeyId, { enabled });
    loadSettings();
  };

  const toggleGesture = (gestureId: string, enabled: boolean) => {
    hotkeysService.updateGesture(gestureId, enabled);
    loadSettings();
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all shortcuts to their defaults?')) {
      hotkeysService.resetToDefaults();
      loadSettings();
      toast.success('Reset Complete', 'All shortcuts have been reset to defaults');
    }
  };

  const categories = ['navigation', 'actions', 'search', 'forms', 'custom'] as const;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <PageHeader
        title="Keyboard Shortcuts & Gestures"
        subtitle="Customize keyboard shortcuts and touch gestures for quick navigation"
        backTo="/settings"
        backLabel="Back to Settings"
        actions={
          <button
            onClick={resetToDefaults}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        }
      />

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Quick Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 rounded text-xs">Ctrl+Shift+H</kbd> anytime to view all shortcuts</li>
              <li>Click on any shortcut key to customize it</li>
              <li>Shortcuts won't trigger while typing in input fields</li>
              <li>Some shortcuts cannot be customized for consistency</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('keyboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'keyboard'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </div>
          </button>
          <button
            onClick={() => setActiveTab('gestures')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gestures'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Touch Gestures
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'keyboard' ? (
        <div className="space-y-6">
          {categories.map(category => {
            const categoryHotkeys = hotkeys.filter(h => h.category === category);
            if (categoryHotkeys.length === 0) return null;
            
            return (
              <div key={category} className="card">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold capitalize">
                    {category} Shortcuts
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryHotkeys.map(hotkey => (
                    <div key={hotkey.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {hotkey.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Action: {hotkey.action}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {recordingKey === hotkey.id ? (
                          <input
                            type="text"
                            placeholder="Press keys..."
                            className="px-3 py-1.5 border border-primary-500 rounded-md text-sm w-32 text-center"
                            onKeyDown={(e) => handleKeyRecord(hotkey.id, e)}
                            onBlur={() => setRecordingKey(null)}
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => hotkey.customizable && setRecordingKey(hotkey.id)}
                            disabled={!hotkey.customizable}
                            className={`px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-mono ${
                              hotkey.customizable 
                                ? 'hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' 
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {hotkeysService.formatHotkeyDisplay(hotkey)}
                          </button>
                        )}
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hotkey.enabled}
                            onChange={(e) => toggleHotkey(hotkey.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Touch Gestures</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Available on mobile devices and tablets
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {gestures.map(gesture => (
              <div key={gesture.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {gesture.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Gesture: <span className="font-mono capitalize">{gesture.gesture.replace('-', ' ')}</span>
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gesture.enabled}
                    onChange={(e) => toggleGesture(gesture.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HotkeysPage;