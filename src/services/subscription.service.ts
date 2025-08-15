import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import type { SubscriptionPlanFeatures, TwoFactorMethod } from '@/types/two-factor.types';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'basic' | 'professional' | 'enterprise';
  price: number;
  currency: string;
  features: SubscriptionPlanFeatures;
  limits: {
    users: number;
    storage: number; // GB
    apiCalls: number; // per month
    customFields: number;
    reports: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSubscription {
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate?: Date;
  trialEndsAt?: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  customOverrides?: Partial<SubscriptionPlanFeatures>;
}

class SubscriptionService {
  private readonly PLANS_COLLECTION = 'subscriptionPlans';
  private readonly USER_SUBSCRIPTIONS_COLLECTION = 'userSubscriptions';

  // Default subscription plans
  private readonly DEFAULT_PLANS: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Free',
      tier: 'free',
      price: 0,
      currency: 'USD',
      features: {
        twoFactorAuth: {
          enabled: true,
          methods: ['email'],
          maxBackupCodes: 5,
        },
        biometricAuth: false,
        advancedSecurity: false,
        auditLogs: false,
        sessionManagement: false,
      },
      limits: {
        users: 3,
        storage: 1,
        apiCalls: 1000,
        customFields: 5,
        reports: 10,
      },
    },
    {
      name: 'Basic',
      tier: 'basic',
      price: 49,
      currency: 'USD',
      features: {
        twoFactorAuth: {
          enabled: true,
          methods: ['email', 'totp'],
          maxBackupCodes: 10,
        },
        biometricAuth: true,
        advancedSecurity: false,
        auditLogs: true,
        sessionManagement: true,
      },
      limits: {
        users: 10,
        storage: 10,
        apiCalls: 10000,
        customFields: 20,
        reports: 50,
      },
    },
    {
      name: 'Professional',
      tier: 'professional',
      price: 199,
      currency: 'USD',
      features: {
        twoFactorAuth: {
          enabled: true,
          methods: ['email', 'totp', 'sms'],
          maxBackupCodes: 15,
        },
        biometricAuth: true,
        advancedSecurity: true,
        auditLogs: true,
        sessionManagement: true,
      },
      limits: {
        users: 50,
        storage: 100,
        apiCalls: 100000,
        customFields: 100,
        reports: -1, // unlimited
      },
    },
    {
      name: 'Enterprise',
      tier: 'enterprise',
      price: 999,
      currency: 'USD',
      features: {
        twoFactorAuth: {
          enabled: true,
          methods: ['email', 'totp', 'sms'],
          maxBackupCodes: 20,
        },
        biometricAuth: true,
        advancedSecurity: true,
        auditLogs: true,
        sessionManagement: true,
      },
      limits: {
        users: -1, // unlimited
        storage: -1, // unlimited
        apiCalls: -1, // unlimited
        customFields: -1, // unlimited
        reports: -1, // unlimited
      },
    },
  ];

  /**
   * Initialize default subscription plans
   */
  async initializeDefaultPlans(): Promise<void> {
    try {
      // Check if we have permission to write to Firestore
      // If not, we'll just use in-memory defaults
      const testQuery = query(
        collection(firestore, this.PLANS_COLLECTION),
        where('tier', '==', 'test')
      );
      
      await getDocs(testQuery);
      
      // If we get here, we have permissions
      for (const planData of this.DEFAULT_PLANS) {
        const planQuery = query(
          collection(firestore, this.PLANS_COLLECTION),
          where('tier', '==', planData.tier)
        );
        const snapshot = await getDocs(planQuery);

        if (snapshot.empty) {
          await addDoc(collection(firestore, this.PLANS_COLLECTION), {
            ...planData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    } catch (error) {
      // Silent fail - we'll use in-memory defaults
      if ((error as any)?.code !== 'permission-denied') {
        console.error('Error initializing subscription plans:', error);
      }
    }
  }

  /**
   * Get all subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const snapshot = await getDocs(collection(firestore, this.PLANS_COLLECTION));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SubscriptionPlan[];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const docRef = doc(firestore, this.USER_SUBSCRIPTIONS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Return default free subscription without trying to create in Firestore
        // This avoids permission errors
        return {
          userId,
          planId: 'default-free',
          status: 'active',
          startDate: new Date(),
          autoRenew: false,
        };
      }

      return docSnap.data() as UserSubscription;
    } catch (error) {
      // Return default free subscription on any error
      if ((error as any)?.code === 'permission-denied') {
        // Silent fail for permission errors - use defaults
        return {
          userId,
          planId: 'default-free',
          status: 'active',
          startDate: new Date(),
          autoRenew: false,
        };
      }
      console.error('Error fetching user subscription:', error);
      return {
        userId,
        planId: 'default-free',
        status: 'active',
        startDate: new Date(),
        autoRenew: false,
      };
    }
  }

  /**
   * Get user's subscription features
   */
  async getUserSubscriptionFeatures(userId: string): Promise<SubscriptionPlanFeatures> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || subscription.planId === 'default-free') {
        // Return default Professional features for now (all features enabled)
        // In production, this would be based on actual subscription
        return this.DEFAULT_PLANS[2].features; // Professional plan features
      }

      // Get the plan
      const plan = await this.getSubscriptionPlan(subscription.planId);
      
      if (!plan) {
        return this.DEFAULT_PLANS[2].features; // Professional plan features
      }

      // Apply any custom overrides from admin
      if (subscription.customOverrides) {
        return this.mergeFeatures(plan.features, subscription.customOverrides);
      }

      return plan.features;
    } catch (error) {
      // Return Professional features as default (all enabled)
      return this.DEFAULT_PLANS[2].features;
    }
  }

  /**
   * Update user's subscription
   */
  async updateUserSubscription(
    userId: string,
    updates: Partial<UserSubscription>
  ): Promise<void> {
    try {
      const docRef = doc(firestore, this.USER_SUBSCRIPTIONS_COLLECTION, userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }

  /**
   * Apply custom feature overrides for a user (admin function)
   */
  async applyFeatureOverrides(
    userId: string,
    overrides: Partial<SubscriptionPlanFeatures>
  ): Promise<void> {
    try {
      await this.updateUserSubscription(userId, {
        customOverrides: overrides,
      });
    } catch (error) {
      console.error('Error applying feature overrides:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async userHasFeature(userId: string, feature: string): Promise<boolean> {
    const features = await this.getUserSubscriptionFeatures(userId);
    
    switch (feature) {
      case 'totp':
        return features.twoFactorAuth.enabled && features.twoFactorAuth.methods.includes('totp');
      case 'sms':
        return features.twoFactorAuth.enabled && features.twoFactorAuth.methods.includes('sms');
      case 'email':
        return features.twoFactorAuth.enabled && features.twoFactorAuth.methods.includes('email');
      case 'biometric':
        return features.biometricAuth;
      case 'advancedSecurity':
        return features.advancedSecurity;
      case 'auditLogs':
        return features.auditLogs;
      case 'sessionManagement':
        return features.sessionManagement;
      default:
        return false;
    }
  }

  /**
   * Private helper methods
   */
  private async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      // For default plans, return from memory
      if (planId === 'default-free') {
        return {
          id: 'default-free',
          ...this.DEFAULT_PLANS[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      const docRef = doc(firestore, this.PLANS_COLLECTION, planId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as SubscriptionPlan;
    } catch (error) {
      // Silent fail for permission errors
      if ((error as any)?.code !== 'permission-denied') {
        console.error('Error fetching subscription plan:', error);
      }
      return null;
    }
  }

  private async getFreePlan(): Promise<SubscriptionPlan | null> {
    try {
      const q = query(
        collection(firestore, this.PLANS_COLLECTION),
        where('tier', '==', 'free')
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        } as SubscriptionPlan;
      }

      return null;
    } catch (error) {
      console.error('Error fetching free plan:', error);
      return null;
    }
  }

  private mergeFeatures(
    base: SubscriptionPlanFeatures,
    overrides: Partial<SubscriptionPlanFeatures>
  ): SubscriptionPlanFeatures {
    return {
      ...base,
      ...overrides,
      twoFactorAuth: {
        ...base.twoFactorAuth,
        ...(overrides.twoFactorAuth || {}),
      },
    };
  }
}

export const subscriptionService = new SubscriptionService();