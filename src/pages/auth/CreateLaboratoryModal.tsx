import { useState } from 'react';
import { X, Building2, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';

interface CreateLaboratoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void;
}

const CreateLaboratoryModal = ({ isOpen, onClose, onSuccess }: CreateLaboratoryModalProps) => {
  const { currentUser } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    email: '',
    phone: '',
    website: '',
  });

  const [codeValidation, setCodeValidation] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isAvailable: null,
    message: '',
  });

  const checkCodeAvailability = async (code: string) => {
    if (!code || code.length < 3) {
      setCodeValidation({
        isChecking: false,
        isAvailable: null,
        message: '',
      });
      return;
    }

    setCodeValidation({
      isChecking: true,
      isAvailable: null,
      message: 'Checking availability...',
    });

    try {
      const docRef = await getDoc(doc(firestore, 'tenants', code.toLowerCase()));

      if (docRef.exists()) {
        setCodeValidation({
          isChecking: false,
          isAvailable: false,
          message: 'This code is already taken',
        });
      } else {
        setCodeValidation({
          isChecking: false,
          isAvailable: true,
          message: 'Code is available',
        });
      }
    } catch (error) {
      setCodeValidation({
        isChecking: false,
        isAvailable: false,
        message: 'Error checking code availability',
      });
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setFormData({ ...formData, code });

    if (code.length >= 3) {
      checkCodeAvailability(code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codeValidation.isAvailable) {
      toast.error('Invalid code', 'Please choose an available laboratory code');
      return;
    }

    setIsCreating(true);

    try {
      const tenantData = {
        id: formData.code.toLowerCase(),
        code: formData.code,
        name: formData.name,
        type: 'clinical_lab',
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        contact: {
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
        },
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          resultFormat: 'standard',
          criticalValueNotification: true,
        },
        features: {
          billing: true,
          inventory: true,
          qualityControl: true,
          emrIntegration: true,
          mobileApps: true,
        },
        subscription: {
          plan: 'trial',
          status: 'active',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'tenants', formData.code.toLowerCase()), tenantData);

      // If user is authenticated, create tenant_user entry and update user record
      if (currentUser) {
        // Create tenant_users entry with lab_admin role
        const tenantUserId = `${currentUser.id}_${formData.code.toLowerCase()}`;
        await setDoc(doc(firestore, 'tenant_users', tenantUserId), {
          userId: currentUser.id,
          tenantId: formData.code.toLowerCase(),
          role: 'lab_admin', // User who creates the lab becomes lab_admin
          permissions: [],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Update user's tenantId
        await updateDoc(doc(firestore, COLLECTION_NAMES.USERS, currentUser.id), {
          tenantId: formData.code.toLowerCase(),
          updatedAt: serverTimestamp(),
        });

        // Update the auth store
        await useAuthStore.getState().refreshUser();
      }

      toast.success('Laboratory created!', `Your laboratory code is: ${formData.code}`);
      onSuccess(formData.code);
    } catch (error) {
      console.error('Error creating laboratory:', error);
      toast.error('Creation failed', 'Failed to create laboratory. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Create New Laboratory</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="label">Laboratory Code (3-10 characters)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={10}
                  className={`input pr-10 ${
                    formData.code && !codeValidation.isChecking
                      ? codeValidation.isAvailable
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                  value={formData.code}
                  onChange={handleCodeChange}
                  placeholder="e.g., LAB001"
                />
                {formData.code && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {codeValidation.isChecking ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    ) : codeValidation.isAvailable ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </div>
                )}
              </div>
              {codeValidation.message && (
                <p
                  className={`mt-1 text-sm ${
                    codeValidation.isAvailable ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {codeValidation.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Laboratory Name</label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Central Medical Laboratory"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Street Address</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">State</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  className="input"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., NY"
                />
              </div>
              <div>
                <label className="label">ZIP Code</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                required
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@laboratory.com"
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                required
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="label">Website (optional)</label>
              <input
                type="url"
                className="input"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://laboratory.com"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !codeValidation.isAvailable}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Creating...
                  </span>
                ) : (
                  'Create Laboratory'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateLaboratoryModal;
