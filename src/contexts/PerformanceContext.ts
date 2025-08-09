import { useContext } from 'react';
import { PerformanceContext } from '@/providers/PerformanceProvider';

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
}