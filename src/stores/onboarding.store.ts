import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import onboardingService, { OnboardingData } from '@/services/OnboardingService';
import { toast } from '@/stores/toast.store';

interface OnboardingStore {
  // State
  isLoading: boolean;
  isSaving: boolean;
  currentStep: number;
  completedSteps: number[];
  laboratoryData: Partial<OnboardingData['laboratoryData']>;
  validationErrors: Record<number, string[]>;
  isStepAccessAllowed: boolean;
  
  // Actions
  initializeOnboarding: (userId: string) => Promise<void>;
  navigateToStep: (step: number, userId: string) => Promise<boolean>;
  saveStepData: (step: number, data: Partial<OnboardingData['laboratoryData']>, userId: string, markComplete?: boolean) => Promise<void>;
  validateStep: (step: number, data?: Partial<OnboardingData['laboratoryData']>) => { isValid: boolean; errors: string[] };
  validateAllPreviousSteps: (targetStep: number) => boolean;
  canAccessStep: (step: number) => boolean;
  getNextIncompleteStep: () => number;
  resetValidationErrors: (step?: number) => void;
  clearOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isLoading: false,
        isSaving: false,
        currentStep: 0,
        completedSteps: [],
        laboratoryData: {},
        validationErrors: {},
        isStepAccessAllowed: true,

        // Initialize onboarding data from service
        initializeOnboarding: async (userId: string) => {
          set({ isLoading: true });
          
          try {
            const progress = await onboardingService.getProgress(userId);
            
            if (progress && progress.laboratoryData && Object.keys(progress.laboratoryData).length > 0) {
              // Re-validate all completed steps with current data
              const revalidatedSteps = await onboardingService.revalidateCompletedSteps(
                userId,
                progress.laboratoryData
              );
              
              set({
                currentStep: progress.currentStep,
                completedSteps: revalidatedSteps,
                laboratoryData: progress.laboratoryData,
                isLoading: false,
              });
            } else {
              // New onboarding - start fresh
              set({
                currentStep: 0,
                completedSteps: [],
                laboratoryData: {},
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error initializing onboarding:', error);
            // Start fresh on error
            set({ 
              isLoading: false,
              currentStep: 0,
              completedSteps: [],
              laboratoryData: {},
            });
          }
        },

        // Navigate to a step with validation
        navigateToStep: async (step: number, userId: string) => {
          const state = get();
          
          // Check if user can access this step
          if (!state.canAccessStep(step)) {
            // Find the first incomplete step they should complete
            const nextStep = state.getNextIncompleteStep();
            
            if (nextStep !== -1 && nextStep < step) {
              toast.error(
                'Complete previous steps', 
                `Please complete step ${nextStep + 1} before proceeding to step ${step + 1}`
              );
              return false;
            }
          }
          
          // Allow navigation
          set({ currentStep: step, isStepAccessAllowed: true });
          return true;
        },

        // Save step data with validation
        saveStepData: async (
          step: number, 
          data: Partial<OnboardingData['laboratoryData']>, 
          userId: string,
          markComplete: boolean = false
        ) => {
          set({ isSaving: true });
          
          try {
            const state = get();
            const mergedData = { ...state.laboratoryData, ...data };
            
            // Validate the step data if marking as complete
            if (markComplete) {
              const validation = state.validateStep(step, data);
              
              if (!validation.isValid) {
                set({ 
                  validationErrors: { 
                    ...state.validationErrors, 
                    [step]: validation.errors 
                  },
                  isSaving: false 
                });
                return;
              }
            }
            
            // Save to service
            await onboardingService.saveStepProgress(userId, step, data, markComplete);
            
            // Update local state
            const updatedCompletedSteps = markComplete && !state.completedSteps.includes(step)
              ? [...state.completedSteps, step].sort((a, b) => a - b)
              : state.completedSteps;
            
            set({
              laboratoryData: mergedData,
              completedSteps: updatedCompletedSteps,
              validationErrors: { ...state.validationErrors, [step]: [] },
              isSaving: false,
            });
            
            if (markComplete) {
              toast.success('Step completed', 'Your progress has been saved');
            }
          } catch (error) {
            console.error('Error saving step data:', error);
            toast.error('Save failed', 'Could not save your progress');
            set({ isSaving: false });
          }
        },

        // Validate a specific step
        validateStep: (step: number, data?: Partial<OnboardingData['laboratoryData']>) => {
          const state = get();
          const dataToValidate = data || state.laboratoryData;
          return onboardingService.validateStepData(step, dataToValidate);
        },

        // Validate all previous steps before accessing a step
        validateAllPreviousSteps: (targetStep: number) => {
          const state = get();
          
          // Step 0 is always accessible
          if (targetStep === 0) return true;
          
          // Check if all previous steps are completed
          for (let i = 0; i < targetStep; i++) {
            if (!state.completedSteps.includes(i)) {
              return false;
            }
          }
          
          return true;
        },

        // Check if user can access a specific step
        canAccessStep: (step: number) => {
          const state = get();
          
          // First step is always accessible
          if (step === 0) return true;
          
          // User can access a step if all previous steps are completed
          return state.validateAllPreviousSteps(step);
        },

        // Get the next incomplete step
        getNextIncompleteStep: () => {
          const state = get();
          const totalSteps = 5; // Total number of onboarding steps
          
          for (let i = 0; i < totalSteps; i++) {
            if (!state.completedSteps.includes(i)) {
              return i;
            }
          }
          
          return -1; // All steps completed
        },

        // Reset validation errors
        resetValidationErrors: (step?: number) => {
          const state = get();
          
          if (step !== undefined) {
            set({
              validationErrors: {
                ...state.validationErrors,
                [step]: [],
              },
            });
          } else {
            set({ validationErrors: {} });
          }
        },

        // Clear all onboarding data
        clearOnboarding: () => {
          set({
            isLoading: false,
            isSaving: false,
            currentStep: 0,
            completedSteps: [],
            laboratoryData: {},
            validationErrors: {},
            isStepAccessAllowed: true,
          });
        },
      }),
      {
        name: 'onboarding-store',
        partialize: (state) => ({
          // Only persist current step and laboratory data
          // Completed steps will be revalidated on load
          currentStep: state.currentStep,
          laboratoryData: state.laboratoryData,
        }),
      }
    )
  )
);