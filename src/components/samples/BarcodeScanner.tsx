import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Flashlight, FlashlightOff } from 'lucide-react';
import { BarcodeScanner as CapacitorBarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/stores/toast.store';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  supportedFormats?: string[];
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  supportedFormats = ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'QR_CODE', 'DATA_MATRIX'],
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && Capacitor.isNativePlatform()) {
      checkPermission();
    }

    return () => {
      if (isScanning) {
        stopScan();
      }
    };
  }, [isOpen]);

  const checkPermission = async () => {
    try {
      const status = await CapacitorBarcodeScanner.checkPermission({ force: false });
      
      if (status.granted) {
        setHasPermission(true);
        startScan();
      } else if (status.denied) {
        setHasPermission(false);
        toast.error('Camera Permission Denied', 'Please enable camera access in settings');
      } else if (status.asked) {
        // Permission was asked before but not granted
        setHasPermission(false);
      } else {
        // Permission not asked yet
        const newStatus = await CapacitorBarcodeScanner.checkPermission({ force: true });
        setHasPermission(newStatus.granted === true ? true : false);
        if (newStatus.granted) {
          startScan();
        }
      }
    } catch (error) {
      console.error('Permission check error:', error);
      toast.error('Permission Error', 'Failed to check camera permission');
    }
  };

  const startScan = async () => {
    try {
      // Hide background for camera view
      document.body.classList.add('scanner-active');
      
      await CapacitorBarcodeScanner.hideBackground();
      setIsScanning(true);

      const result = await CapacitorBarcodeScanner.startScan({
        targetedFormats: supportedFormats as any,
      });

      if (result.hasContent) {
        onScan(result.content);
        toast.success('Barcode Scanned', `Code: ${result.content}`);
        handleClose();
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Scan Failed', 'Failed to start barcode scanner');
      handleClose();
    }
  };

  const stopScan = async () => {
    try {
      await CapacitorBarcodeScanner.stopScan();
      await CapacitorBarcodeScanner.showBackground();
      document.body.classList.remove('scanner-active');
      setIsScanning(false);
    } catch (error) {
      console.error('Stop scan error:', error);
    }
  };

  const toggleTorch = async () => {
    try {
      if (torchEnabled) {
        await CapacitorBarcodeScanner.disableTorch();
      } else {
        await CapacitorBarcodeScanner.enableTorch();
      }
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error('Torch toggle error:', error);
      toast.error('Torch Error', 'Failed to toggle flashlight');
    }
  };

  const handleClose = () => {
    if (isScanning) {
      stopScan();
    }
    onClose();
  };

  // For web platform, show alternative input
  if (!Capacitor.isNativePlatform()) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Scan Barcode</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="text-center py-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Barcode scanning is only available on mobile devices
            </p>
            <p className="text-sm text-gray-500">
              Please enter the barcode manually or use the mobile app
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Barcode Manually
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter barcode number"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  onScan(e.currentTarget.value);
                  onClose();
                }
              }}
              autoFocus
            />
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Scanner View */}
      <div ref={scannerRef} className="absolute inset-0 bg-black">
        {isScanning && (
          <>
            {/* Scanner UI Overlay */}
            <div className="absolute inset-0 flex flex-col">
              {/* Header */}
              <div className="bg-black bg-opacity-50 p-4 flex justify-between items-center">
                <button
                  onClick={handleClose}
                  className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-6 w-6" />
                </button>
                
                <h3 className="text-white text-lg font-medium">Scan Barcode</h3>
                
                <button
                  onClick={toggleTorch}
                  className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  {torchEnabled ? (
                    <FlashlightOff className="h-6 w-6" />
                  ) : (
                    <Flashlight className="h-6 w-6" />
                  )}
                </button>
              </div>

              {/* Scanning Area */}
              <div className="flex-1 relative">
                {/* Scanning Frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 relative">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-0 h-0.5 bg-red-500 animate-scan"></div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-8 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-50 rounded px-4 py-2 inline-block">
                    Align barcode within the frame
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Permission Denied Message */}
        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white p-6">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Camera Permission Required</h3>
              <p className="text-sm opacity-75 mb-4">
                Please enable camera access in your device settings to scan barcodes
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-white text-black rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;