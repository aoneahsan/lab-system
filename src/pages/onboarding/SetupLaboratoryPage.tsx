import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Building2, MapPin, Phone, Globe, Settings, Check, FileText,
  CreditCard, Package, CheckCircle, Wifi, Smartphone, Bell, BarChart3, Users,
  Mail, MessageSquare, FileBarChart, Shield, Clock, Zap,
  FlaskConical, Building, PhoneCall, UserCheck, ClipboardCheck, AlertCircle,
  FileCheck, Bot, Timer, SendHorizontal, Database, LayoutTemplate, Lock
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SelectField } from '@/components/form-fields/SelectField';
import { CountryField, StateField, CityField } from '@/components/form-fields/CountryField';
import { PhoneField } from '@/components/form-fields/PhoneField';
import { EmailField } from '@/components/form-fields/EmailField';
import { ZipCodeField, UrlField } from '@/components/form-fields/SpecializedFields';
import { TextField } from '@/components/form-fields/TextField';
import { RichTextEditorField } from '@/components/form-fields/RichTextEditorField';
import { FeatureToggleField, FeatureOption } from '@/components/form-fields/FeatureToggleField';
import { CheckboxCardField, CheckboxOption } from '@/components/form-fields/CheckboxCardField';
import { RadioCardField, RadioOption } from '@/components/form-fields/RadioCardField';
import { NumberField } from '@/components/form-fields/NumberField';
import { KeyboardShortcutsHelper, useKeyboardShortcuts, KeyboardShortcut } from '@/components/ui/KeyboardShortcutsHelper';
import { scrollToFirstError } from '@/components/form-fields/FieldError';

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
  {
    id: 'custom',
    title: 'Custom Configuration',
    description: 'Additional fields and preferences',
    icon: FileText,
  },
];

const SetupLaboratoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuthStore();
  const { 
    initializeOnboarding, 
    navigateToStep, 
    saveStepData,
    canAccessStep,
    completedSteps,
    laboratoryData: savedData,
    isLoading: isLoadingOnboarding,
    isSaving
  } = useOnboardingStore();
  
  // Get initial step from URL
  const stepFromUrl = parseInt(searchParams.get('step') || '0');
  const [currentStep, setCurrentStep] = useState(stepFromUrl);
  const [isCreating, setIsCreating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize onboarding data on component mount
  useEffect(() => {
    if (currentUser?.id && !isInitialized) {
      const initOnboarding = async () => {
        // Clear local storage to start fresh
        useOnboardingStore.getState().clearOnboarding();
        
        // Clean any invalid data and initialize
        await initializeOnboarding(currentUser.id);
        setIsInitialized(true);
      };
      
      initOnboarding();
    }
  }, [currentUser?.id, initializeOnboarding, isInitialized]);

  // Check step access and set current step
  useEffect(() => {
    if (isInitialized) {
      // Allow navigation to completed steps or the next step
      const isStepAccessible = stepFromUrl === 0 || 
                               completedSteps.includes(stepFromUrl) || 
                               (stepFromUrl > 0 && completedSteps.includes(stepFromUrl - 1));
      
      if (isStepAccessible) {
        setCurrentStep(stepFromUrl);
      } else if (stepFromUrl > 0 && !completedSteps.includes(stepFromUrl - 1)) {
        // Only show error if trying to skip ahead
        const nextAvailableStep = completedSteps.length;
        toast.error(
          'Complete previous steps',
          `Please complete step ${nextAvailableStep + 1} first`
        );
        setCurrentStep(nextAvailableStep);
        setSearchParams({ step: nextAvailableStep.toString() });
      }
    }
  }, [stepFromUrl, completedSteps, isInitialized, setSearchParams]);

  // Update URL when step changes
  useEffect(() => {
    setSearchParams({ step: currentStep.toString() });
  }, [currentStep, setSearchParams]);
  
  const [formData, setFormData] = useState({
    code: savedData?.code || '',
    name: savedData?.name || '',
    type: savedData?.type || 'clinical_lab',
    licenseNumber: savedData?.licenseNumber || '',
    accreditationNumber: savedData?.accreditationNumber || '',
    street: savedData?.street || '',
    city: savedData?.city || '',
    cityId: savedData?.cityId || '',
    state: savedData?.state || '',
    stateId: savedData?.stateId || '',
    zipCode: savedData?.zipCode || '',
    country: savedData?.country || 'USA',
    countryId: savedData?.countryId || '233',  // USA country ID for react-country-state-city
    email: savedData?.email || '',
    phone: savedData?.phone || '',
    fax: savedData?.fax || '',
    website: savedData?.website || '',
    timezone: savedData?.timezone || 'America/New_York',
    currency: savedData?.currency || 'USD',
    resultFormat: savedData?.resultFormat || 'standard',
    criticalValueNotification: true,
    billing: true,
    inventory: true,
    qualityControl: true,
    emrIntegration: true,
    mobileApps: true,
    // Custom configuration fields
    defaultTestTurnaround: savedData?.defaultTestTurnaround || '24',
    referenceLabName: savedData?.referenceLabName || '',
    referenceLabContact: savedData?.referenceLabContact || '',
    customReportHeader: savedData?.customReportHeader || '',
    customReportFooter: savedData?.customReportFooter || '',
    // Features as array for FeatureToggleField
    enabledFeatures: savedData?.enabledFeatures || ['billing', 'inventory', 'qualityControl', 'emrIntegration', 'mobileApps', 'criticalAlerts'],
    // New fields for step 4
    communicationOptions: savedData?.communicationOptions || ['patientPortal', 'emailNotifications'],
    resultManagementOptions: savedData?.resultManagementOptions || [],
    defaultTurnaroundMode: savedData?.defaultTurnaroundMode || 'standard',
  });

  // Update formData when savedData changes
  useEffect(() => {
    if (savedData && Object.keys(savedData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...savedData,
      }));
    }
  }, [savedData]);

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
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0: // Basic Info
        if (!formData.code) errors.code = 'Laboratory code is required';
        if (!formData.name) errors.name = 'Laboratory name is required';
        if (!formData.type) errors.type = 'Laboratory type is required';
        if (formData.code && !codeValidation.isAvailable) {
          errors.code = 'This code is already taken';
        }
        break;
        
      case 1: // Address
        if (!formData.street) errors.street = 'Street address is required';
        if (!formData.city) errors.city = 'City is required';
        if (!formData.state) errors.state = 'State is required';
        if (!formData.zipCode) errors.zipCode = 'ZIP code is required';
        if (!formData.country) errors.country = 'Country is required';
        break;
        
      case 2: // Contact
        if (!formData.email) errors.email = 'Email is required';
        if (!formData.phone) errors.phone = 'Phone number is required';
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
        
      case 3: // Settings
        if (!formData.timezone) errors.timezone = 'Timezone is required';
        if (!formData.currency) errors.currency = 'Currency is required';
        if (!formData.resultFormat) errors.resultFormat = 'Result format is required';
        if (!formData.enabledFeatures || formData.enabledFeatures.length === 0) {
          errors.features = 'Please select at least one feature to enable';
        }
        break;
        
      case 4: // Custom Configuration
        // At least some configuration should be provided
        const hasConfig = 
          formData.referenceLabName?.trim() ||
          formData.referenceLabContact?.trim() ||
          formData.customReportHeader?.trim() ||
          formData.customReportFooter?.trim() ||
          (formData.communicationOptions && formData.communicationOptions.length > 0) ||
          (formData.resultManagementOptions && formData.resultManagementOptions.length > 0);
        
        if (!hasConfig) {
          errors.configuration = 'Please configure at least one custom setting';
        }
        break;
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Show toast with summary
      const errorCount = Object.keys(errors).length;
      toast.error(
        'Validation failed', 
        `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} in the form`
      );
      
      // Scroll to first error
      setTimeout(() => scrollToFirstError(errors), 100);
      
      return false;
    }
    
    return true;
  };

  const handleNext = async () => {
    if (!currentUser?.id) {
      toast.error('Authentication required', 'Please log in to continue');
      return;
    }

    if (validateCurrentStep()) {
      try {
        // Get all form data for the current step
        const stepData = getStepData(currentStep);
        
        // Save and mark as complete
        await saveStepData(currentStep, stepData, currentUser.id, true);
        
        // Only navigate if save was successful
        if (currentStep < steps.length - 1) {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
        } else {
          // Last step - create the laboratory
          await handleSubmit();
        }
      } catch (error: any) {
        console.error('Error saving step:', error);
        toast.error('Save failed', error.message || 'Could not save your progress');
      }
    }
  };

  // Helper function to extract step data
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

  const handleBack = async () => {
    if (currentStep > 0) {
      // Save current step data without marking as complete (draft save)
      if (currentUser?.id) {
        const stepData = getStepData(currentStep);
        await saveStepData(currentStep, stepData, currentUser.id, false);
      }
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/onboarding?option=create');
    }
  };

  // Define keyboard shortcuts for this form
  const formShortcuts: KeyboardShortcut[] = [
    { key: 's', modifier: 'ctrl', description: 'Save current step', category: 'form' },
    { key: 'enter', modifier: 'ctrl', description: 'Save and continue to next step', category: 'form' },
    { key: 'ArrowLeft', modifier: 'alt', description: 'Go to previous step', category: 'navigation' },
    { key: 'ArrowRight', modifier: 'alt', description: 'Go to next step', category: 'navigation' },
    { key: '1', modifier: 'alt', description: 'Go to Step 1', category: 'navigation' },
    { key: '2', modifier: 'alt', description: 'Go to Step 2', category: 'navigation' },
    { key: '3', modifier: 'alt', description: 'Go to Step 3', category: 'navigation' },
    { key: '4', modifier: 'alt', description: 'Go to Step 4', category: 'navigation' },
    { key: '5', modifier: 'alt', description: 'Go to Step 5', category: 'navigation' },
    { key: 'r', modifier: 'ctrl', description: 'Reset current step', category: 'form' },
    { key: 'escape', description: 'Cancel and go back', category: 'navigation' },
  ];

  // Setup keyboard shortcut handlers
  const shortcutHandlers = {
    's': () => {
      // Save current step without advancing
      if (validateCurrentStep()) {
        const stepData = getStepData(currentStep);
        saveStepData(currentStep, stepData, currentUser?.id || '', false);
        toast.success('Saved', 'Progress saved successfully');
      }
    },
    'enter': () => handleNext(),
    'ArrowLeft': () => handleBack(),
    'ArrowRight': () => {
      if (completedSteps.includes(currentStep)) {
        handleNext();
      }
    },
    '1': () => currentStep !== 0 && completedSteps.includes(0) && setCurrentStep(0),
    '2': () => currentStep !== 1 && completedSteps.includes(1) && setCurrentStep(1),
    '3': () => currentStep !== 2 && completedSteps.includes(2) && setCurrentStep(2),
    '4': () => currentStep !== 3 && completedSteps.includes(3) && setCurrentStep(3),
    '5': () => currentStep !== 4 && completedSteps.includes(4) && setCurrentStep(4),
    'r': () => {
      if (confirm('Are you sure you want to reset this step?')) {
        // Reset to saved data or defaults
        window.location.reload();
      }
    },
    'escape': () => handleBack(),
  };

  // Enable keyboard shortcuts
  useKeyboardShortcuts(formShortcuts, shortcutHandlers, !isCreating && !isSaving);

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
          defaultTestTurnaround: parseInt(formData.defaultTestTurnaround) || 24,
          autoReleaseNormalResults: formData.autoReleaseNormalResults,
          requirePhysicianApproval: formData.requirePhysicianApproval,
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
            <div className="relative">
              <TextField
                label="Laboratory Code"
                name="code"
                value={formData.code}
                onChange={handleCodeChange}
                placeholder="e.g., LAB001"
                required
                minLength={3}
                maxLength={10}
                error={fieldErrors.code || (!codeValidation.isAvailable && formData.code ? codeValidation.message : undefined)}
                helpText="A unique 3-10 character code for your laboratory"
              />
              {formData.code && (
                <div className="absolute top-8 right-3">
                  {codeValidation.isChecking ? (
                    <LoadingSpinner size="sm" />
                  ) : codeValidation.isAvailable ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : null}
                </div>
              )}
            </div>

            <TextField
              label="Laboratory Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Central Medical Laboratory"
              required
              error={fieldErrors.name}
            />

            <SelectField
              label="Laboratory Type"
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
              error={fieldErrors.type}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              label="Street Address"
              name="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="123 Medical Center Drive"
              required
              error={fieldErrors.street}
            />

            <CountryField
              label="Country"
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
              error={fieldErrors.country}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StateField
                label="State/Province"
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
                error={fieldErrors.state}
              />
              
              <CityField
                label="City"
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
                error={fieldErrors.city}
              />
            </div>

            <ZipCodeField
              label="ZIP/Postal Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              country={formData.country === 'United States' ? 'US' : formData.country === 'Canada' ? 'CA' : formData.country === 'United Kingdom' ? 'UK' : 'US'}
              required
              error={fieldErrors.zipCode}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <EmailField
              label="Contact Email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@laboratory.com"
              required
              error={fieldErrors.email}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PhoneField
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                country={formData.country === 'United States' ? 'US' : formData.country === 'Canada' ? 'CA' : formData.country === 'United Kingdom' ? 'GB' : 'US'}
                required
                error={fieldErrors.phone}
              />
              <PhoneField
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                columns={1}
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
              
              <RichTextEditorField
                label="Custom Report Header"
                name="customReportHeader"
                value={formData.customReportHeader}
                onChange={(value) => setFormData({ ...formData, customReportHeader: value })}
                placeholder="Enter text to appear at the top of all patient reports (e.g., lab motto, certification info)"
                rows={3}
                helpText="This text will appear on all generated reports. Full rich text formatting available."
                toolbar="full"
              />
              
              <RichTextEditorField
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcutsHelper 
        shortcuts={formShortcuts} 
        type="form" 
        title="Onboarding Form Shortcuts"
        position="top-right"
      />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:max-w-6xl 2xl:max-w-7xl">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-fit">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.includes(index);
              const isAccessible = index === 0 || completedSteps.includes(index - 1);
              const isNext = !isCompleted && isAccessible;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div 
                    className={`flex flex-col items-center min-w-[80px] sm:min-w-[100px] lg:min-w-[120px] ${
                      isCompleted || (index === 0) || (index === completedSteps.length && completedSteps.includes(index - 1)) 
                        ? 'cursor-pointer' 
                        : 'cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => {
                      // Only allow clicking on completed steps or the next available step
                      if (isCompleted) {
                        setCurrentStep(index);
                      } else if (index === 0) {
                        setCurrentStep(0);
                      } else if (index === completedSteps.length && completedSteps.includes(index - 1)) {
                        setCurrentStep(index);
                      } else {
                        const nextStep = completedSteps.length;
                        toast.error(
                          'Complete previous steps',
                          `Please complete step ${nextStep + 1} first`
                        );
                      }
                    }}
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                        isActive
                          ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : isNext
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>
                    <div className="mt-2 text-center px-1 sm:px-2">
                      <p
                        className={`text-xs sm:text-sm font-medium ${
                          isActive
                            ? 'text-primary-600 dark:text-primary-400'
                            : isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 hidden md:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 max-w-[100px] px-2">
                      <div
                        className={`h-0.5 w-full transition-colors ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 lg:p-10 mb-8">
          {isLoadingOnboarding ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your progress...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {steps[currentStep].title}
              </h2>
              {renderStepContent()}
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={isLoadingOnboarding || isSaving}
            className="btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            {currentStep === 0 ? 'Back to Options' : 'Previous'}
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Progress indicator */}
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
              Step {currentStep + 1} of {steps.length}
              {completedSteps.includes(currentStep) && (
                <span className="ml-2 text-green-600 dark:text-green-400">✓ Completed</span>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={isCreating || isSaving || isLoadingOnboarding}
              className="btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isCreating || isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  {isCreating ? 'Creating Laboratory...' : 'Saving...'}
                </>
              ) : currentStep === steps.length - 1 ? (
                <>
                  Create Laboratory
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  {completedSteps.includes(currentStep) ? 'Next' : 'Save & Continue'}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupLaboratoryPage;