import React, { useState, useEffect } from 'react';
import { X, FlashlightOff, Flashlight, RotateCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner as CapacitorBarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  title?: string;
  hint?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  title = 'Scan Barcode',
  hint = 'Position the barcode within the frame',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      startScanning();
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        CapacitorBarcodeScanner.stopScan();
      }
    };
  }, []);

  const checkPermissions = async () => {
    const status = await CapacitorBarcodeScanner.checkPermission({ force: true });
    return status.granted;
  };

  const startScanning = async () => {
    const hasPermission = await checkPermissions();
    setHasPermission(hasPermission);

    if (!hasPermission) {
      return;
    }

    // Make background transparent for camera view
    document.body.classList.add('scanner-active');
    
    setIsScanning(true);
    const result = await CapacitorBarcodeScanner.startScan();

    if (result.hasContent) {
      await Haptics.impact({ style: ImpactStyle.Medium });
      onScan(result.content);
      handleClose();
    }
  };

  const toggleTorch = async () => {
    const newState = !torchEnabled;
    setTorchEnabled(newState);
    await CapacitorBarcodeScanner.toggleTorch();
    await Haptics.impact({ style: ImpactStyle.Light });
  };

  const handleClose = () => {
    if (Capacitor.isNativePlatform()) {
      CapacitorBarcodeScanner.stopScan();
    }
    document.body.classList.remove('scanner-active');
    onClose();
  };

  // For web fallback
  if (!Capacitor.isNativePlatform()) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <p className="text-gray-600 mb-4">
            Barcode scanning is only available on mobile devices.
          </p>
          <input
            type="text"
            placeholder="Enter barcode manually"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                onScan(e.currentTarget.value);
                onClose();
              }
            }}
            autoFocus
          />
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-800 rounded-lg py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!hasPermission && isScanning) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
          <h3 className="text-lg font-semibold mb-4">Camera Permission Required</h3>
          <p className="text-gray-600 mb-4">
            Please allow camera access to scan barcodes.
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-indigo-600 text-white rounded-lg py-2"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Scanner UI Overlay */}
      <div className="absolute inset-0 bg-transparent">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-black/50 px-4 pt-safe pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-lg font-semibold">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 text-white active:opacity-70"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scanning Frame */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Frame corners */}
            <div className="absolute -top-4 -left-4 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute -top-4 -right-4 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-lg" />
            
            {/* Scan area */}
            <div className="w-64 h-64 border-2 border-white/30" />
            
            {/* Scan line animation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500 animate-scan" />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-4 pb-safe pt-4">
          <p className="text-white text-center mb-4">{hint}</p>
          
          <div className="flex justify-center space-x-8">
            <button
              onClick={toggleTorch}
              className="p-3 bg-white/20 rounded-full active:bg-white/30"
            >
              {torchEnabled ? (
                <Flashlight className="w-6 h-6 text-white" />
              ) : (
                <FlashlightOff className="w-6 h-6 text-white" />
              )}
            </button>
            
            <button
              onClick={() => {
                // Switch camera if available
              }}
              className="p-3 bg-white/20 rounded-full active:bg-white/30"
            >
              <RotateCw className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};