import { db } from '@/config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { COLLECTIONS } from '@/config/firebase-collections';
import type { QCTest, QCResult, QCRule, QCStatistics } from '@/types/quality-control';
import { getCurrentUser } from './auth.service';
import { generateId } from '@/utils/helpers';

// Westgard Rules
const WESTGARD_RULES: QCRule[] = [
  { id: '1_2s', name: '1-2s', code: '1_2s', description: 'One control observation exceeds ±2SD', type: 'warning', enabled: true },
  { id: '1_3s', name: '1-3s', code: '1_3s', description: 'One control observation exceeds ±3SD', type: 'rejection', enabled: true },
  { id: '2_2s', name: '2-2s', code: '2_2s', description: 'Two consecutive values exceed same ±2SD limit', type: 'rejection', enabled: true },
  { id: 'R_4s', name: 'R-4s', code: 'R_4s', description: 'One observation exceeds +2SD and another exceeds -2SD', type: 'rejection', enabled: true },
  { id: '4_1s', name: '4-1s', code: '4_1s', description: 'Four consecutive values exceed same ±1SD limit', type: 'rejection', enabled: true },
  { id: '10x', name: '10x', code: '10x', description: 'Ten consecutive values are on the same side of the mean', type: 'rejection', enabled: true },
];

export const qualityControlService = {
  // QC Tests
  async getQCTests(filters?: any): Promise<QCTest[]> {
    const constraints = [];
    
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    
    constraints.push(orderBy('testName'));
    
    const q = query(
      collection(db, COLLECTIONS.QC_TESTS),
      ...constraints
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QCTest));
  },

  async createQCTest(data: Partial<QCTest>): Promise<string> {
    const user = await getCurrentUser();
    const docRef = await addDoc(collection(db, COLLECTIONS.QC_TESTS), {
      ...data,
      id: generateId(),
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: user?.uid
    });
    return docRef.id;
  },

  // QC Results
  async recordQCResult(data: Partial<QCResult>): Promise<{ resultId: string; violations: string[] }> {
    const user = await getCurrentUser();
    
    // Get QC test details
    const qcTest = await this.getQCTest(data.qcTestId!);
    if (!qcTest) throw new Error('QC Test not found');
    
    const level = qcTest.levels.find(l => l.id === data.levelId);
    if (!level) throw new Error('QC Level not found');
    
    // Apply Westgard rules
    const violations = await this.applyWestgardRules(
      data.qcTestId!,
      data.levelId!,
      data.value!,
      level
    );
    
    const acceptanceStatus = violations.length === 0 ? 'accepted' : 
      violations.some(v => WESTGARD_RULES.find(r => r.code === v)?.type === 'rejection') ? 'rejected' : 'warning';
    
    const docRef = await addDoc(collection(db, COLLECTIONS.QC_RESULTS), {
      ...data,
      id: generateId(),
      operatorId: user?.uid,
      operatorName: user?.displayName || 'Unknown',
      acceptanceStatus,
      violatedRules: violations,
      createdAt: Timestamp.now()
    });
    
    return { resultId: docRef.id, violations };
  },

  async getQCResults(qcTestId: string, levelId?: string, days: number = 30): Promise<QCResult[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const constraints = [
      where('qcTestId', '==', qcTestId),
      where('runDate', '>=', Timestamp.fromDate(startDate)),
      orderBy('runDate', 'desc')
    ];
    
    if (levelId) {
      constraints.push(where('levelId', '==', levelId));
    }
    
    const q = query(
      collection(db, COLLECTIONS.QC_RESULTS),
      ...constraints
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QCResult));
  },

  // Westgard Rules
  async applyWestgardRules(
    qcTestId: string,
    levelId: string,
    currentValue: number,
    level: QCLevel
  ): Promise<string[]> {
    const violations: string[] = [];
    
    // Get recent results for rule evaluation
    const recentResults = await this.getQCResults(qcTestId, levelId, 30);
    const values = recentResults.map(r => r.value);
    values.unshift(currentValue); // Add current value at the beginning
    
    const mean = level.targetMean;
    const sd = level.targetSD;
    
    // 1-2s rule
    if (Math.abs(currentValue - mean) > 2 * sd) {
      violations.push('1_2s');
    }
    
    // 1-3s rule
    if (Math.abs(currentValue - mean) > 3 * sd) {
      violations.push('1_3s');
    }
    
    // 2-2s rule
    if (values.length >= 2) {
      const lastTwo = values.slice(0, 2);
      if (lastTwo.every(v => v > mean + 2 * sd) || lastTwo.every(v => v < mean - 2 * sd)) {
        violations.push('2_2s');
      }
    }
    
    // R-4s rule
    if (values.length >= 2) {
      for (let i = 0; i < Math.min(values.length - 1, 5); i++) {
        if ((values[i] > mean + 2 * sd && values[i + 1] < mean - 2 * sd) ||
            (values[i] < mean - 2 * sd && values[i + 1] > mean + 2 * sd)) {
          violations.push('R_4s');
          break;
        }
      }
    }
    
    // 4-1s rule
    if (values.length >= 4) {
      const lastFour = values.slice(0, 4);
      if (lastFour.every(v => v > mean + sd) || lastFour.every(v => v < mean - sd)) {
        violations.push('4_1s');
      }
    }
    
    // 10x rule
    if (values.length >= 10) {
      const lastTen = values.slice(0, 10);
      if (lastTen.every(v => v > mean) || lastTen.every(v => v < mean)) {
        violations.push('10x');
      }
    }
    
    return violations;
  },

  // Statistics
  async calculateStatistics(
    qcTestId: string,
    levelId: string,
    period: QCStatistics['period']
  ): Promise<QCStatistics> {
    const days = period === 'daily' ? 1 : 
                 period === 'weekly' ? 7 : 
                 period === 'monthly' ? 30 : 90;
    
    const results = await this.getQCResults(qcTestId, levelId, days);
    const values = results.map(r => r.value);
    
    if (values.length === 0) {
      throw new Error('No QC results found for the specified period');
    }
    
    // Calculate statistics
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);
    const cv = (sd / mean) * 100;
    
    // Get target values
    const qcTest = await this.getQCTest(qcTestId);
    const level = qcTest?.levels.find(l => l.id === levelId);
    const targetMean = level?.targetMean || mean;
    const targetSD = level?.targetSD || sd;
    
    // Count values within SD ranges
    const withinSDCount = {
      oneSD: values.filter(v => Math.abs(v - targetMean) <= targetSD).length,
      twoSD: values.filter(v => Math.abs(v - targetMean) <= 2 * targetSD).length,
      threeSD: values.filter(v => Math.abs(v - targetMean) <= 3 * targetSD).length,
    };
    
    const bias = ((mean - targetMean) / targetMean) * 100;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return {
      testId: qcTestId,
      levelId,
      period,
      mean,
      sd,
      cv,
      n,
      withinSDCount,
      bias,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.now()
    };
  },

  // Helper methods
  async getQCTest(id: string): Promise<QCTest | null> {
    const docRef = doc(db, COLLECTIONS.QC_TESTS, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data()
    } as QCTest;
  },

  // Get Levey-Jennings data
  async getLeveyJenningsData(
    qcTestId: string,
    levelId: string,
    days: number = 30
  ): Promise<any[]> {
    const results = await this.getQCResults(qcTestId, levelId, days);
    const qcTest = await this.getQCTest(qcTestId);
    const level = qcTest?.levels.find(l => l.id === levelId);
    
    if (!level) return [];
    
    const mean = level.targetMean;
    const sd = level.targetSD;
    
    return results.map(result => ({
      date: result.runDate.toDate(),
      value: result.value,
      mean,
      plusOneSD: mean + sd,
      plusTwoSD: mean + 2 * sd,
      plusThreeSD: mean + 3 * sd,
      minusOneSD: mean - sd,
      minusTwoSD: mean - 2 * sd,
      minusThreeSD: mean - 3 * sd,
      status: result.acceptanceStatus
    }));
  }
};