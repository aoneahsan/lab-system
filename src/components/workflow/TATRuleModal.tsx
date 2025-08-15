import { useState, useEffect } from 'react';
import { useCreateTATRule, useUpdateTATRule } from '@/hooks/useWorkflowAutomation';
import type { TATRule, TATRuleFormData } from '@/types/workflow-automation.types';

interface TATRuleModalProps {
  rule: TATRule | null;
  onClose: () => void;
}

export const TATRuleModal: React.FC<TATRuleModalProps> = ({ rule, onClose }) => {
  const createMutation = useCreateTATRule();
  const updateMutation = useUpdateTATRule();
  
  const [formData, setFormData] = useState<TATRuleFormData>({
    name: '',
    isActive: true,
    testIds: [],
    testCategories: [],
    applyToAll: false,
    targetTAT: 120,
    warningThreshold: 90,
    criticalThreshold: 105,
    considerBusinessHours: false,
    businessHours: {
      start: '08:00',
      end: '17:00',
      workingDays: [1, 2, 3, 4, 5]
    }
  });

  // Reset form data when rule changes
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        isActive: rule.isActive,
        testIds: rule.testIds || [],
        testCategories: rule.testCategories || [],
        applyToAll: rule.applyToAll || false,
        targetTAT: rule.targetTAT,
        warningThreshold: rule.warningThreshold,
        criticalThreshold: rule.criticalThreshold,
        considerBusinessHours: rule.considerBusinessHours || false,
        businessHours: rule.businessHours || {
          start: '08:00',
          end: '17:00',
          workingDays: [1, 2, 3, 4, 5]
        }
      });
    } else {
      setFormData({
        name: '',
        isActive: true,
        testIds: [],
        testCategories: [],
        applyToAll: false,
        targetTAT: 120,
        warningThreshold: 90,
        criticalThreshold: 105,
        considerBusinessHours: false,
        businessHours: {
          start: '08:00',
          end: '17:00',
          workingDays: [1, 2, 3, 4, 5]
        }
      });
    }
  }, [rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rule) {
      await updateMutation.mutateAsync({
        id: rule.id,
        data: formData
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
    
    onClose();
  };

  const workingDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {rule ? 'Edit TAT Rule' : 'Create TAT Rule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.applyToAll}
                onChange={(e) => setFormData({ ...formData, applyToAll: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Apply to All Tests</span>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target TAT (minutes)</label>
              <input
                type="number"
                value={formData.targetTAT}
                onChange={(e) => setFormData({ ...formData, targetTAT: parseInt(e.target.value) })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Warning Threshold</label>
              <input
                type="number"
                value={formData.warningThreshold}
                onChange={(e) => setFormData({ ...formData, warningThreshold: parseInt(e.target.value) })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Critical Threshold</label>
              <input
                type="number"
                value={formData.criticalThreshold}
                onChange={(e) => setFormData({ ...formData, criticalThreshold: parseInt(e.target.value) })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                min={1}
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={formData.considerBusinessHours}
                onChange={(e) => setFormData({ ...formData, considerBusinessHours: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Consider Business Hours</span>
            </label>

            {formData.considerBusinessHours && (
              <div className="ml-6 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.businessHours?.start || '08:00'}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessHours: {
                          ...formData.businessHours!,
                          start: e.target.value
                        }
                      })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.businessHours?.end || '17:00'}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessHours: {
                          ...formData.businessHours!,
                          end: e.target.value
                        }
                      })}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {workingDays.map(day => (
                      <label key={day.value} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData.businessHours?.workingDays?.includes(day.value) || false}
                          onChange={(e) => {
                            const workingDays = formData.businessHours?.workingDays || [];
                            const newDays = e.target.checked
                              ? [...workingDays, day.value]
                              : workingDays.filter(d => d !== day.value);
                            setFormData({
                              ...formData,
                              businessHours: {
                                ...formData.businessHours!,
                                workingDays: newDays
                              }
                            });
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};