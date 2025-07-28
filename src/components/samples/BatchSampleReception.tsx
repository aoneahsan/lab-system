import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Package, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
// import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
// import { Badge } from '@/components/ui/Badge';
import BarcodeScanner from './BarcodeScanner';
import { useSampleStore } from '@/stores/sample.store';
import { useAnalyzerStore } from '@/stores/analyzer.store';
import { useDepartmentStore } from '@/stores/department.store';
import { toast } from 'sonner';
import type { Sample, SampleStatus } from '@/types/sample.types';

interface ScannedSample {
  barcode: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  sample?: Sample;
  timestamp: Date;
}

export const BatchSampleReception: React.FC = () => {
  const [scannedSamples, setScannedSamples] = useState<ScannedSample[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedAnalyzer, setSelectedAnalyzer] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const lastScanRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { getSampleByBarcode, updateBatchSamples } = useSampleStore();
  const { analyzers } = useAnalyzerStore();
  const { departments } = useDepartmentStore();

  useEffect(() => {
    // Initialize audio for scan feedback
    audioRef.current = new Audio('/sounds/beep.mp3');
  }, []);

  const handleScan = useCallback(
    async (barcode: string) => {
      // Prevent duplicate scans
      if (
        lastScanRef.current === barcode &&
        Date.now() - new Date(scannedSamples[scannedSamples.length - 1]?.timestamp || 0).getTime() <
          2000
      ) {
        return;
      }

      lastScanRef.current = barcode;

      // Check if already scanned
      if (scannedSamples.some((s) => s.barcode === barcode)) {
        toast.warning('Sample already scanned');
        return;
      }

      // Add to scanned list
      const newScan: ScannedSample = {
        barcode,
        status: 'pending',
        timestamp: new Date(),
      };

      setScannedSamples((prev) => [...prev, newScan]);

      try {
        // Fetch sample details
        const sample = await getSampleByBarcode(barcode);

        if (!sample) {
          throw new Error('Sample not found');
        }

        if (sample.status !== 'in_transit' && sample.status !== 'collected') {
          throw new Error(`Sample already ${sample.status}`);
        }

        // Play success sound
        audioRef.current?.play().catch(() => {});

        // Haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }

        setScannedSamples((prev) =>
          prev.map((s) => (s.barcode === barcode ? { ...s, status: 'success', sample } : s))
        );
      } catch (error) {
        setScannedSamples((prev) =>
          prev.map((s) =>
            s.barcode === barcode
              ? {
                  ...s,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Unknown error',
                }
              : s
          )
        );
      }

      // Continue scanning if in continuous mode
      if (continuousMode && isScanning) {
        // Small delay before next scan
        setTimeout(() => {
          setIsScanning(true);
        }, 500);
      }
    },
    [scannedSamples, getSampleByBarcode, continuousMode, isScanning]
  );

  const handleBatchReceive = async () => {
    const validSamples = scannedSamples.filter((s) => s.status === 'success' && s.sample);

    if (validSamples.length === 0) {
      toast.error('No valid samples to receive');
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare batch update data
      const updates = validSamples.map((s) => ({
        id: s.sample!.id,
        status: 'received' as SampleStatus,
        receivedAt: new Date(),
        receivedBy: 'current-user', // TODO: Get from auth context
        ...(selectedDepartment && { departmentId: selectedDepartment }),
        ...(selectedAnalyzer && { analyzerId: selectedAnalyzer }),
        chainOfCustody: [
          ...(s.sample!.chainOfCustody || []),
          {
            action: 'received',
            timestamp: new Date(),
            userId: 'current-user', // TODO: Get from auth context
            location: 'Reception',
            notes: `Batch received${
              selectedDepartment
                ? ` - Assigned to ${departments.find((d) => d.id === selectedDepartment)?.name}`
                : ''
            }`,
          },
        ],
      }));

      await updateBatchSamples(updates);

      toast.success(`Successfully received ${validSamples.length} samples`);

      // Clear scanned list
      setScannedSamples([]);
      lastScanRef.current = '';
    } catch (error) {
      toast.error('Failed to receive samples');
      console.error('Batch receive error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeSample = (barcode: string) => {
    setScannedSamples((prev) => prev.filter((s) => s.barcode !== barcode));
  };

  const clearAll = () => {
    setScannedSamples([]);
    lastScanRef.current = '';
  };

  const successCount = scannedSamples.filter((s) => s.status === 'success').length;
  const errorCount = scannedSamples.filter((s) => s.status === 'error').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Sample Reception</CardTitle>
          <CardDescription>Scan multiple samples for quick reception and routing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department (Optional)" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAnalyzer} onChange={(e) => setSelectedAnalyzer(e.target.value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Analyzer (Optional)" />
              </SelectTrigger>
              <SelectContent>
                {analyzers
                  .filter((a) => !selectedDepartment || a.departmentId === selectedDepartment)
                  .map((analyzer) => (
                    <SelectItem key={analyzer.id} value={analyzer.id}>
                      {analyzer.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="continuous"
                checked={continuousMode}
                onChange={(e) => setContinuousMode(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="continuous" className="text-sm">
                Continuous Scanning
              </label>
            </div>
          </div>

          {/* Scanner */}
          {isScanning ? (
            <div className="border rounded-lg p-4">
              <BarcodeScanner
                isOpen={isScanning}
                onClose={() => setIsScanning(false)}
                onScan={handleScan}
              />
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setIsScanning(false)}
              >
                Stop Scanning
              </Button>
            </div>
          ) : (
            <Button className="w-full" size="lg" onClick={() => setIsScanning(true)}>
              <Scan className="mr-2 h-5 w-5" />
              Start Scanning
            </Button>
          )}

          {/* Statistics */}
          {scannedSamples.length > 0 && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{scannedSamples.length}</div>
                  <p className="text-xs text-muted-foreground">Total Scanned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Scanned Samples List */}
          {scannedSamples.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Scanned Samples</h3>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>

              {scannedSamples.map((scan) => (
                <div
                  key={scan.barcode}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {scan.status === 'pending' && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {scan.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {scan.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}

                    <div>
                      <p className="font-mono text-sm">{scan.barcode}</p>
                      {scan.sample && (
                        <p className="text-xs text-muted-foreground">
                          Sample #{scan.sample.sampleNumber}
                        </p>
                      )}
                      {scan.error && <p className="text-xs text-red-500">{scan.error}</p>}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" onClick={() => removeSample(scan.barcode)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {successCount > 0 && (
            <div className="flex space-x-2">
              <Button className="flex-1" onClick={handleBatchReceive} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Receive {successCount} Samples
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
