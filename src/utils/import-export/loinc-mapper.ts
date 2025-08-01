import { Test } from '@/types';

export interface LOINCMapping {
  loincCode: string;
  testCode: string;
  testName: string;
  confidence: number;
  isExactMatch: boolean;
}

export interface LOINCData {
  code: string;
  component: string;
  property: string;
  timeAspect: string;
  system: string;
  scaleType: string;
  methodType?: string;
  longCommonName: string;
  shortName?: string;
  exampleUnits?: string;
  status: string;
}

export class LOINCMapper {
  private static loincDatabase: Map<string, LOINCData> = new Map();
  
  // Initialize with common LOINC codes
  static {
    this.initializeCommonLOINCCodes();
  }
  
  private static initializeCommonLOINCCodes(): void {
    const commonCodes: LOINCData[] = [
      {
        code: '2160-0',
        component: 'Creatinine',
        property: 'MCnc',
        timeAspect: 'Pt',
        system: 'Ser/Plas',
        scaleType: 'Qn',
        longCommonName: 'Creatinine [Mass/volume] in Serum or Plasma',
        shortName: 'Creat SerPl-mCnc',
        exampleUnits: 'mg/dL',
        status: 'ACTIVE',
      },
      {
        code: '2345-7',
        component: 'Glucose',
        property: 'MCnc',
        timeAspect: 'Pt',
        system: 'Ser/Plas',
        scaleType: 'Qn',
        longCommonName: 'Glucose [Mass/volume] in Serum or Plasma',
        shortName: 'Glucose SerPl-mCnc',
        exampleUnits: 'mg/dL',
        status: 'ACTIVE',
      },
      {
        code: '718-7',
        component: 'Hemoglobin',
        property: 'MCnc',
        timeAspect: 'Pt',
        system: 'Bld',
        scaleType: 'Qn',
        longCommonName: 'Hemoglobin [Mass/volume] in Blood',
        shortName: 'Hgb Bld-mCnc',
        exampleUnits: 'g/dL',
        status: 'ACTIVE',
      },
      {
        code: '6299-2',
        component: 'Urea nitrogen',
        property: 'MCnc',
        timeAspect: 'Pt',
        system: 'Bld',
        scaleType: 'Qn',
        longCommonName: 'Urea nitrogen [Mass/volume] in Blood',
        shortName: 'BUN Bld-mCnc',
        exampleUnits: 'mg/dL',
        status: 'ACTIVE',
      },
      {
        code: '2532-0',
        component: 'Lactate dehydrogenase',
        property: 'CCnc',
        timeAspect: 'Pt',
        system: 'Ser/Plas',
        scaleType: 'Qn',
        longCommonName: 'Lactate dehydrogenase [Enzymatic activity/volume] in Serum or Plasma',
        shortName: 'LDH SerPl-cCnc',
        exampleUnits: 'U/L',
        status: 'ACTIVE',
      },
    ];
    
    commonCodes.forEach(code => {
      this.loincDatabase.set(code.code, code);
    });
  }
  
  static async mapTestToLOINC(test: Partial<Test>): Promise<LOINCMapping[]> {
    const mappings: LOINCMapping[] = [];
    
    // Try exact code match first
    if (test.loincCode) {
      const exactMatch = this.loincDatabase.get(test.loincCode);
      if (exactMatch) {
        mappings.push({
          loincCode: test.loincCode,
          testCode: test.code || '',
          testName: test.name || '',
          confidence: 100,
          isExactMatch: true,
        });
        return mappings;
      }
    }
    
    // Try name-based matching
    if (test.name) {
      const nameMatches = this.findByName(test.name);
      mappings.push(...nameMatches.map(match => ({
        loincCode: match.code,
        testCode: test.code || '',
        testName: test.name || '',
        confidence: this.calculateConfidence(test.name, match),
        isExactMatch: false,
      })));
    }
    
    // Sort by confidence
    return mappings.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
  
  private static findByName(testName: string): LOINCData[] {
    const matches: LOINCData[] = [];
    const normalizedTestName = testName.toLowerCase();
    
    this.loincDatabase.forEach(loincData => {
      const normalizedLongName = loincData.longCommonName.toLowerCase();
      const normalizedComponent = loincData.component.toLowerCase();
      
      if (
        normalizedLongName.includes(normalizedTestName) ||
        normalizedTestName.includes(normalizedComponent) ||
        normalizedComponent.includes(normalizedTestName)
      ) {
        matches.push(loincData);
      }
    });
    
    return matches;
  }
  
  private static calculateConfidence(testName: string, loincData: LOINCData): number {
    const normalizedTestName = testName.toLowerCase();
    const normalizedLongName = loincData.longCommonName.toLowerCase();
    const normalizedComponent = loincData.component.toLowerCase();
    
    // Exact match
    if (normalizedTestName === normalizedLongName || 
        normalizedTestName === normalizedComponent) {
      return 95;
    }
    
    // Component match
    if (normalizedTestName.includes(normalizedComponent) ||
        normalizedComponent.includes(normalizedTestName)) {
      return 80;
    }
    
    // Partial match in long name
    if (normalizedLongName.includes(normalizedTestName)) {
      return 70;
    }
    
    // Word-based matching
    const testWords = normalizedTestName.split(/\s+/);
    const loincWords = normalizedLongName.split(/\s+/);
    const matchingWords = testWords.filter(word => 
      loincWords.some(loincWord => loincWord.includes(word))
    );
    
    return (matchingWords.length / testWords.length) * 60;
  }
  
  static enrichTestWithLOINC(test: Partial<Test>, loincCode: string): Partial<Test> {
    const loincData = this.loincDatabase.get(loincCode);
    if (!loincData) return test;
    
    return {
      ...test,
      loincCode,
      loincLongName: loincData.longCommonName,
      loincComponent: loincData.component,
      loincProperty: loincData.property,
      loincSystem: loincData.system,
      loincScale: loincData.scaleType,
      loincStatus: loincData.status,
      units: test.units || loincData.exampleUnits,
    };
  }
  
  static validateLOINCCode(code: string): boolean {
    // Basic LOINC format validation
    const loincPattern = /^\d{1,5}-\d$/;
    return loincPattern.test(code);
  }
  
  static getLOINCInfo(code: string): LOINCData | null {
    return this.loincDatabase.get(code) || null;
  }
  
  static searchLOINC(query: string): LOINCData[] {
    const results: LOINCData[] = [];
    const normalizedQuery = query.toLowerCase();
    
    this.loincDatabase.forEach(loincData => {
      if (
        loincData.code.includes(query) ||
        loincData.longCommonName.toLowerCase().includes(normalizedQuery) ||
        loincData.component.toLowerCase().includes(normalizedQuery) ||
        (loincData.shortName && loincData.shortName.toLowerCase().includes(normalizedQuery))
      ) {
        results.push(loincData);
      }
    });
    
    return results.slice(0, 20); // Limit results
  }
}