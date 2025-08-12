import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { HotkeyConfig } from './hotkeys.service';

export interface UserPreferencesExtended {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  defaultView?: string;
  dashboardLayout?: Record<string, unknown>;
  shortcuts?: string[];
  // New preferences
  hotkeys?: HotkeyConfig;
  quickActionPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  quickActionExpanded?: boolean;
  showWelcomeMessage?: boolean;
  sidebarCollapsed?: boolean;
  favoriteModules?: string[];
  recentlyVisited?: Array<{ path: string; label: string; timestamp: number }>;
}

class UserPreferencesService {
  private collection = 'userPreferences';
  private cache: Map<string, UserPreferencesExtended> = new Map();

  async getUserPreferences(userId: string): Promise<UserPreferencesExtended | null> {
    try {
      // Check cache first
      if (this.cache.has(userId)) {
        return this.cache.get(userId)!;
      }

      const docRef = doc(db, this.collection, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const preferences = docSnap.data() as UserPreferencesExtended;
        this.cache.set(userId, preferences);
        return preferences;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferencesExtended>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collection, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          ...preferences,
          updatedAt: new Date(),
        });
      } else {
        await setDoc(docRef, {
          ...this.getDefaultPreferences(),
          ...preferences,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Update cache
      const current = this.cache.get(userId) || this.getDefaultPreferences();
      this.cache.set(userId, { ...current, ...preferences });

      // Sync to localStorage for offline support
      this.syncToLocalStorage(userId, preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async updateHotkeys(userId: string, hotkeys: HotkeyConfig): Promise<void> {
    await this.updateUserPreferences(userId, { hotkeys });
  }

  async updateQuickActionPosition(
    userId: string,
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  ): Promise<void> {
    await this.updateUserPreferences(userId, { quickActionPosition: position });
  }

  async addToRecentlyVisited(
    userId: string,
    item: { path: string; label: string }
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    const recentlyVisited = preferences?.recentlyVisited || [];

    // Remove if already exists
    const filtered = recentlyVisited.filter((i) => i.path !== item.path);

    // Add to beginning
    filtered.unshift({ ...item, timestamp: Date.now() });

    // Keep only last 10
    const trimmed = filtered.slice(0, 10);

    await this.updateUserPreferences(userId, { recentlyVisited: trimmed });
  }

  async toggleFavoriteModule(userId: string, moduleId: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    const favorites = preferences?.favoriteModules || [];

    const updated = favorites.includes(moduleId)
      ? favorites.filter((id) => id !== moduleId)
      : [...favorites, moduleId];

    await this.updateUserPreferences(userId, { favoriteModules: updated });
  }

  private getDefaultPreferences(): UserPreferencesExtended {
    return {
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        sms: true,
        push: true,
        inApp: true,
      },
      defaultView: '/dashboard',
      dashboardLayout: {},
      shortcuts: [],
      hotkeys: {},
      quickActionPosition: 'bottom-right',
      quickActionExpanded: false,
      showWelcomeMessage: true,
      sidebarCollapsed: false,
      favoriteModules: [],
      recentlyVisited: [],
    };
  }

  private syncToLocalStorage(userId: string, preferences: Partial<UserPreferencesExtended>) {
    try {
      const key = `userPreferences_${userId}`;
      const existing = localStorage.getItem(key);
      const current = existing ? JSON.parse(existing) : {};
      const updated = { ...current, ...preferences };
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.error('Error syncing to localStorage:', error);
    }
  }

  loadFromLocalStorage(userId: string): UserPreferencesExtended | null {
    try {
      const key = `userPreferences_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const preferences = JSON.parse(stored);
        this.cache.set(userId, preferences);
        return preferences;
      }
      return null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  clearCache(userId?: string) {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }
}

export const userPreferencesService = new UserPreferencesService();