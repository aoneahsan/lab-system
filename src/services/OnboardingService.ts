import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { onboardingLogger } from '@/services/logger.service';

export interface OnboardingData {
  userId: string;
  currentStep: number;
  completedSteps: number[];
  stepCompletionDates: Record<number, Date>; // Track when each step was completed
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
      onboardingLogger.error('Error getting onboarding progress:', error);
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
      
      // Check if all previous steps are completed before allowing this save
      if (markAsComplete && step > 0) {
        for (let i = 0; i < step; i++) {
          if (!existingData?.completedSteps?.includes(i)) {
            throw new Error(`Cannot complete step ${step + 1} without completing step ${i + 1} first`);
          }
        }
      }
      
      // Keep existing completed steps and timestamps
      let completedSteps = existingData?.completedSteps || [];
      const stepCompletionDates = existingData?.stepCompletionDates || {};
      
      // Only add to completed steps if explicitly marking as complete AND validation passes
      if (markAsComplete) {
        const validation = this.validateStepData(step, stepData);
        if (validation.isValid && !completedSteps.includes(step)) {
          completedSteps.push(step);
          completedSteps = completedSteps.sort((a, b) => a - b);
          stepCompletionDates[step] = new Date();
        } else if (!validation.isValid) {
          // If validation fails, remove this step from completed if it was there
          completedSteps = completedSteps.filter(s => s !== step);
          delete stepCompletionDates[step];
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      const updatedData: OnboardingData = {
        userId,
        currentStep: Math.max(step, existingData?.currentStep || 0),
        completedSteps,
        stepCompletionDates,
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
      onboardingLogger.error('Error saving step progress:', error);
      // Re-throw the error so the UI can handle it
      throw error;
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
      const existingData = await this.getProgress(userId);
      
      // Ensure all steps are actually completed
      if (!existingData || existingData.completedSteps.length !== this.TOTAL_STEPS) {
        throw new Error('Cannot complete onboarding without finishing all steps');
      }
      
      // Use setDoc with merge to handle both existing and non-existing documents
      await setDoc(docRef, {
        ...existingData,
        isComplete: true,
        completedAt: serverTimestamp(),
        completedSteps: [0, 1, 2, 3, 4],
        currentStep: 4,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      // Clear from localStorage after completion
      this.clearLocalStorage();
    } catch (error) {
      onboardingLogger.error('Error completing onboarding:', error);
      throw error;
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
        
      case 2: { // Contact
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) errors.push('Valid email is required');
        if (!data.phone || data.phone.replace(/\D/g, '').length < 10) errors.push('Valid phone number is required (min 10 digits)');
        break;
      }
        
      case 3: // Settings
        if (!data.timezone) errors.push('Timezone is required');
        if (!data.currency) errors.push('Currency is required');
        if (!data.resultFormat) errors.push('Result format is required');
        if (!data.enabledFeatures || data.enabledFeatures.length === 0) errors.push('At least one feature must be enabled');
        break;
        
      case 4: { // Custom Configuration
        // At least some configuration should be provided
        const hasCustomConfig = 
          (data.defaultTestTurnaround && data.defaultTestTurnaround !== '24') ||
          (data.referenceLabName && data.referenceLabName.trim().length > 0) ||
          (data.referenceLabContact && data.referenceLabContact.trim().length > 0) ||
          (data.customReportHeader && data.customReportHeader.trim().length > 0) ||
          (data.customReportFooter && data.customReportFooter.trim().length > 0) ||
          (data.communicationOptions && data.communicationOptions.length > 0) ||
          (data.resultManagementOptions && data.resultManagementOptions.length > 0) ||
          (data.defaultTurnaroundMode && data.defaultTurnaroundMode !== 'standard');
        
        if (!hasCustomConfig) {
          errors.push('Please configure at least one custom setting');
        }
        break;
      }
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
    laboratoryData: Partial<OnboardingData['laboratoryData']>,
    stepCompletionDates?: Record<number, Date>
  ): Promise<number[]> {
    const validatedSteps: number[] = [];
    
    // Only validate steps that have timestamps AND valid data
    for (let step = 0; step < this.TOTAL_STEPS; step++) {
      // Skip if no timestamp exists for this step
      if (stepCompletionDates && !stepCompletionDates[step]) {
        continue;
      }
      
      const stepData = this.extractStepData(step, laboratoryData);
      
      // Check if step has actual data (not just empty/default values)
      const hasData = this.stepHasActualData(step, stepData);
      if (!hasData) continue;
      
      const validation = this.validateStepData(step, stepData);
      
      if (validation.isValid) {
        // Ensure all previous steps are also validated
        let canInclude = true;
        for (let i = 0; i < step; i++) {
          if (!validatedSteps.includes(i)) {
            canInclude = false;
            break;
          }
        }
        
        if (canInclude) {
          validatedSteps.push(step);
        }
      }
    }
    
    return validatedSteps;
  }

  /**
   * Check if step has actual data (not just empty/default values)
   */
  private stepHasActualData(step: number, data: any): boolean {
    if (!data) return false;
    
    switch (step) {
      case 0:
        return Boolean(data.code && data.name && data.type);
      case 1:
        return Boolean(data.street && data.city && data.state && data.zipCode);
      case 2:
        return Boolean(data.email && data.phone);
      case 3:
        return Boolean(data.timezone && data.currency && data.enabledFeatures?.length > 0);
      case 4:
        return Boolean(
          data.referenceLabName || 
          data.referenceLabContact || 
          data.customReportHeader || 
          data.customReportFooter ||
          (data.communicationOptions && data.communicationOptions.length > 0) ||
          (data.resultManagementOptions && data.resultManagementOptions.length > 0)
        );
      default:
        return false;
    }
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
      onboardingLogger.error('Error clearing onboarding data:', error);
      this.clearLocalStorage();
    }
  }

  /**
   * Clean invalid onboarding data (remove improperly saved steps)
   */
  async cleanInvalidData(userId: string): Promise<void> {
    try {
      const progress = await this.getProgress(userId);
      if (!progress) return;

      // Revalidate and clean up
      const validSteps = await this.revalidateCompletedSteps(
        userId,
        progress.laboratoryData,
        progress.stepCompletionDates
      );

      // Update with only valid steps using setDoc with merge
      const docRef = doc(firestore, this.COLLECTION_NAME, userId);
      await setDoc(docRef, {
        ...progress,
        completedSteps: validSteps,
        currentStep: validSteps.length > 0 ? Math.max(...validSteps) : 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      onboardingLogger.error('Error cleaning invalid data:', error);
    }
  }

  /**
   * Local Storage helpers
   */
  private saveToLocalStorage(data: OnboardingData): void {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      onboardingLogger.error('Error saving to localStorage:', error);
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
      onboardingLogger.error('Error reading from localStorage:', error);
    }
    return null;
  }

  private clearLocalStorage(): void {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    } catch (error) {
      onboardingLogger.error('Error clearing localStorage:', error);
    }
  }
}

export const onboardingService = new OnboardingService();
export default onboardingService;