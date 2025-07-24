import type { LOINCCode } from '@/types/test.types';
import { loincApiService } from './loinc-api.service';

// Mock LOINC data for common lab tests
const mockLOINCDatabase: LOINCCode[] = [
  // Chemistry Tests
  {
    code: '2345-7',
    displayName: 'Glucose',
    longCommonName: 'Glucose [Mass/volume] in Serum or Plasma',
    shortName: 'Glucose SerPl-mCnc',
    class: 'CHEM',
    component: 'Glucose',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
    method: '',
  },
  {
    code: '2160-0',
    displayName: 'Creatinine',
    longCommonName: 'Creatinine [Mass/volume] in Serum or Plasma',
    shortName: 'Creat SerPl-mCnc',
    class: 'CHEM',
    component: 'Creatinine',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
  },
  {
    code: '3094-0',
    displayName: 'BUN',
    longCommonName: 'Urea nitrogen [Mass/volume] in Serum or Plasma',
    shortName: 'BUN SerPl-mCnc',
    class: 'CHEM',
    component: 'Urea nitrogen',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
  },
  // Hematology Tests
  {
    code: '6690-2',
    displayName: 'WBC',
    longCommonName: 'Leukocytes [#/volume] in Blood by Automated count',
    shortName: 'WBC # Bld Auto',
    class: 'HEM/BC',
    component: 'Leukocytes',
    property: 'NCnc',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
    method: 'Automated count',
  },
  {
    code: '789-8',
    displayName: 'RBC',
    longCommonName: 'Erythrocytes [#/volume] in Blood by Automated count',
    shortName: 'RBC # Bld Auto',
    class: 'HEM/BC',
    component: 'Erythrocytes',
    property: 'NCnc',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
    method: 'Automated count',
  },
  {
    code: '718-7',
    displayName: 'Hemoglobin',
    longCommonName: 'Hemoglobin [Mass/volume] in Blood',
    shortName: 'Hgb Bld-mCnc',
    class: 'HEM/BC',
    component: 'Hemoglobin',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Bld',
    scale: 'Qn',
  },
  // Lipid Panel
  {
    code: '2093-3',
    displayName: 'Total Cholesterol',
    longCommonName: 'Cholesterol [Mass/volume] in Serum or Plasma',
    shortName: 'Cholest SerPl-mCnc',
    class: 'CHEM',
    component: 'Cholesterol',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
  },
  {
    code: '2571-8',
    displayName: 'Triglycerides',
    longCommonName: 'Triglyceride [Mass/volume] in Serum or Plasma',
    shortName: 'Trigl SerPl-mCnc',
    class: 'CHEM',
    component: 'Triglyceride',
    property: 'MCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
  },
  // Liver Function
  {
    code: '1742-6',
    displayName: 'ALT',
    longCommonName: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma',
    shortName: 'ALT SerPl-cCnc',
    class: 'CHEM',
    component: 'Alanine aminotransferase',
    property: 'CCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
  },
  {
    code: '1920-8',
    displayName: 'AST',
    longCommonName: 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma',
    shortName: 'AST SerPl-cCnc',
    class: 'CHEM',
    component: 'Aspartate aminotransferase',
    property: 'CCnc',
    timeAspect: 'Pt',
    system: 'Ser/Plas',
    scale: 'Qn',
  },
];

// Check if we should use the real API or mock data
const USE_LOINC_API = import.meta.env.VITE_USE_LOINC_API === 'true' || false;

export const loincService = {
  async searchLOINCCodes(searchTerm: string): Promise<LOINCCode[]> {
    // Use real API if enabled
    if (USE_LOINC_API) {
      return loincApiService.searchLOINCCodes(searchTerm);
    }
    
    // Otherwise use mock data
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const searchLower = searchTerm.toLowerCase();
    return mockLOINCDatabase.filter(
      code =>
        code.code.includes(searchTerm) ||
        code.displayName.toLowerCase().includes(searchLower) ||
        code.longCommonName?.toLowerCase().includes(searchLower) ||
        code.shortName?.toLowerCase().includes(searchLower)
    );
  },

  async getLOINCByCode(code: string): Promise<LOINCCode | null> {
    // Use real API if enabled
    if (USE_LOINC_API) {
      return loincApiService.getLOINCByCode(code);
    }
    
    // Otherwise use mock data
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return mockLOINCDatabase.find(loinc => loinc.code === code) || null;
  },

  async getCommonTests(): Promise<LOINCCode[]> {
    // Use real API if enabled
    if (USE_LOINC_API) {
      return loincApiService.getCommonTests();
    }
    
    // Otherwise return mock common tests
    return mockLOINCDatabase.slice(0, 10);
  },
  
  // Additional methods that use the API service
  async searchByCategory(category: string, limit?: number): Promise<LOINCCode[]> {
    if (USE_LOINC_API) {
      return loincApiService.searchByCategory(category, limit);
    }
    
    // Mock implementation
    return mockLOINCDatabase.filter(code => code.class === category).slice(0, limit || 50);
  },
  
  async validateLOINCCode(code: string): Promise<boolean> {
    if (USE_LOINC_API) {
      return loincApiService.validateLOINCCode(code);
    }
    
    // Mock implementation
    return mockLOINCDatabase.some(loinc => loinc.code === code);
  },
};