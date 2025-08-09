import { useRef, useEffect, useCallback, useState } from 'react';
import { WorkerManager } from '@/utils/performance';

interface UseWorkerOptions {
  workerUrl: string;
  workerName: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
}

interface WorkerState {
  loading: boolean;
  error: Error | null;
  result: any;
}

export function useWorker(options: UseWorkerOptions) {
  const { workerUrl, workerName, onMessage, onError } = options;
  const workerManagerRef = useRef<WorkerManager>();
  const workerRef = useRef<Worker>();
  const [state, setState] = useState<WorkerState>({
    loading: false,
    error: null,
    result: null,
  });

  useEffect(() => {
    workerManagerRef.current = new WorkerManager();
    
    try {
      workerRef.current = workerManagerRef.current.createWorker(workerName, workerUrl);
      
      workerRef.current.onmessage = (event) => {
        setState({
          loading: false,
          error: null,
          result: event.data.result,
        });
        onMessage?.(event.data);
      };
      
      workerRef.current.onerror = (event) => {
        const error = new Error('Worker error');
        setState({
          loading: false,
          error,
          result: null,
        });
        onError?.(event);
      };
    } catch (error) {
      setState({
        loading: false,
        error: error as Error,
        result: null,
      });
    }

    return () => {
      workerManagerRef.current?.terminateAll();
    };
  }, [workerUrl, workerName, onError, onMessage]);

  const postMessage = useCallback((message: any) => {
    if (!workerRef.current) {
      console.error('Worker not initialized');
      return;
    }
    
    setState(prev => ({ ...prev, loading: true }));
    workerRef.current.postMessage(message);
  }, []);

  const terminate = useCallback(() => {
    if (workerManagerRef.current && workerRef.current) {
      workerManagerRef.current.terminateWorker(workerName);
      workerRef.current = undefined;
    }
  }, [workerName]);

  return {
    postMessage,
    terminate,
    loading: state.loading,
    error: state.error,
    result: state.result,
  };
}

// Specialized hook for data processing worker
export function useDataProcessor() {
  const worker = useWorker({
    workerUrl: new URL('@/workers/dataProcessor.worker.ts', import.meta.url).href,
    workerName: 'dataProcessor',
  });

  const processResults = useCallback((results: any[]) => {
    worker.postMessage({
      type: 'PROCESS_RESULTS',
      data: results,
    });
  }, [worker]);

  const calculateStatistics = useCallback((data: number[]) => {
    worker.postMessage({
      type: 'CALCULATE_STATISTICS',
      data,
    });
  }, [worker]);

  const exportData = useCallback((items: any[], columns: string[]) => {
    worker.postMessage({
      type: 'EXPORT_DATA',
      data: { items, columns },
    });
  }, [worker]);

  const validateBatch = useCallback((batch: any[]) => {
    worker.postMessage({
      type: 'VALIDATE_BATCH',
      data: batch,
    });
  }, [worker]);

  return {
    ...worker,
    processResults,
    calculateStatistics,
    exportData,
    validateBatch,
  };
}