import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Building2, MapPin, Phone, Settings, Check, FileText,
  CreditCard, Package, CheckCircle, Wifi, Smartphone, Bell, BarChart3, Users,
  Mail, MessageSquare, FileBarChart, Shield, Clock, Zap, Save,
  FlaskConical, Building, PhoneCall, UserCheck, ClipboardCheck, AlertCircle,
  FileCheck, Bot, Timer, SendHorizontal, LayoutTemplate
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { SelectField } from '@/components/form-fields/SelectField';
import { CountryField, StateField, CityField } from '@/components/form-fields/CountryField';
import { CustomPhoneField } from '@/components/form-fields/CustomPhoneField';
import { EmailField } from '@/components/form-fields/EmailField';
import { ZipCodeField, UrlField } from '@/components/form-fields/SpecializedFields';
import { TextField } from '@/components/form-fields/TextField';
import { RichTextEditorFieldV2 } from '@/components/form-fields/RichTextEditorFieldV2';
import { FeatureToggleField, FeatureOption } from '@/components/form-fields/FeatureToggleField';
import { CheckboxCardField, CheckboxOption } from '@/components/form-fields/CheckboxCardField';
import { RadioCardField, RadioOption } from '@/components/form-fields/RadioCardField';
import { NumberField } from '@/components/form-fields/NumberField';
import onboardingService from '@/services/OnboardingService';
import { debounce } from 'lodash';

interface SetupStep {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: SetupStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    shortTitle: 'Basic',
    description: 'Laboratory name and unique code',
    icon: Building2,
  },
  {
    id: 'address',
    title: 'Location',
    shortTitle: 'Location',
    description: 'Physical address details',
    icon: MapPin,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    shortTitle: 'Contact',
    description: 'Email, phone, and website',
    icon: Phone,
  },
  {
    id: 'settings',
    title: 'Initial Settings',
    shortTitle: 'Settings',
    description: 'Timezone, currency, and features',
    icon: Settings,
  },
  {
    id: 'custom',
    title: 'Custom Configuration',
    shortTitle: 'Custom',
    description: 'Additional fields and preferences',
    icon: FileText,
  },
];

const SetupLaboratoryPageV2 = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, refreshUser } = useAuthStore();
  
  // Get initial step from URL
  const stepFromUrl = parseInt(searchParams.get('step') || '0');
  const [currentStep, setCurrentStep] = useState(stepFromUrl);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'clinical_lab',
    licenseNumber: '',
    accreditationNumber: '',
    street: '',
    city: '',
    cityId: '',
    state: '',
    stateId: '',
    zipCode: '',
    country: 'USA',
    countryId: '233',
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
    defaultTestTurnaround: '24',
    referenceLabName: '',
    referenceLabContact: '',
    customReportHeader: '',
    customReportFooter: '',
    enabledFeatures: ['billing', 'inventory', 'qualityControl', 'emrIntegration', 'mobileApps', 'criticalAlerts'],
    communicationOptions: ['patientPortal', 'emailNotifications'],
    resultManagementOptions: [],
    defaultTurnaroundMode: 'standard',
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

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if onboarding is already complete
        const isComplete = await onboardingService.isOnboardingComplete(currentUser.id);
        if (isComplete) {
          toast.success('Onboarding Complete', 'Redirecting to dashboard...');
          navigate('/dashboard');
          return;
        }

        // Load saved progress
        const progress = await onboardingService.getProgress(currentUser.id);
        if (progress) {
          // Load saved form data
          if (progress.laboratoryData) {
            setFormData(prev => ({
              ...prev,
              ...progress.laboratoryData,
              enabledFeatures: progress.laboratoryData.enabledFeatures || prev.enabledFeatures,
              communicationOptions: progress.laboratoryData.communicationOptions || prev.communicationOptions,
              resultManagementOptions: progress.laboratoryData.resultManagementOptions || prev.resultManagementOptions,
            }));
          }

          // Set completed steps
          setCompletedSteps(progress.completedSteps || []);

          // Check if there's a step in the URL first
          const urlStep = parseInt(searchParams.get('step') || '-1');
          
          if (urlStep >= 0 && (progress.completedSteps?.includes(urlStep) || urlStep === 0)) {
            // Use the step from URL if it's valid
            setCurrentStep(urlStep);
          } else {
            // Navigate to next incomplete step
            const nextStep = await onboardingService.getNextIncompleteStep(currentUser.id);
            if (nextStep >= 0) {
              setCurrentStep(nextStep);
              setSearchParams({ step: nextStep.toString() });
            }
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        toast.error('Error', 'Failed to load saved progress');
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [currentUser, navigate]);

  // Update URL when step changes
  useEffect(() => {
    const currentUrlStep = parseInt(searchParams.get('step') || '0');
    if (currentUrlStep !== currentStep && !isLoading) {
      setSearchParams({ step: currentStep.toString() });
    }
  }, [currentStep, isLoading]);

  // Auto-save with debounce
  const autoSave = useCallback(
    debounce(async (step: number, data: any) => {
      if (!currentUser) return;
      
      setIsSaving(true);
      try {
        await onboardingService.saveStepProgress(currentUser.id, step, data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [currentUser]
  );

  // Save step data when form changes
  useEffect(() => {
    if (!currentUser || isLoading) return;

    const stepData = getStepData(currentStep);
    if (Object.keys(stepData).length > 0) {
      autoSave(currentStep, stepData);
    }
  }, [formData, currentStep, currentUser, isLoading]);

  // Get data for current step
  const getStepData = (step: number) => {
    switch (step) {
      case 0:
        return {
          code: formData.code,
          name: formData.name,
          type: formData.type,
          licenseNumber: formData.licenseNumber,
          accreditationNumber: formData.accreditationNumber,
        };
      case 1:
        return {
          street: formData.street,
          city: formData.city,
          cityId: formData.cityId,
          state: formData.state,
          stateId: formData.stateId,
          zipCode: formData.zipCode,
          country: formData.country,
          countryId: formData.countryId,
        };
      case 2:
        return {
          email: formData.email,
          phone: formData.phone,
          fax: formData.fax,
          website: formData.website,
        };
      case 3:
        return {
          timezone: formData.timezone,
          currency: formData.currency,
          resultFormat: formData.resultFormat,
          enabledFeatures: formData.enabledFeatures,
        };
      case 4:
        return {
          defaultTestTurnaround: formData.defaultTestTurnaround,
          referenceLabName: formData.referenceLabName,
          referenceLabContact: formData.referenceLabContact,
          customReportHeader: formData.customReportHeader,
          customReportFooter: formData.customReportFooter,
          communicationOptions: formData.communicationOptions,
          resultManagementOptions: formData.resultManagementOptions,
          defaultTurnaroundMode: formData.defaultTurnaroundMode,
        };
      default:
        return {};
    }
  };

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
    const validation = onboardingService.validateStepData(currentStep, getStepData(currentStep));
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast.error('Validation Error', error);
      });
      return false;
    }

    // Additional validation for step 0
    if (currentStep === 0 && !codeValidation.isAvailable) {
      toast.error('Invalid code', 'Please choose an available laboratory code');
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    // Save progress
    if (currentUser) {
      await onboardingService.saveStepProgress(
        currentUser.id,
        currentStep,
        getStepData(currentStep)
      );
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/onboarding?option=create');
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to completed steps or current step
    if (completedSteps.includes(stepIndex) || stepIndex === currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    setIsCreating(true);

    try {
      // Create tenant data
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
          defaultTestTurnaround: parseInt(formData.defaultTestTurnaround) || 24,
        },
        features: {
          billing: formData.enabledFeatures.includes('billing'),
          inventory: formData.enabledFeatures.includes('inventory'),
          qualityControl: formData.enabledFeatures.includes('qualityControl'),
          emrIntegration: formData.enabledFeatures.includes('emrIntegration'),
          mobileApps: formData.enabledFeatures.includes('mobileApps'),
          patientPortal: formData.enabledFeatures.includes('patientPortal'),
          smsNotifications: formData.enabledFeatures.includes('smsNotifications'),
          emailNotifications: formData.enabledFeatures.includes('emailNotifications'),
          criticalAlerts: formData.enabledFeatures.includes('criticalAlerts'),
          analytics: formData.enabledFeatures.includes('analytics'),
          customReports: formData.enabledFeatures.includes('customReports'),
          auditLogs: formData.enabledFeatures.includes('auditLogs'),
        },
        customConfiguration: {
          referenceLabName: formData.referenceLabName,
          referenceLabContact: formData.referenceLabContact,
          reportHeader: formData.customReportHeader,
          reportFooter: formData.customReportFooter,
        },
        subscription: {
          plan: 'trial',
          status: 'active',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'tenants', formData.code.toLowerCase()), tenantData);

      // Create tenant_user entry
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

      // Mark onboarding as complete
      await onboardingService.completeOnboarding(currentUser.id);

      // Refresh user data
      await refreshUser();

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

            <TextField
              label="Laboratory Name *"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Central Medical Laboratory"
              required
            />

            <SelectField
              label="Laboratory Type *"
              name="type"
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value as string })}
              options={[
                { value: 'clinical_lab', label: 'Clinical Laboratory' },
                { value: 'reference_lab', label: 'Reference Laboratory' },
                { value: 'research_lab', label: 'Research Laboratory' },
                { value: 'hospital_lab', label: 'Hospital Laboratory' },
              ]}
              required
              isClearable={false}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="License Number"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="e.g., LAB-2024-001"
              />
              <TextField
                label="Accreditation Number"
                name="accreditationNumber"
                value={formData.accreditationNumber}
                onChange={(e) => setFormData({ ...formData, accreditationNumber: e.target.value })}
                placeholder="e.g., CAP-123456"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <TextField
              label="Street Address *"
              name="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="123 Medical Center Drive"
              required
            />

            <CountryField
              label="Country *"
              name="country"
              value={formData.countryId}
              onChange={(value) => {
                setFormData({ 
                  ...formData, 
                  countryId: value?.id || '',
                  country: value?.name || '',
                  // Reset state and city when country changes
                  stateId: '',
                  state: '',
                  cityId: '',
                  city: ''
                });
              }}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StateField
                label="State/Province *"
                name="state"
                countryId={formData.countryId}
                value={formData.stateId}
                onChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    stateId: value?.id || '',
                    state: value?.name || '',
                    // Reset city when state changes
                    cityId: '',
                    city: ''
                  });
                }}
                required
              />
              
              <CityField
                label="City *"
                name="city"
                countryId={formData.countryId}
                stateId={formData.stateId}
                value={formData.cityId}
                onChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    cityId: value?.id || '',
                    city: value?.name || ''
                  });
                }}
                required
              />
            </div>

            <ZipCodeField
              label="ZIP/Postal Code *"
              name="zipCode"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              country={formData.country === 'United States' ? 'US' : formData.country === 'Canada' ? 'CA' : formData.country === 'United Kingdom' ? 'UK' : 'US'}
              required
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <EmailField
              label="Contact Email *"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@laboratory.com"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomPhoneField
                label="Phone Number *"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                country={formData.country === 'United States' ? 'US' : formData.country === 'Canada' ? 'CA' : formData.country === 'United Kingdom' ? 'GB' : 'US'}
                required
              />
              <CustomPhoneField
                label="Fax Number"
                name="fax"
                value={formData.fax}
                onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                placeholder="(555) 123-4568"
                country={formData.country === 'United States' ? 'US' : formData.country === 'Canada' ? 'CA' : formData.country === 'United Kingdom' ? 'GB' : 'US'}
              />
            </div>

            <UrlField
              label="Website"
              name="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://laboratory.com"
            />
          </div>
        );

      case 3: {
        const featureOptions: FeatureOption[] = [
          {
            id: 'billing',
            title: 'Billing & Insurance',
            description: 'Process claims, track payments, and manage insurance',
            icon: CreditCard,
            recommended: true,
          },
          {
            id: 'inventory',
            title: 'Inventory Management',
            description: 'Track reagents, supplies, and automatic reordering',
            icon: Package,
            recommended: true,
          },
          {
            id: 'qualityControl',
            title: 'Quality Control',
            description: 'QC runs, Levey-Jennings charts, Westgard rules',
            icon: CheckCircle,
            recommended: true,
          },
          {
            id: 'emrIntegration',
            title: 'EMR Integration',
            description: 'Connect with electronic medical record systems',
            icon: Wifi,
          },
          {
            id: 'mobileApps',
            title: 'Mobile Applications',
            description: 'iOS and Android apps for staff and patients',
            icon: Smartphone,
          },
          {
            id: 'criticalAlerts',
            title: 'Critical Value Alerts',
            description: 'Instant notifications for critical test results',
            icon: Bell,
            recommended: true,
          },
          {
            id: 'analytics',
            title: 'Advanced Analytics',
            description: 'Deep insights and predictive analytics',
            icon: BarChart3,
          },
          {
            id: 'patientPortal',
            title: 'Patient Portal',
            description: 'Self-service portal for patients to view results',
            icon: Users,
          },
          {
            id: 'smsNotifications',
            title: 'SMS Notifications',
            description: 'Text message alerts for results and appointments',
            icon: MessageSquare,
          },
          {
            id: 'emailNotifications',
            title: 'Email Notifications',
            description: 'Automated email updates and reports',
            icon: Mail,
          },
          {
            id: 'customReports',
            title: 'Custom Reports',
            description: 'Build and schedule custom report templates',
            icon: FileBarChart,
          },
          {
            id: 'auditLogs',
            title: 'Audit & Compliance',
            description: 'Complete audit trails and compliance tracking',
            icon: Shield,
          },
          {
            id: 'autoScheduling',
            title: 'Auto Scheduling',
            description: 'Intelligent appointment and resource scheduling',
            icon: Clock,
            comingSoon: true,
          },
          {
            id: 'aiAssistant',
            title: 'AI Assistant',
            description: 'AI-powered insights and recommendations',
            icon: Zap,
            comingSoon: true,
          },
        ];

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Timezone"
                name="timezone"
                value={formData.timezone}
                onChange={(value) => setFormData({ ...formData, timezone: value as string })}
                options={[
                  { value: 'America/New_York', label: 'Eastern Time' },
                  { value: 'America/Chicago', label: 'Central Time' },
                  { value: 'America/Denver', label: 'Mountain Time' },
                  { value: 'America/Los_Angeles', label: 'Pacific Time' },
                  { value: 'America/Phoenix', label: 'Arizona Time' },
                  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
                ]}
                isClearable={false}
              />
              <SelectField
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={(value) => setFormData({ ...formData, currency: value as string })}
                options={[
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'GBP', label: 'GBP - British Pound' },
                  { value: 'CAD', label: 'CAD - Canadian Dollar' },
                  { value: 'AUD', label: 'AUD - Australian Dollar' },
                ]}
                isClearable={false}
              />
            </div>

            <SelectField
              label="Result Format"
              name="resultFormat"
              value={formData.resultFormat}
              onChange={(value) => setFormData({ ...formData, resultFormat: value as string })}
              options={[
                { value: 'standard', label: 'Standard Format' },
                { value: 'detailed', label: 'Detailed Format' },
                { value: 'compact', label: 'Compact Format' },
              ]}
              isClearable={false}
            />

            <FeatureToggleField
              label="Features to Enable"
              name="features"
              options={featureOptions}
              value={formData.enabledFeatures}
              onChange={(features) => setFormData({ ...formData, enabledFeatures: features })}
              columns={2}
              helpText="Select the features you want to enable for your laboratory. You can change these settings later."
            />
          </div>
        );
      }

      case 4: {
        const turnaroundOptions: RadioOption[] = [
          {
            id: 'express',
            title: 'Express (2-6 hours)',
            description: 'Fastest processing for urgent cases',
            icon: Zap,
            badge: 'Premium',
            badgeColor: 'yellow',
          },
          {
            id: 'standard',
            title: 'Standard (24 hours)',
            description: 'Regular processing time for most tests',
            icon: Timer,
            badge: 'Recommended',
            badgeColor: 'green',
          },
          {
            id: 'extended',
            title: 'Extended (48-72 hours)',
            description: 'For complex tests and specialized panels',
            icon: Clock,
          },
        ];

        const communicationOptions: CheckboxOption[] = [
          {
            id: 'patientPortal',
            title: 'Patient Portal',
            description: 'Allow patients to view results online',
            icon: Users,
          },
          {
            id: 'smsNotifications',
            title: 'SMS Notifications',
            description: 'Send text alerts for results and appointments',
            icon: MessageSquare,
          },
          {
            id: 'emailNotifications',
            title: 'Email Notifications',
            description: 'Automated email updates for results',
            icon: Mail,
          },
          {
            id: 'whatsappIntegration',
            title: 'WhatsApp Integration',
            description: 'Send updates via WhatsApp Business',
            icon: SendHorizontal,
            badge: 'New',
            badgeColor: 'blue',
          },
        ];

        const resultManagementOptions: CheckboxOption[] = [
          {
            id: 'autoRelease',
            title: 'Auto-release Normal Results',
            description: 'Automatically publish results within normal range',
            icon: Bot,
          },
          {
            id: 'physicianApproval',
            title: 'Physician Approval Required',
            description: 'All results need doctor review before release',
            icon: UserCheck,
          },
          {
            id: 'criticalAlerts',
            title: 'Critical Value Alerts',
            description: 'Immediate notification for critical results',
            icon: AlertCircle,
            badge: 'Important',
            badgeColor: 'red',
          },
          {
            id: 'deltaChecks',
            title: 'Delta Check Validation',
            description: 'Compare with previous results for accuracy',
            icon: ClipboardCheck,
          },
        ];

        return (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Custom Configuration
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Configure operational preferences for your laboratory. These settings can be modified later from the settings panel.
                  </p>
                </div>
              </div>
            </div>

            {/* Laboratory Operations Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FlaskConical className="h-5 w-5 mr-2 text-primary-500" />
                Laboratory Operations
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Reference Laboratory Name"
                  name="referenceLabName"
                  value={formData.referenceLabName}
                  onChange={(e) => setFormData({ ...formData, referenceLabName: e.target.value })}
                  placeholder="e.g., Quest Diagnostics"
                  helpText="Partner lab for specialized testing"
                  icon={Building}
                />
                
                <TextField
                  label="Reference Lab Contact"
                  name="referenceLabContact"
                  value={formData.referenceLabContact}
                  onChange={(e) => setFormData({ ...formData, referenceLabContact: e.target.value })}
                  placeholder="contact@referencelab.com"
                  helpText="Email or phone for coordination"
                  icon={PhoneCall}
                />
              </div>

              <RadioCardField
                label="Default Test Turnaround Time"
                name="turnaroundMode"
                options={turnaroundOptions}
                value={formData.defaultTurnaroundMode}
                onChange={(value) => setFormData({ ...formData, defaultTurnaroundMode: value })}
                columns={3}
                cardSize="sm"
                helpText="Sets the expected processing time for standard tests"
              />

              <NumberField
                label="Custom Turnaround Hours (if not using presets)"
                name="customTurnaround"
                value={parseInt(formData.defaultTestTurnaround)}
                onChange={(value) => setFormData({ ...formData, defaultTestTurnaround: value?.toString() || '24' })}
                min={1}
                max={720}
                placeholder="24"
                helpText="Specify exact hours if none of the presets match your needs"
                icon={Timer}
              />
            </div>

            {/* Patient Communication Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary-500" />
                Patient Communication
              </h4>
              
              <CheckboxCardField
                label="Communication Channels"
                name="communicationOptions"
                options={communicationOptions}
                value={formData.communicationOptions}
                onChange={(value) => setFormData({ ...formData, communicationOptions: value })}
                columns={2}
                cardSize="sm"
                helpText="Select how you want to communicate with patients"
              />
            </div>

            {/* Result Management Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FileCheck className="h-5 w-5 mr-2 text-primary-500" />
                Result Management
              </h4>
              
              <CheckboxCardField
                label="Result Processing Rules"
                name="resultManagementOptions"
                options={resultManagementOptions}
                value={formData.resultManagementOptions}
                onChange={(value) => setFormData({ ...formData, resultManagementOptions: value })}
                columns={2}
                cardSize="sm"
                helpText="Define how test results should be processed and validated"
              />
            </div>

            {/* Report Customization Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <LayoutTemplate className="h-5 w-5 mr-2 text-primary-500" />
                Report Customization
              </h4>
              
              <RichTextEditorFieldV2
                label="Custom Report Header"
                name="customReportHeader"
                value={formData.customReportHeader}
                onChange={(value) => setFormData({ ...formData, customReportHeader: value })}
                placeholder="Enter text to appear at the top of all patient reports (e.g., lab motto, certification info)"
                rows={3}
                helpText="This text will appear on all generated reports. Full rich text formatting available."
                toolbar="full"
              />
              
              <RichTextEditorFieldV2
                label="Custom Report Footer"
                name="customReportFooter"
                value={formData.customReportFooter}
                onChange={(value) => setFormData({ ...formData, customReportFooter: value })}
                placeholder="Enter text for report footer (e.g., disclaimer, contact information)"
                rows={3}
                helpText="Footer text for all reports. Full rich text formatting available."
                toolbar="full"
              />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Laboratory
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Set up your laboratory organization step by step
          </p>
        </div>

        {/* Progress Steps - Responsive */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max sm:min-w-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.includes(index);
              const isClickable = isCompleted || index === currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs sm:text-sm font-medium ${
                          isActive
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        <span className="hidden sm:inline">{step.title}</span>
                        <span className="sm:hidden">{step.shortTitle || step.title}</span>
                      </p>
                      <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-12 sm:w-24 mx-2 sm:mx-4 transition-colors ${
                        completedSteps.includes(index) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Auto-save indicator */}
          {isSaving && (
            <div className="mt-4 flex items-center justify-end text-sm text-gray-500">
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </div>
          )}
          {!isSaving && lastSaved && (
            <div className="mt-4 flex items-center justify-end text-sm text-gray-500">
              <Save className="h-4 w-4 mr-1" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {steps[currentStep].title}
          </h2>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <button
            onClick={handleBack}
            className="btn btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentStep === 0 ? 'Back to Options' : 'Previous'}
          </button>

          <button
            onClick={handleNext}
            disabled={isCreating || isSaving}
            className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
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

export default SetupLaboratoryPageV2;