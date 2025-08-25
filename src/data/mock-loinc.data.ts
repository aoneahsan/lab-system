import type { LOINCCode } from '@/types/test.types';

// Mock LOINC data for common lab tests
export const mockLOINCDatabase: LOINCCode[] = [
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
    method: 'Auto',
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
    method: 'Auto',
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
  // Liver Function Tests
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

// Common test categories
export const loincCategories = [
  { code: 'CHEM', name: 'Chemistry' },
  { code: 'HEM/BC', name: 'Hematology/Blood Count' },
  { code: 'MICRO', name: 'Microbiology' },
  { code: 'H&P.HX', name: 'History and Physical' },
  { code: 'PATH', name: 'Pathology' },
  { code: 'DRUG/TOX', name: 'Drug/Toxicology' },
  { code: 'SERO', name: 'Serology' },
  { code: 'CYTO', name: 'Cytology' },
  { code: 'RAD', name: 'Radiology' },
];

// LOINC mock service functions
export const mockLoincService = {
  searchLOINCCodes(searchTerm: string): LOINCCode[] {
    if (!searchTerm) return mockLOINCDatabase.slice(0, 20);
    
    const term = searchTerm.toLowerCase();
    return mockLOINCDatabase.filter(
      (code) =>
        code.code.includes(term) ||
        code.displayName.toLowerCase().includes(term) ||
        code.longCommonName?.toLowerCase().includes(term) ||
        code.shortName?.toLowerCase().includes(term) ||
        code.component?.toLowerCase().includes(term)
    );
  },

  getLOINCByCode(code: string): LOINCCode | null {
    return mockLOINCDatabase.find((loinc) => loinc.code === code) || null;
  },

  getCommonTests(): LOINCCode[] {
    return mockLOINCDatabase.slice(0, 10);
  },

  getTestsByCategory(category: string): LOINCCode[] {
    return mockLOINCDatabase.filter((test) => test.class === category);
  },
};