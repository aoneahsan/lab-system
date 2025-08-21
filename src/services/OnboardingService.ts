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
        if (!data.code) errors.push('Laboratory code is required');
        if (!data.name) errors.push('Laboratory name is required');
        if (!data.type) errors.push('Laboratory type is required');
        break;
        
      case 1: // Address
        if (!data.street) errors.push('Street address is required');
        if (!data.city) errors.push('City is required');
        if (!data.state) errors.push('State is required');
        if (!data.zipCode) errors.push('ZIP code is required');
        if (!data.country) errors.push('Country is required');
        break;
        
      case 2: // Contact
        if (!data.email) errors.push('Email is required');
        if (!data.phone) errors.push('Phone number is required');
        break;
        
      case 3: // Settings
        if (!data.timezone) errors.push('Timezone is required');
        if (!data.currency) errors.push('Currency is required');
        break;
        
      case 4: // Custom Configuration
        // Optional fields, no validation required
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
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