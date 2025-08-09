import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Barcode,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/stores/toast.store';

interface ResultForVerification {
  id: string;
  sampleId: string;
  barcode: string;
  patientName: string;
  patientMrn: string;
  testName: string;
  enteredBy: string;
  enteredAt: string;
  priority: 'stat' | 'urgent' | 'routine';
  status: 'pending_verification' | 'verified' | 'rejected';
  criticalResults: boolean;
  results: Array<{
    parameter: string;
    value: string;
    unit: string;
    reference: string;
    flag?: 'H' | 'L' | 'C';
    previousValue?: string;
    delta?: string;
  }>;
  notes?: string;
}

export const VerificationScreen: React.FC = () => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'stat'>('all');
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const resultsForVerification: ResultForVerification[] = [
    {
      id: 'VER001',
      sampleId: 'LAB001',
      barcode: 'B123456789',
      patientName: 'John Doe',
      patientMrn: 'MRN123456',
      testName: 'Complete Blood Count',
      enteredBy: 'Sarah J.',
      enteredAt: '2024-10-27T10:30:00',
      priority: 'stat',
      status: 'pending_verification',
      criticalResults: true,
      results: [
        { 
          parameter: 'Hemoglobin', 
          value: '7.2', 
          unit: 'g/dL', 
          reference: '13.5-17.5', 
          flag: 'C',
          previousValue: '8.5',
          delta: '-15.3%'
        },
        { 
          parameter: 'WBC', 
          value: '15.8', 
