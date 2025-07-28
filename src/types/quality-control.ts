import { Timestamp } from 'firebase/firestore';

export interface QCTest {
  id: string;
  testId: string;
  testName: string;
  lotNumber: string;
  levels: QCLevel[];
  manufacturer: string;
  expirationDate: Timestamp;
  status: 'active' | 'inactive' | 'expired' | 'discontinued';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QCLevel {
  id: string;
  name: string;
  targetValue: number;
  targetMean: number;
  targetSD: number;
  unit: string;
}

export interface QCResult {
  id: string;
  qcTestId: string;
  levelId: string;
  value: number;
  operatorId: string;
  operatorName: string;
  instrumentId?: string;
  runDate: Timestamp;
  acceptanceStatus: 'accepted' | 'rejected' | 'warning';
  violatedRules?: string[];
  comments?: string;
  createdAt: Timestamp;
}

export interface QCRule {
  id: string;
  name: string;
  code: string;
  description: string;
  type: 'warning' | 'rejection';
  enabled: boolean;
}

export interface QCStatistics {
  testId: string;
  levelId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  mean: number;
  sd: number;
  cv: number;
  n: number;
  withinSDCount: {
    oneSD: number;
    twoSD: number;
    threeSD: number;
  };
  bias: number;
  startDate: Timestamp;
  endDate: Timestamp;
}

export interface LeveyJenningsData {
  date: Date;
  value: number;
  mean: number;
  plusOneSD: number;
  plusTwoSD: number;
  plusThreeSD: number;
  minusOneSD: number;
  minusTwoSD: number;
  minusThreeSD: number;
  status: 'accepted' | 'warning' | 'rejected';
}
