import axios from 'axios';
import type { LOINCCode } from '@/types/test.types';

// LOINC FHIR API configuration
const LOINC_API_BASE_URL = 'https://fhir.loinc.org';
const LOINC_API_TIMEOUT = 10000; // 10 seconds

// Create axios instance with default config
const loincApi = axios.create({
  baseURL: LOINC_API_BASE_URL,
  timeout: LOINC_API_TIMEOUT,
  headers: {
    'Accept': 'application/fhir+json',
    'Content-Type': 'application/fhir+json',
  },
});

// Cache for LOINC codes to reduce API calls
const loincCache = new Map<string, LOINCCode>();
const searchCache = new Map<string, LOINCCode[]>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface FHIRCodeSystemConcept {
  code: string;
  display: string;
  property?: Array<{
    code: string;
    valueString?: string;
    valueCode?: string;
  }>;
}

interface FHIRValueSet {
  resourceType: string;
  compose?: {
    include?: Array<{
      concept?: FHIRCodeSystemConcept[];
    }>;
  };
  expansion?: {
    contains?: Array<{
      code: string;
      display: string;
      system: string;
    }>;
  };
}

interface FHIRBundle {
  resourceType: string;
  entry?: Array<{
    resource?: {
      code?: string;
      display?: string;
      property?: Array<{
        code: string;
        valueString?: string;
        valueCode?: string;
      }>;
    };
  }>;
}

// Convert FHIR concept to our LOINCCode format
const convertFHIRToLOINC = (concept: FHIRCodeSystemConcept): LOINCCode => {
  const properties = concept.property || [];
  
  const findProperty = (code: string): string | undefined => {
    const prop = properties.find(p => p.code === code);
    return prop?.valueString || prop?.valueCode;
  };

  return {
    code: concept.code,
    displayName: concept.display,
    longCommonName: findProperty('LONG_COMMON_NAME'),
    shortName: findProperty('SHORTNAME'),
    class: findProperty('CLASS'),
    component: findProperty('COMPONENT'),
    property: findProperty('PROPERTY'),
    timeAspect: findProperty('TIME_ASPCT'),
    system: findProperty('SYSTEM'),
    scale: findProperty('SCALE_TYP'),
    method: findProperty('METHOD_TYP'),
    status: findProperty('STATUS'),
  };
};

export const loincApiService = {
  /**
   * Search LOINC codes using the FHIR API
   * Falls back to mock data if API is unavailable
   */
  async searchLOINCCodes(searchTerm: string, limit: number = 20): Promise<LOINCCode[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    // Check cache first
    const cacheKey = `search_${searchTerm}_${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use LOINC FHIR API to search for codes
      const response = await loincApi.get<FHIRBundle>('/CodeSystem/$lookup', {
        params: {
          system: 'http://loinc.org',
          filter: searchTerm,
          count: limit,
        },
      });

      if (response.data.entry) {
        const results = response.data.entry
          .map(entry => {
            if (entry.resource && entry.resource.code) {
              return convertFHIRToLOINC({
                code: entry.resource.code,
                display: entry.resource.display || '',
                property: entry.resource.property,
              });
            }
            return null;
          })
          .filter((item): item is LOINCCode => item !== null);

        // Cache results
        searchCache.set(cacheKey, results);
        setTimeout(() => searchCache.delete(cacheKey), CACHE_DURATION);

        return results;
      }

      return [];
    } catch (error) {
      console.error('LOINC API search error:', error);
      // Fall back to local search using mock data
      const { loincService } = await import('./loinc.service');
      return loincService.searchLOINCCodes(searchTerm);
    }
  },

  /**
   * Get a specific LOINC code by its code value
   */
  async getLOINCByCode(code: string): Promise<LOINCCode | null> {
    if (!code) {
      return null;
    }

    // Check cache first
    const cached = loincCache.get(code);
    if (cached) {
      return cached;
    }

    try {
      const response = await loincApi.get<FHIRBundle>(`/CodeSystem/$lookup`, {
        params: {
          system: 'http://loinc.org',
          code: code,
        },
      });

      if (response.data.entry && response.data.entry.length > 0) {
        const entry = response.data.entry[0];
        if (entry.resource && entry.resource.code) {
          const loincCode = convertFHIRToLOINC({
            code: entry.resource.code,
            display: entry.resource.display || '',
            property: entry.resource.property,
          });

          // Cache result
          loincCache.set(code, loincCode);
          setTimeout(() => loincCache.delete(code), CACHE_DURATION);

          return loincCode;
        }
      }

      return null;
    } catch (error) {
      console.error('LOINC API lookup error:', error);
      // Fall back to local lookup
      const { loincService } = await import('./loinc.service');
      return loincService.getLOINCByCode(code);
    }
  },

  /**
   * Get common lab test LOINC codes
   * Uses a predefined value set of common tests
   */
  async getCommonTests(): Promise<LOINCCode[]> {
    const cacheKey = 'common_tests';
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Common lab tests value set
      const commonTestCodes = [
        '2345-7', // Glucose
        '2160-0', // Creatinine
        '3094-0', // BUN
        '6690-2', // WBC
        '789-8',  // RBC
        '718-7',  // Hemoglobin
        '2093-3', // Total Cholesterol
        '2571-8', // Triglycerides
        '1742-6', // ALT
        '1920-8', // AST
        '2951-2', // Sodium
        '2823-3', // Potassium
        '2075-0', // Chloride
        '2028-9', // CO2
        '17861-6', // Calcium
        '2885-2', // Total Protein
        '1751-7', // Albumin
        '1975-2', // Total Bilirubin
        '6768-6', // Alkaline Phosphatase
        '2324-2', // GGT
      ];

      const results = await Promise.all(
        commonTestCodes.map(code => this.getLOINCByCode(code))
      );

      const validResults = results.filter((item): item is LOINCCode => item !== null);

      // Cache results
      searchCache.set(cacheKey, validResults);
      setTimeout(() => searchCache.delete(cacheKey), CACHE_DURATION);

      return validResults;
    } catch (error) {
      console.error('LOINC API common tests error:', error);
      // Fall back to local common tests
      const { loincService } = await import('./loinc.service');
      return loincService.getCommonTests();
    }
  },

  /**
   * Search LOINC codes by category
   */
  async searchByCategory(category: string, limit: number = 50): Promise<LOINCCode[]> {
    const cacheKey = `category_${category}_${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await loincApi.get<FHIRValueSet>('/ValueSet/$expand', {
        params: {
          url: `http://loinc.org/vs/class/${category}`,
          count: limit,
        },
      });

      if (response.data.expansion?.contains) {
        const results = await Promise.all(
          response.data.expansion.contains.map(item => 
            this.getLOINCByCode(item.code)
          )
        );

        const validResults = results.filter((item): item is LOINCCode => item !== null);

        // Cache results
        searchCache.set(cacheKey, validResults);
        setTimeout(() => searchCache.delete(cacheKey), CACHE_DURATION);

        return validResults;
      }

      return [];
    } catch (error) {
      console.error('LOINC API category search error:', error);
      // Fall back to local search filtered by category
      const { loincService } = await import('./loinc.service');
      const allTests = await loincService.searchLOINCCodes('');
      return allTests.filter(test => test.class === category);
    }
  },

  /**
   * Validate a LOINC code
   */
  async validateLOINCCode(code: string): Promise<boolean> {
    const loincCode = await this.getLOINCByCode(code);
    return loincCode !== null;
  },

  /**
   * Clear all caches
   */
  clearCache(): void {
    loincCache.clear();
    searchCache.clear();
  },
};