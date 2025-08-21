import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';

export interface OnboardingData {
  userId: string;
  currentStep: number;
  completedSteps: number[];
  isComplete: boolean;
  startedAt: Date;
  completedAt?: Date;
  laboratoryData: {
    // Basic Info (Step 0)
    code?: string;
    name?: string;
    type?: string;
    licenseNumber?: string;
    accreditationNumber?: string;
    
    // Address (Step 1)
    street?: string;
    city?: string;
    cityId?: string;
    state?: string;
    stateId?: string;
    zipCode?: string;
    country?: string;
    countryId?: string;
    
    // Contact (Step 2)
    email?: string;
    phone?: string;
    fax?: string;
    website?: string;
    
    // Settings (Step 3)
    timezone?: string;
    currency?: string;
    resultFormat?: string;
    enabledFeatures?: string[];
    
    // Custom Configuration (Step 4)
    defaultTestTurnaround?: string;
    referenceLabName?: string;
    referenceLabContact?: string;
    customReportHeader?: string;
    customReportFooter?: string;
    communicationOptions?: string[];
    resultManagementOptions?: string[];
    defaultTurnaroundMode?: string;
  };
}

class OnboardingService {
  private readonly COLLECTION_NAME = 'onboarding_progress';
  private readonly LOCAL_STORAGE_KEY = 'labflow_onboarding';
  private readonly TOTAL_STEPS = 5;

  /**
   * Get onboarding progress for a user
   */
  async getProgress(userId: string): Promise<OnboardingData | null> {
    try {
      // Try to get from Firestore first
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as OnboardingData;
        // Also save to localStorage for offline access
        this.saveToLocalStorage(data);
        return data;
      }
      
      // Fallback to localStorage if not in Firestore
      return this.getFromLocalStorage(userId);
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      // Fallback to localStorage on error
      return this.getFromLocalStorage(userId);
    }
  }

  /**
   * Save progress for a specific step
   */
  async saveStepProgress(
    userId: string,
    step: number,
    stepData: Partial<OnboardingData['laboratoryData']>,
    markAsComplete: boolean = true
  ): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      const existingData = await this.getProgress(userId);
      
      // Keep existing completed steps
      let completedSteps = existingData?.completedSteps || [];
      
      // Only add to completed steps if explicitly marking as complete AND validation passes
      if (markAsComplete) {
        const validation = this.validateStepData(step, stepData);
        if (validation.isValid && !completedSteps.includes(step)) {
          completedSteps.push(step);
          completedSteps = completedSteps.sort((a, b) => a - b);
        } else if (!validation.isValid) {
          // If validation fails, remove this step from completed if it was there
          completedSteps = completedSteps.filter(s => s !== step);
        }
      }
      
      const updatedData: OnboardingData = {
        userId,
        currentStep: Math.max(step, existingData?.currentStep || 0),
        completedSteps,
        isComplete: false,
        startedAt: existingData?.startedAt || new Date(),
        laboratoryData: {
          ...existingData?.laboratoryData,
          ...stepData,
        },
      };
      
      // Save to Firestore
      await setDoc(docRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // Also save to localStorage
      this.saveToLocalStorage(updatedData);
    } catch (error) {
      console.error('Error saving step progress:', error);
      // Save to localStorage as fallback
      const existingData = this.getFromLocalStorage(userId);
      const completedSteps = existingData?.completedSteps || [];
      
      // Only add to completed steps if markAsComplete is true and validation passes
      if (markAsComplete && !completedSteps.includes(step)) {
        const validation = this.validateStepData(step, stepData);
        if (validation.isValid) {
          completedSteps.push(step);
        }
      }
      
      const updatedData: OnboardingData = {
        userId,
        currentStep: Math.max(step, existingData?.currentStep || 0),
        completedSteps: completedSteps.sort((a, b) => a - b),
        isComplete: false,
        startedAt: existingData?.startedAt || new Date(),
        laboratoryData: {
          ...existingData?.laboratoryData,
          ...stepData,
        },
      };
      
      this.saveToLocalStorage(updatedData);
    }
  }

  /**
   * Save data without marking step as complete (for auto-save)
   */
  async saveStepData(
    userId: string,
    step: number,
    stepData: Partial<OnboardingData['laboratoryData']>
  ): Promise<void> {
    return this.saveStepProgress(userId, step, stepData, false);
  }

  /**
   * Mark onboarding as complete
   */
  async completeOnboarding(userId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      
      await updateDoc(docRef, {
        isComplete: true,
        completedAt: serverTimestamp(),
        completedSteps: [0, 1, 2, 3, 4],
        currentStep: 4,
      });
      
      // Clear from localStorage after completion
      this.clearLocalStorage();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Update localStorage
      const existingData = this.getFromLocalStorage(userId);
      if (existingData) {
        existingData.isComplete = true;
        existingData.completedAt = new Date();
        existingData.completedSteps = [0, 1, 2, 3, 4];
        existingData.currentStep = 4;
        this.saveToLocalStorage(existingData);
      }
    }
  }

  /**
   * Check if onboarding is complete
   */
  async isOnboardingComplete(userId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    return progress?.isComplete || false;
  }

  /**
   * Get the next incomplete step
   */
  async getNextIncompleteStep(userId: string): Promise<number> {
    const progress = await this.getProgress(userId);
    
    if (!progress) {
      return 0; // Start from the beginning
    }
    
    if (progress.isComplete) {
      return -1; // All steps complete
    }
    
    // Find the first step that's not completed
    for (let i = 0; i < this.TOTAL_STEPS; i++) {
      if (!progress.completedSteps.includes(i)) {
        return i;
      }
    }
    
    // If all steps are marked complete but onboarding isn't complete,
    // return the last step
    return this.TOTAL_STEPS - 1;
  }

  /**
   * Validate step data before saving
   */
  validateStepData(step: number, data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (step) {
      case 0: // Basic Info
        if (!data.code || data.code.length < 3) errors.push('Laboratory code must be at least 3 characters');
        if (!data.name || data.name.trim().length < 3) errors.push('Laboratory name must be at least 3 characters');
        if (!data.type) errors.push('Laboratory type is required');
        break;
        
      case 1: // Address
        if (!data.street || data.street.trim().length < 5) errors.push('Street address must be at least 5 characters');
        if (!data.city || !data.cityId) errors.push('City is required');
        if (!data.state || !data.stateId) errors.push('State is required');
        if (!data.zipCode || data.zipCode.trim().length < 3) errors.push('ZIP code must be at least 3 characters');
        if (!data.country || !data.countryId) errors.push('Country is required');
        break;
        
      case 2: // Contact
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) errors.push('Valid email is required');
        if (!data.phone || data.phone.replace(/\D/g, '').length < 10) errors.push('Valid phone number is required (min 10 digits)');
        break;
        
      case 3: // Settings
        if (!data.timezone) errors.push('Timezone is required');
        if (!data.currency) errors.push('Currency is required');
        if (!data.resultFormat) errors.push('Result format is required');
        if (!data.enabledFeatures || data.enabledFeatures.length === 0) errors.push('At least one feature must be enabled');
        break;
        
      case 4: // Custom Configuration
        // All fields are optional in this step
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Re-validate all completed steps (useful after loading saved data)
   */
  async revalidateCompletedSteps(
    userId: string, 
    laboratoryData: Partial<OnboardingData['laboratoryData']>
  ): Promise<number[]> {
    const validatedSteps: number[] = [];
    
    for (let step = 0; step < this.TOTAL_STEPS; step++) {
      const stepData = this.extractStepData(step, laboratoryData);
      const validation = this.validateStepData(step, stepData);
      
      if (validation.isValid) {
        validatedSteps.push(step);
      }
    }
    
    return validatedSteps;
  }

  /**
   * Extract data for a specific step from laboratory data
   */
  private extractStepData(
    step: number, 
    laboratoryData: Partial<OnboardingData['laboratoryData']>
  ): any {
    switch (step) {
      case 0:
        return {
          code: laboratoryData.code,
          name: laboratoryData.name,
          type: laboratoryData.type,
          licenseNumber: laboratoryData.licenseNumber,
          accreditationNumber: laboratoryData.accreditationNumber,
        };
      case 1:
        return {
          street: laboratoryData.street,
          city: laboratoryData.city,
          cityId: laboratoryData.cityId,
          state: laboratoryData.state,
          stateId: laboratoryData.stateId,
          zipCode: laboratoryData.zipCode,
          country: laboratoryData.country,
          countryId: laboratoryData.countryId,
        };
      case 2:
        return {
          email: laboratoryData.email,
          phone: laboratoryData.phone,
          fax: laboratoryData.fax,
          website: laboratoryData.website,
        };
      case 3:
        return {
          timezone: laboratoryData.timezone,
          currency: laboratoryData.currency,
          resultFormat: laboratoryData.resultFormat,
          enabledFeatures: laboratoryData.enabledFeatures,
        };
      case 4:
        return {
          defaultTestTurnaround: laboratoryData.defaultTestTurnaround,
          referenceLabName: laboratoryData.referenceLabName,
          referenceLabContact: laboratoryData.referenceLabContact,
          customReportHeader: laboratoryData.customReportHeader,
          customReportFooter: laboratoryData.customReportFooter,
          communicationOptions: laboratoryData.communicationOptions,
          resultManagementOptions: laboratoryData.resultManagementOptions,
          defaultTurnaroundMode: laboratoryData.defaultTurnaroundMode,
        };
      default:
        return {};
    }
  }

  /**
   * Clear onboarding data (for testing or reset)
   */
  async clearOnboardingData(userId: string): Promise<void> {
    try {
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      await deleteDoc(docRef);
      this.clearLocalStorage();
    } catch (error) {
      console.error('Error clearing onboarding data:', error);
      this.clearLocalStorage();
    }
  }

  /**
   * Local Storage helpers
   */
  private saveToLocalStorage(data: OnboardingData): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private getFromLocalStorage(userId: string): OnboardingData | null {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as OnboardingData;
        // Verify it's for the correct user
        if (data.userId === userId) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return null;
  }

  private clearLocalStorage(): void {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

export const onboardingService = new OnboardingService();
export default onboardingService;