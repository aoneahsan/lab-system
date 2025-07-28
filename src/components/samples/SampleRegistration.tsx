import React, { useState } from 'react';
import { Save, X, User, TestTube, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSampleStore } from '@/stores/sample.store';
import { useAuthStore } from '@/stores/auth.store';
import type {
  SampleFormData,
  SampleType,
  ContainerType,
  StorageTemperature,
} from '@/types/sample.types';

export default function SampleRegistration() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { createSample, loading } = useSampleStore();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<SampleFormData>({
    orderId: '',
    patientId: '',
    type: 'blood',
    container: 'edta_tube',
    volume: 5,
    volumeUnit: 'ml',
    collectionDate: new Date(),
    collectionTime: new Date().toTimeString().slice(0, 5),
    collectedBy: currentUser?.displayName || '',
    collectionSite: '',
    priority: 'routine',
    tests: [],
    storageLocation: '',
    storageTemperature: 'refrigerated',
    notes: '',
  });

  const sampleTypes: { value: SampleType; label: string }[] = [
    { value: 'blood', label: 'Blood' },
    { value: 'serum', label: 'Serum' },
    { value: 'plasma', label: 'Plasma' },
    { value: 'urine', label: 'Urine' },
    { value: 'stool', label: 'Stool' },
    { value: 'csf', label: 'CSF' },
    { value: 'tissue', label: 'Tissue' },
    { value: 'swab', label: 'Swab' },
    { value: 'sputum', label: 'Sputum' },
    { value: 'other', label: 'Other' },
  ];

  const containerTypes: { value: ContainerType; label: string }[] = [
    { value: 'edta_tube', label: 'EDTA Tube' },
    { value: 'sst_tube', label: 'SST Tube' },
    { value: 'sodium_citrate_tube', label: 'Sodium Citrate Tube' },
    { value: 'heparin_tube', label: 'Heparin Tube' },
    { value: 'urine_cup', label: 'Urine Cup' },
    { value: 'sterile_container', label: 'Sterile Container' },
    { value: 'swab_transport', label: 'Swab Transport' },
    { value: 'other', label: 'Other' },
  ];

  const storageTemps: { value: StorageTemperature; label: string }[] = [
    { value: 'room_temp', label: 'Room Temperature (20-25°C)' },
    { value: 'refrigerated', label: 'Refrigerated (2-8°C)' },
    { value: 'frozen', label: 'Frozen (-20°C)' },
    { value: 'ultra_frozen', label: 'Ultra Frozen (-80°C)' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.orderId) newErrors.orderId = 'Order ID is required';
    if (!formData.patientId) newErrors.patientId = 'Patient ID is required';
    if (!formData.collectedBy) newErrors.collectedBy = 'Collected by is required';
    if (formData.volume && formData.volume <= 0) newErrors.volume = 'Volume must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !currentUser?.tenantId) return;

    try {
      await createSample(currentUser.tenantId, currentUser.uid, formData);
      navigate('/samples');
    } catch (error) {
      console.error('Error creating sample:', error);
      setErrors({ submit: 'Failed to create sample. Please try again.' });
    }
  };

  const handleChange = (field: keyof SampleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Register New Sample</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create a new sample entry with collection details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient and Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline h-4 w-4 mr-1" />
                Patient ID *
              </label>
              <input
                type="text"
                value={formData.patientId}
                onChange={(e) => handleChange('patientId', e.target.value)}
                className={`input ${errors.patientId ? 'border-red-500' : ''}`}
                placeholder="Enter patient ID"
              />
              {errors.patientId && <p className="text-sm text-red-600 mt-1">{errors.patientId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label>
              <input
                type="text"
                value={formData.orderId}
                onChange={(e) => handleChange('orderId', e.target.value)}
                className={`input ${errors.orderId ? 'border-red-500' : ''}`}
                placeholder="Enter order ID"
              />
              {errors.orderId && <p className="text-sm text-red-600 mt-1">{errors.orderId}</p>}
            </div>
          </div>

          {/* Sample Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TestTube className="inline h-4 w-4 mr-1" />
                Sample Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as SampleType)}
                className="input"
              >
                {sampleTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Container Type *
              </label>
              <select
                value={formData.container}
                onChange={(e) => handleChange('container', e.target.value as ContainerType)}
                className="input"
              >
                {containerTypes.map((container) => (
                  <option key={container.value} value={container.value}>
                    {container.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Volume */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={formData.volume}
                  onChange={(e) => handleChange('volume', parseFloat(e.target.value))}
                  className={`input flex-1 ${errors.volume ? 'border-red-500' : ''}`}
                  placeholder="Enter volume"
                  min="0"
                  step="0.1"
                />
                <select
                  value={formData.volumeUnit}
                  onChange={(e) => handleChange('volumeUnit', e.target.value as 'ml' | 'ul')}
                  className="input w-24"
                >
                  <option value="ml">ml</option>
                  <option value="ul">µl</option>
                </select>
              </div>
              {errors.volume && <p className="text-sm text-red-600 mt-1">{errors.volume}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  handleChange('priority', e.target.value as 'routine' | 'stat' | 'asap')
                }
                className="input"
              >
                <option value="routine">Routine</option>
                <option value="asap">ASAP</option>
                <option value="stat">STAT</option>
              </select>
            </div>
          </div>

          {/* Collection Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Collection Date *
              </label>
              <input
                type="date"
                value={formData.collectionDate.toISOString().split('T')[0]}
                onChange={(e) => handleChange('collectionDate', new Date(e.target.value))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Time *
              </label>
              <input
                type="time"
                value={formData.collectionTime}
                onChange={(e) => handleChange('collectionTime', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collected By *</label>
              <input
                type="text"
                value={formData.collectedBy}
                onChange={(e) => handleChange('collectedBy', e.target.value)}
                className={`input ${errors.collectedBy ? 'border-red-500' : ''}`}
                placeholder="Enter collector name"
              />
              {errors.collectedBy && (
                <p className="text-sm text-red-600 mt-1">{errors.collectedBy}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="inline h-4 w-4 mr-1" />
                Collection Site
              </label>
              <input
                type="text"
                value={formData.collectionSite || ''}
                onChange={(e) => handleChange('collectionSite', e.target.value)}
                className="input"
                placeholder="Enter collection site"
              />
            </div>
          </div>

          {/* Storage Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Location
              </label>
              <input
                type="text"
                value={formData.storageLocation || ''}
                onChange={(e) => handleChange('storageLocation', e.target.value)}
                className="input"
                placeholder="e.g., Rack A, Shelf 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Temperature
              </label>
              <select
                value={formData.storageTemperature}
                onChange={(e) =>
                  handleChange('storageTemperature', e.target.value as StorageTemperature)
                }
                className="input"
              >
                {storageTemps.map((temp) => (
                  <option key={temp.value} value={temp.value}>
                    {temp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="input"
              rows={3}
              placeholder="Enter any additional notes..."
            />
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => navigate('/samples')} className="btn btn-outline">
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Sample'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
