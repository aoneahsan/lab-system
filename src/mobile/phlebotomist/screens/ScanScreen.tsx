import React, { useState } from 'react';
import { QrCode, Camera, Package, User, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/stores/toast.store';

export const ScanScreen: React.FC = () => {
  const [scanMode, setScanMode] = useState<'patient' | 'sample' | 'tube'>('patient');
  const [lastScan, setLastScan] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    try {
      setIsScanning(true);
      // TODO: Implement actual barcode scanning using capacitor plugin
      // Simulating scan result
      setTimeout(() => {
        const mockResults = {
          patient: {
            type: 'patient',
            patientId: 'P12345',
            name: 'John Doe',
            dob: '1980-05-15',
            mrn: 'MRN123456',
          },
          sample: {
            type: 'sample',
            sampleId: 'S20241027001',
            patientId: 'P12345',
            collectionDate: new Date().toISOString(),
            tests: ['CBC', 'Lipid Panel'],
          },
          tube: {
            type: 'tube',
            tubeId: 'T20241027001',
            tubeType: 'EDTA',
            color: 'purple',
            expiry: '2025-12-31',
          },
        };

        setLastScan(mockResults[scanMode]);
        setIsScanning(false);
        toast.success('Scan Successful', `${scanMode} information captured`);
      }, 1500);
    } catch (_error) {
      setIsScanning(false);
      toast.error('Scan Failed', 'Please try again');
    }
  };

  const renderScanResult = () => {
    if (!lastScan) return null;

    switch (lastScan.type) {
      case 'patient':
        return (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-indigo-600" />
              <h3 className="font-medium text-gray-900">Patient Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{lastScan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Patient ID:</span>
                <span className="font-medium">{lastScan.patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DOB:</span>
                <span className="font-medium">{lastScan.dob}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">MRN:</span>
                <span className="font-medium">{lastScan.mrn}</span>
              </div>
            </div>
            <button className="w-full mt-4 btn btn-primary btn-sm">
              View Patient Orders
            </button>
          </div>
        );

      case 'sample':
        return (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-green-600" />
              <h3 className="font-medium text-gray-900">Sample Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sample ID:</span>
                <span className="font-medium">{lastScan.sampleId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Patient ID:</span>
                <span className="font-medium">{lastScan.patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Collection Date:</span>
                <span className="font-medium">
                  {new Date(lastScan.collectionDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Tests:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {lastScan.tests.map((test: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button className="w-full mt-4 btn btn-primary btn-sm">
              Track Sample
            </button>
          </div>
        );

      case 'tube':
        return (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-purple-600" />
              <h3 className="font-medium text-gray-900">Tube Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tube ID:</span>
                <span className="font-medium">{lastScan.tubeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium">{lastScan.tubeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Color:</span>
                <span className="font-medium capitalize">{lastScan.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expiry:</span>
                <span className="font-medium">{lastScan.expiry}</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-800">Tube is valid and not expired</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-semibold text-gray-900">Barcode Scanner</h1>
        <p className="text-sm text-gray-500 mt-1">
          Scan patient wristbands, sample labels, or tube barcodes
        </p>
      </div>

      {/* Scan Mode Selector */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-1">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setScanMode('patient')}
              className={`py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                scanMode === 'patient'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Patient
            </button>
            <button
              onClick={() => setScanMode('sample')}
              className={`py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                scanMode === 'sample'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Sample
            </button>
            <button
              onClick={() => setScanMode('tube')}
              className={`py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                scanMode === 'tube'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tube
            </button>
          </div>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-square bg-gray-900 relative flex items-center justify-center">
            {isScanning ? (
              <div className="text-center">
                <div className="animate-pulse">
                  <QrCode className="h-24 w-24 text-white mx-auto mb-4" />
                </div>
                <p className="text-white">Scanning...</p>
              </div>
            ) : (
              <div className="text-center">
                <Camera className="h-24 w-24 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Tap to start scanning</p>
              </div>
            )}
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full py-4 bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isScanning ? 'Scanning...' : `Scan ${scanMode}`}
          </button>
        </div>
      </div>

      {/* Scan Result */}
      <div className="px-4">
        {renderScanResult()}
      </div>

      {/* Instructions */}
      {!lastScan && (
        <div className="p-4 mt-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Scanning Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ensure barcode is clean and undamaged</li>
                  <li>Hold device steady while scanning</li>
                  <li>Keep barcode within the camera frame</li>
                  <li>Avoid glare and shadows on barcode</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};