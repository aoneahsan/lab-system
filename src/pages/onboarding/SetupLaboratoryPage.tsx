import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Building2, MapPin, Phone, Globe, Settings, Check } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: SetupStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Laboratory name and unique code',
    icon: Building2,
  },
  {
    id: 'address',
    title: 'Location',
    description: 'Physical address details',
    icon: MapPin,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Email, phone, and website',
    icon: Phone,
  },
  {
    id: 'settings',
    title: 'Initial Settings',
    description: 'Timezone, currency, and features',
    icon: Settings,
  },
];

const SetupLaboratoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuthStore();
  
  // Get initial step from URL
  const stepFromUrl = parseInt(searchParams.get('step') || '0');
  const [currentStep, setCurrentStep] = useState(stepFromUrl);
  const [isCreating, setIsCreating] = useState(false);

  // Update URL when step changes
  useEffect(() => {
    setSearchParams({ step: currentStep.toString() });
  }, [currentStep, setSearchParams]);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'clinical_lab',
    licenseNumber: '',
    accreditationNumber: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    email: '',
    phone: '',
    fax: '',
    website: '',
    timezone: 'America/New_York',
    currency: 'USD',
    resultFormat: 'standard',
    criticalValueNotification: true,
    billing: true,
    inventory: true,
    qualityControl: true,
    emrIntegration: true,
    mobileApps: true,
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
      console.error('Error checking code:', error);
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

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        if (!formData.code || !formData.name) {
          toast.error('Missing information', 'Please fill in all required fields');
          return false;
        }
        if (!codeValidation.isAvailable) {
          toast.error('Invalid code', 'Please choose an available laboratory code');
          return false;
        }
        break;
      case 1: // Address
        if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
          toast.error('Missing information', 'Please fill in all address fields');
          return false;
        }
        break;
      case 2: // Contact
        if (!formData.email || !formData.phone) {
          toast.error('Missing information', 'Email and phone are required');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/onboarding?option=create');
    }
  };

  const handleSubmit = async () => {
    setIsCreating(true);

    try {
      const tenantData = {
        id: formData.code.toLowerCase(),
        code: formData.code,
        name: formData.name,
        type: formData.type,
        licenseNumber: formData.licenseNumber,
        accreditationNumber: formData.accreditationNumber,
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
          fax: formData.fax,
          website: formData.website,
        },
        settings: {
          timezone: formData.timezone,
          currency: formData.currency,
          resultFormat: formData.resultFormat,
          criticalValueNotification: formData.criticalValueNotification,
        },
        features: {
          billing: formData.billing,
          inventory: formData.inventory,
          qualityControl: formData.qualityControl,
          emrIntegration: formData.emrIntegration,
          mobileApps: formData.mobileApps,
        },
        subscription: {
          plan: 'trial',
          status: 'active',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
        isActive: true,
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
          role: 'lab_admin',
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
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating laboratory:', error);
      toast.error('Creation failed', 'Failed to create laboratory. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Laboratory Code *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={10}
                  className={`input ${
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
                      <LoadingSpinner size="sm" />
                    ) : codeValidation.isAvailable ? (
                      <Check className="h-5 w-5 text-green-500" />
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
              <p className="mt-1 text-sm text-gray-500">
                A unique 3-10 character code for your laboratory
              </p>
            </div>

            <div>
              <label className="label">Laboratory Name *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Central Medical Laboratory"
              />
            </div>

            <div>
              <label className="label">Laboratory Type *</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="clinical_lab">Clinical Laboratory</option>
                <option value="reference_lab">Reference Laboratory</option>
                <option value="research_lab">Research Laboratory</option>
                <option value="hospital_lab">Hospital Laboratory</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">License Number</label>
                <input
                  type="text"
                  className="input"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="e.g., LAB-2024-001"
                />
              </div>
              <div>
                <label className="label">Accreditation Number</label>
                <input
                  type="text"
                  className="input"
                  value={formData.accreditationNumber}
                  onChange={(e) => setFormData({ ...formData, accreditationNumber: e.target.value })}
                  placeholder="e.g., CAP-123456"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Street Address *</label>
              <input
                type="text"
                required
                className="input"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="123 Medical Center Drive"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="label">State *</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  className="input"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value.toUpperCase() })
                  }
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">ZIP Code *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="label">Country *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="USA"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Contact Email *</label>
              <input
                type="email"
                required
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@laboratory.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone Number *</label>
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
                <label className="label">Fax Number</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  placeholder="(555) 123-4568"
                />
              </div>
            </div>

            <div>
              <label className="label">Website</label>
              <input
                type="url"
                className="input"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://laboratory.com"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Timezone</label>
                <select
                  className="input"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Phoenix">Arizona Time</option>
                  <option value="Pacific/Honolulu">Hawaii Time</option>
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select
                  className="input"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Result Format</label>
              <select
                className="input"
                value={formData.resultFormat}
                onChange={(e) => setFormData({ ...formData, resultFormat: e.target.value })}
              >
                <option value="standard">Standard Format</option>
                <option value="detailed">Detailed Format</option>
                <option value="compact">Compact Format</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Features to Enable
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.criticalValueNotification}
                  onChange={(e) =>
                    setFormData({ ...formData, criticalValueNotification: e.target.checked })
                  }
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Critical Value Notifications
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.billing}
                  onChange={(e) => setFormData({ ...formData, billing: e.target.checked })}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Billing & Insurance
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.inventory}
                  onChange={(e) => setFormData({ ...formData, inventory: e.target.checked })}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Inventory Management
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.qualityControl}
                  onChange={(e) => setFormData({ ...formData, qualityControl: e.target.checked })}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Quality Control
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.emrIntegration}
                  onChange={(e) => setFormData({ ...formData, emrIntegration: e.target.checked })}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  EMR Integration
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.mobileApps}
                  onChange={(e) => setFormData({ ...formData, mobileApps: e.target.checked })}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mobile Applications
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Laboratory
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up your laboratory organization step by step
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-24 mx-4 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {steps[currentStep].title}
          </h2>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentStep === 0 ? 'Back to Options' : 'Previous'}
          </button>

          <button
            onClick={handleNext}
            disabled={isCreating}
            className="btn btn-primary flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <LoadingSpinner size="sm" />
                Creating Laboratory...
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                Create Laboratory
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupLaboratoryPage;