import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Thermometer, 
  MapPin, 
  Save,
  X,
  CheckCircle,
  FileText,
  User
} from 'lucide-react';
import { BarcodeScanner } from '@capacitor/barcode-scanner';
import { Camera as CapacitorCamera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { useOfflineStore } from '@/mobile/stores/offline.store';
import { toast } from '@/hooks/useToast';

interface CollectionData {
  patientId: string;
  patientName: string;
  orderId: string;
  tests: string[];
  barcode: string;
  temperature?: number;
  notes: string;
  photos: string[];
  consent: boolean;
}

const PhlebotomistCollectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { addCollection } = useOfflineStore();
  const [step, setStep] = useState(1); // 1: Patient, 2: Sample, 3: Review
  const [isScanning, setIsScanning] = useState(false);
  
  const [collectionData, setCollectionData] = useState<CollectionData>({
    patientId: '',
    patientName: '',
    orderId: '',
    tests: [],
    barcode: '',
    temperature: undefined,
    notes: '',
    photos: [],
    consent: false,
  });

  const startBarcodeScan = async () => {
    try {
      await BarcodeScanner.checkPermission({ force: true });
      
      setIsScanning(true);
      document.querySelector('body')?.classList.add('barcode-scanner-active');
      
      const result = await BarcodeScanner.startScan();
      
      if (result.hasContent) {
        setCollectionData({ ...collectionData, barcode: result.content });
        toast.success('Barcode scanned successfully');
      }
    } catch (error) {
      console.error('Barcode scan failed:', error);
      toast.error('Failed to scan barcode');
    } finally {
      setIsScanning(false);
      document.querySelector('body')?.classList.remove('barcode-scanner-active');
      BarcodeScanner.stopScan();
    }
  };

  const takePhoto = async () => {
    try {
      const photo = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
      });

      if (photo.base64String) {
        setCollectionData({
          ...collectionData,
          photos: [...collectionData.photos, photo.base64String],
        });
        toast.success('Photo captured');
      }
    } catch (error) {
      console.error('Failed to capture photo:', error);
      toast.error('Failed to capture photo');
    }
  };

  const saveCollection = async () => {
    try {
      // Get current location
      const position = await Geolocation.getCurrentPosition();
      
      // Save to offline store
      await addCollection({
        ...collectionData,
        collectedAt: new Date(),
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: '123 Main St', // In real app, would reverse geocode
        },
      });

      toast.success('Collection saved successfully');
      navigate('/home');
    } catch (error) {
      console.error('Failed to save collection:', error);
      toast.error('Failed to save collection');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID
              </label>
              <input
                type="text"
                value={collectionData.patientId}
                onChange={(e) => setCollectionData({ ...collectionData, patientId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter patient ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name
              </label>
              <input
                type="text"
                value={collectionData.patientName}
                onChange={(e) => setCollectionData({ ...collectionData, patientName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter patient name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order ID
              </label>
              <input
                type="text"
                value={collectionData.orderId}
                onChange={(e) => setCollectionData({ ...collectionData, orderId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter order ID"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={collectionData.consent}
                  onChange={(e) => setCollectionData({ ...collectionData, consent: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Patient consent obtained</span>
              </label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Sample Collection</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Barcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={collectionData.barcode}
                  onChange={(e) => setCollectionData({ ...collectionData, barcode: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Scan or enter barcode"
                />
                <button
                  onClick={startBarcodeScan}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                >
                  Scan
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={collectionData.temperature || ''}
                  onChange={(e) => setCollectionData({ 
                    ...collectionData, 
                    temperature: parseFloat(e.target.value) || undefined 
                  })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter temperature"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={collectionData.notes}
                onChange={(e) => setCollectionData({ ...collectionData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Add any notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos ({collectionData.photos.length})
              </label>
              <button
                onClick={takePhoto}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
              >
                <Camera className="h-5 w-5" />
                Take Photo
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Review & Confirm</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Patient</p>
                  <p className="text-sm text-gray-600">{collectionData.patientName} (ID: {collectionData.patientId})</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Order</p>
                  <p className="text-sm text-gray-600">{collectionData.orderId}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Barcode</p>
                  <p className="text-sm text-gray-600">{collectionData.barcode || 'Not scanned'}</p>
                </div>
              </div>

              {collectionData.temperature && (
                <div className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Temperature</p>
                    <p className="text-sm text-gray-600">{collectionData.temperature}°C</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-700">Consent obtained</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                This collection will be saved offline and synced when internet is available.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Sample Collection</h1>
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i <= step ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i}
              </div>
              {i < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    i < step ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 py-4">
        {renderStep()}
      </div>

      {/* Bottom Actions */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
            >
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && (!collectionData.patientId || !collectionData.patientName || !collectionData.consent)) ||
                (step === 2 && !collectionData.barcode)
              }
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={saveCollection}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              Save Collection
            </button>
          )}
        </div>
      </div>

      {/* Barcode Scanner Overlay */}
      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="text-white text-center">
            <p className="mb-4">Position barcode in the frame</p>
            <button
              onClick={() => {
                setIsScanning(false);
                BarcodeScanner.stopScan();
              }}
              className="px-6 py-2 bg-white text-black rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhlebotomistCollectionPage;