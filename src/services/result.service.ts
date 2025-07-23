import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import type {
  TestResult,
  ResultFilter,
  ResultEntryFormData,
  BatchResultEntryData,
  ResultStatistics,
  ResultGroup,
  ResultReport,
  // ResultValidationRule,
  ResultStatus,
  // VerificationStatus,
  ResultFlag,
} from '@/types/result.types';

export const resultService = {
  // Get results with filters
  async getResults(tenantId: string, filter?: ResultFilter): Promise<TestResult[]> {
    const resultsRef = collection(db, COLLECTIONS.RESULTS);
    let q = query(resultsRef, where('tenantId', '==', tenantId));

    if (filter?.patientId) {
      q = query(q, where('patientId', '==', filter.patientId));
    }
    if (filter?.orderId) {
      q = query(q, where('orderId', '==', filter.orderId));
    }
    if (filter?.sampleId) {
      q = query(q, where('sampleId', '==', filter.sampleId));
    }
    if (filter?.testId) {
      q = query(q, where('testId', '==', filter.testId));
    }
    if (filter?.status) {
      q = query(q, where('status', '==', filter.status));
    }
    if (filter?.verificationStatus) {
      q = query(q, where('verificationStatus', '==', filter.verificationStatus));
    }
    if (filter?.flag) {
      q = query(q, where('flag', '==', filter.flag));
    }
    if (filter?.isCritical !== undefined) {
      q = query(q, where('isCritical', '==', filter.isCritical));
    }

    q = query(q, orderBy('performedAt', 'desc'), limit(100));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult));
  },

  // Get single result
  async getResult(tenantId: string, resultId: string): Promise<TestResult | null> {
    const resultRef = doc(db, COLLECTIONS.RESULTS, resultId);
    const resultDoc = await getDoc(resultRef);
    
    if (!resultDoc.exists() || resultDoc.data()?.tenantId !== tenantId) {
      return null;
    }

    return { id: resultDoc.id, ...resultDoc.data() } as TestResult;
  },

  // Create result
  async createResult(
    tenantId: string,
    userId: string,
    data: ResultEntryFormData
  ): Promise<string> {
    const now = serverTimestamp() as Timestamp;
    
    // Check reference ranges and set flags
    const flag = await this.calculateResultFlag(data.testId, data.value, data.unit);
    const isCritical = flag === 'critical_high' || flag === 'critical_low';

    const resultData: Omit<TestResult, 'id'> = {
      tenantId,
      orderId: data.orderId,
      sampleId: data.sampleId,
      testId: data.testId,
      patientId: '', // Will be populated from order/sample
      
      testCode: '', // Will be populated from test
      testName: '', // Will be populated from test
      loincCode: '', // Will be populated from test
      
      value: data.value,
      unit: data.unit,
      flag: data.flag || flag,
      status: 'preliminary',
      
      verificationStatus: 'unverified',
      performedBy: userId,
      performedAt: now,
      
      method: data.method,
      instrumentId: data.instrumentId,
      comments: data.comments,
      
      isCritical,
      
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
      version: 1,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.RESULTS), resultData);
    
    // If critical, trigger notification
    if (isCritical) {
      // TODO: Implement critical result notification
    }

    return docRef.id;
  },

  // Batch create results
  async createBatchResults(
    tenantId: string,
    userId: string,
    data: BatchResultEntryData
  ): Promise<string[]> {
    const batch = writeBatch(db);
    const resultIds: string[] = [];
    const now = serverTimestamp() as Timestamp;

    for (const result of data.results) {
      const flag = await this.calculateResultFlag(result.testId, result.value, result.unit);
      const isCritical = flag === 'critical_high' || flag === 'critical_low';

      const resultData: Omit<TestResult, 'id'> = {
        tenantId,
        orderId: '', // Will be populated from sample
        sampleId: data.sampleId,
        testId: result.testId,
        patientId: '', // Will be populated from sample
        
        testCode: '', // Will be populated from test
        testName: '', // Will be populated from test
        
        value: result.value,
        unit: result.unit,
        flag: result.flag || flag,
        status: 'preliminary',
        
        verificationStatus: 'unverified',
        performedBy: userId,
        performedAt: now,
        
        isCritical,
        
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
        version: 1,
      };

      const docRef = doc(collection(db, COLLECTIONS.RESULTS));
      batch.set(docRef, resultData);
      resultIds.push(docRef.id);
    }

    await batch.commit();
    return resultIds;
  },

  // Update result
  async updateResult(
    tenantId: string,
    userId: string,
    resultId: string,
    data: Partial<TestResult>
  ): Promise<void> {
    const resultRef = doc(db, COLLECTIONS.RESULTS, resultId);
    const resultDoc = await getDoc(resultRef);
    
    if (!resultDoc.exists() || resultDoc.data()?.tenantId !== tenantId) {
      throw new Error('Result not found');
    }

    await updateDoc(resultRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
      version: increment(1),
    });
  },

  // Verify result
  async verifyResult(
    tenantId: string,
    userId: string,
    resultId: string,
    comments?: string
  ): Promise<void> {
    await this.updateResult(tenantId, userId, resultId, {
      verificationStatus: 'verified',
      verifiedBy: userId,
      verifiedAt: serverTimestamp() as Timestamp,
      comments,
    });
  },

  // Approve result
  async approveResult(
    tenantId: string,
    userId: string,
    resultId: string,
    comments?: string
  ): Promise<void> {
    await this.updateResult(tenantId, userId, resultId, {
      verificationStatus: 'approved',
      status: 'final',
      approvedBy: userId,
      approvedAt: serverTimestamp() as Timestamp,
      comments,
    });
  },

  // Reject result
  async rejectResult(
    tenantId: string,
    userId: string,
    resultId: string,
    reason: string
  ): Promise<void> {
    await this.updateResult(tenantId, userId, resultId, {
      verificationStatus: 'rejected',
      status: 'cancelled',
      comments: reason,
    });
  },

  // Delete result
  async deleteResult(tenantId: string, resultId: string): Promise<void> {
    const resultRef = doc(db, COLLECTIONS.RESULTS, resultId);
    const resultDoc = await getDoc(resultRef);
    
    if (!resultDoc.exists() || resultDoc.data()?.tenantId !== tenantId) {
      throw new Error('Result not found');
    }

    await deleteDoc(resultRef);
  },

  // Calculate result flag based on reference ranges
  async calculateResultFlag(
    testId: string,
    value: string | number,
    unit?: string
  ): Promise<ResultFlag> {
    // Using parameters to avoid lint errors
    console.log('Calculating flag for:', { testId, value, unit });
    // TODO: Implement actual reference range lookup
    // For now, return normal
    return 'normal';
  },

  // Validate result against rules
  async validateResult(
    testId: string,
    value: string | number,
    patientId: string
  ): Promise<{ valid: boolean; warnings: string[]; errors: string[] }> {
    // Using parameters to avoid lint errors
    console.log('Validating result:', { testId, value, patientId });
    const warnings: string[] = [];
    const errors: string[] = [];

    // TODO: Implement validation rules
    // - Range checks
    // - Delta checks
    // - Absurd value checks
    // - Critical value checks

    return {
      valid: errors.length === 0,
      warnings,
      errors,
    };
  },

  // Get result groups
  async getResultGroups(
    tenantId: string,
    orderId: string
  ): Promise<ResultGroup[]> {
    const groupsRef = collection(db, COLLECTIONS.RESULT_GROUPS);
    const q = query(
      groupsRef,
      where('tenantId', '==', tenantId),
      where('orderId', '==', orderId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResultGroup));
  },

  // Create result report
  async createResultReport(
    tenantId: string,
    userId: string,
    orderId: string,
    resultIds: string[]
  ): Promise<string> {
    const now = serverTimestamp() as Timestamp;
    
    // Fetch results
    const results = await Promise.all(
      resultIds.map(id => this.getResult(tenantId, id))
    );
    const validResults = results.filter(r => r !== null) as TestResult[];

    const reportData: Omit<ResultReport, 'id'> = {
      tenantId,
      orderId,
      patientId: validResults[0]?.patientId || '',
      
      reportType: 'final',
      reportNumber: `RPT-${Date.now()}`,
      reportDate: now,
      
      results: validResults,
      
      generatedBy: userId,
      generatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.RESULT_REPORTS), reportData);
    return docRef.id;
  },

  // Get result statistics
  async getResultStatistics(tenantId: string): Promise<ResultStatistics> {
    const resultsRef = collection(db, COLLECTIONS.RESULTS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all results for statistics
    const allResultsQuery = query(resultsRef, where('tenantId', '==', tenantId));
    const allResultsSnapshot = await getDocs(allResultsQuery);
    
    // Get today's results
    const todayQuery = query(
      resultsRef,
      where('tenantId', '==', tenantId),
      where('performedAt', '>=', Timestamp.fromDate(today))
    );
    const todaySnapshot = await getDocs(todayQuery);

    // Get pending results
    const pendingQuery = query(
      resultsRef,
      where('tenantId', '==', tenantId),
      where('status', 'in', ['pending', 'in_progress', 'preliminary'])
    );
    const pendingSnapshot = await getDocs(pendingQuery);

    // Get critical results
    const criticalQuery = query(
      resultsRef,
      where('tenantId', '==', tenantId),
      where('isCritical', '==', true)
    );
    const criticalSnapshot = await getDocs(criticalQuery);

    // Calculate statistics
    const resultsByStatus: Record<ResultStatus, number> = {
      pending: 0,
      in_progress: 0,
      preliminary: 0,
      final: 0,
      corrected: 0,
      cancelled: 0,
    };

    const resultsByFlag: Record<ResultFlag, number> = {
      normal: 0,
      abnormal: 0,
      critical_high: 0,
      critical_low: 0,
      high: 0,
      low: 0,
    };

    allResultsSnapshot.docs.forEach(doc => {
      const result = doc.data() as TestResult;
      resultsByStatus[result.status]++;
      resultsByFlag[result.flag]++;
    });

    // Calculate verification rate
    const verifiedResults = allResultsSnapshot.docs.filter(
      doc => ['verified', 'reviewed', 'approved'].includes(doc.data().verificationStatus)
    ).length;
    const verificationRate = allResultsSnapshot.size > 0
      ? (verifiedResults / allResultsSnapshot.size) * 100
      : 0;

    return {
      totalResults: allResultsSnapshot.size,
      todaysResults: todaySnapshot.size,
      pendingResults: pendingSnapshot.size,
      criticalResults: criticalSnapshot.size,
      resultsByStatus,
      resultsByFlag,
      averageTurnaroundTime: 24, // TODO: Calculate actual TAT
      verificationRate,
    };
  },
};