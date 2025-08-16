import React, { useState, useEffect } from 'react';
import { Keyboard, RotateCcw, Save, Plus, Trash2 } from 'lucide-react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useAuthStore } from '@/stores/auth.store';
import { userPreferencesService } from '@/services/user-preferences.service';
import { modalService } from '@/services/modal.service';
import { toast } from '@/stores/toast.store';
import { Hotkey } from '@/services/hotkeys.service';

export const HotkeySettings: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { hotkeys, updateHotkey, addHotkey, removeHotkey, resetToDefaults, formatHotkey } = useHotkeys();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHotkey, setNewHotkey] = useState<Partial<Hotkey>>({
    id: '',
    description: '',
    key: '',
    action: '',
    category: 'custom',
  });
  const [recordingKey, setRecordingKey] = useState(false);

  const categories = [
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
    { id: 'action', label: 'Actions', icon: '⚡' },
    { id: 'custom', label: 'Custom', icon: '⚙️' },
  ];

  const handleKeyRecord = (e: KeyboardEvent, hotkeyId?: string) => {
    e.preventDefault();
    const key = e.key.toLowerCase();
    const ctrlKey = e.ctrlKey || e.metaKey;
    const altKey = e.altKey;
    const shiftKey = e.shiftKey;

    const keyData = {
      key,
      ctrlKey,
      altKey,
      shiftKey,
      metaKey: e.metaKey,
    };

    if (hotkeyId) {
      updateHotkey(hotkeyId, keyData);
    } else {
      setNewHotkey((prev) => ({ ...prev, ...keyData }));
    }

    setRecordingKey(false);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      await userPreferencesService.updateHotkeys(currentUser.id, hotkeys);
      toast.success('Hotkeys saved', 'Your hotkey preferences have been saved');
    } catch (error) {
      toast.error('Failed to save', 'Unable to save hotkey preferences');
    }
  };

  const handleAddCustomHotkey = () => {
    if (!newHotkey.id || !newHotkey.key || !newHotkey.description || !newHotkey.action) {
      toast.error('Invalid hotkey', 'Please fill all fields');
      return;
    }

    addHotkey({
      id: newHotkey.id,
      key: newHotkey.key,
      description: newHotkey.description,
      action: newHotkey.action,
      category: 'custom',
      ctrlKey: newHotkey.ctrlKey,
      altKey: newHotkey.altKey,
      shiftKey: newHotkey.shiftKey,
      metaKey: newHotkey.metaKey,
    });

    setNewHotkey({
      id: '',
      description: '',
      key: '',
      action: '',
      category: 'custom',
    });

    toast.success('Hotkey added', 'Custom hotkey has been added');
  };

  const handleReset = async () => {
    if (await modalService.confirm({
      title: 'Reset Hotkeys',
      message: 'Are you sure you want to reset all hotkeys to defaults?',
      confirmText: 'Reset',
      cancelText: 'Cancel'
    })) {
      resetToDefaults();
      if (currentUser) {
        await userPreferencesService.updateHotkeys(currentUser.id, {});
      }
      toast.success('Reset complete', 'Hotkeys have been reset to defaults');
    }
  };

  useEffect(() => {
    if (recordingKey) {
      const handler = (e: KeyboardEvent) => handleKeyRecord(e, editingId);
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [recordingKey, editingId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize keyboard shortcuts for quick navigation and actions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="btn btn-outline flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Categories */}
      {categories.map((category) => {
        const categoryHotkeys = Object.values(hotkeys).filter(
          (h) => h.category === category.id
        );

        if (categoryHotkeys.length === 0 && category.id !== 'custom') return null;

        return (
          <div key={category.id} className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{category.icon}</span>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                {category.label}
              </h4>
            </div>

            <div className="space-y-2">
              {categoryHotkeys.map((hotkey) => (
                <div
                  key={hotkey.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {hotkey.description}
                    </p>
                    {hotkey.category === 'navigation' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Navigate to: {hotkey.action}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {editingId === hotkey.id && recordingKey ? (
                      <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded animate-pulse">
                        Press keys...
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm">
                        {formatHotkey(hotkey)}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setEditingId(hotkey.id);
                        setRecordingKey(true);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Edit hotkey"
                    >
                      <Keyboard className="h-4 w-4" />
                    </button>

                    {hotkey.category === 'custom' && (
                      <button
                        onClick={() => removeHotkey(hotkey.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                        title="Remove hotkey"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Custom Hotkey */}
              {category.id === 'custom' && (
                <div className="mt-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Add Custom Hotkey
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="ID (e.g., myCustomAction)"
                      className="input"
                      value={newHotkey.id || ''}
                      onChange={(e) => setNewHotkey((prev) => ({ ...prev, id: e.target.value }))}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      className="input"
                      value={newHotkey.description || ''}
                      onChange={(e) => setNewHotkey((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <input
                      type="text"
                      placeholder="Action (path or action ID)"
                      className="input"
                      value={newHotkey.action || ''}
                      onChange={(e) => setNewHotkey((prev) => ({ ...prev, action: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setRecordingKey(true);
                        }}
                        className="flex-1 btn btn-outline flex items-center justify-center gap-2"
                      >
                        <Keyboard className="h-4 w-4" />
                        {recordingKey && !editingId ? 'Recording...' : 'Record Keys'}
                      </button>
                      {newHotkey.key && (
                        <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm flex items-center">
                          {formatHotkey(newHotkey as Hotkey)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleAddCustomHotkey}
                    className="mt-3 btn btn-primary flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom Hotkey
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Help Text */}
      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Tips for using hotkeys:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Press Shift+? to open the features modal</li>
              <li>Navigation hotkeys work from anywhere in the app</li>
              <li>Custom hotkeys can trigger navigation or custom actions</li>
              <li>Hotkeys are synced across all your devices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add missing import
import { Info } from 'lucide-react';