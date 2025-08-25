import type { LOINCCode } from '@/types/test.types';
import { loincApiService } from './loinc-api.service';
import { mockLOINCDatabase, mockLoincService } from '@/data/mock-loinc.data';

// Check if we should use the real API or mock data
const USE_LOINC_API = import.meta.env.VITE_USE_LOINC_API === 'true' || false;

/**
 * LOINC Service
 * Handles LOINC code lookup and search functionality
 * Can use either the real LOINC API or mock data for development
 */
export const loincService = {
  /**
   * Search for LOINC codes by term
   */
  async searchLOINCCodes(searchTerm: string): Promise<LOINCCode[]> {
    // Use real API if enabled
    if (USE_LOINC_API) {
      return loincApiService.searchLOINCCodes(searchTerm);
    }

    // Otherwise use mock data
    return mockLoincService.searchLOINCCodes(searchTerm);
  },

  /**
   * Get a specific LOINC code by its code value
   */
  async getLOINCByCode(code: string): Promise<LOINCCode | null> {
    // Use real API if enabled
    if (USE_LOINC_API) {
      return loincApiService.getLOINCByCode(code);
    }

    // Otherwise use mock data
    return mockLoincService.getLOINCByCode(code);
  },

  async getCommonTests(): Promise<LOINCCode[]> {
    // Use real API if enabled
    if (USE_LOINC_API) {
      return loincApiService.getCommonTests();
    }

    // Otherwise return mock common tests
    return mockLoincService.getCommonTests();
  },

  // Additional methods that use the API service
  async searchByCategory(category: string, limit?: number): Promise<LOINCCode[]> {
    if (USE_LOINC_API) {
      return loincApiService.searchByCategory(category, limit);
    }

    // Mock implementation
    return mockLoincService.getTestsByCategory(category).slice(0, limit || 50);
  },

  async validateLOINCCode(code: string): Promise<boolean> {
    if (USE_LOINC_API) {
      return loincApiService.validateLOINCCode(code);
    }

    // Mock implementation
    return mockLOINCDatabase.some((loinc) => loinc.code === code);
  },

  // Utility methods
  getCategories() {
    const categories = new Set<string>();
    mockLOINCDatabase.forEach((code) => {
      if (code.class) {
        categories.add(code.class);
      }
    });
    return Array.from(categories).sort();
  },

  // Sync version for immediate results (uses mock data only)
  searchLOINCCodesSync(searchTerm: string): LOINCCode[] {
    return mockLoincService.searchLOINCCodes(searchTerm);
  },

  getLOINCByCodeSync(code: string): LOINCCode | null {
    return mockLoincService.getLOINCByCode(code);
  },
};