import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowDownTrayIcon, 
  ArrowPathIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { appUpdateService } from '@/services/app-update.service';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/stores/toast.store';

export const AppUpdateSettings: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    loadVersionInfo();
  }, []);

  const loadVersionInfo = async () => {
    const info = await appUpdateService.getCurrentVersion();
    setVersionInfo(info);
  };

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const result = await appUpdateService.checkForUpdates();
      setUpdateInfo(result);
      
      if (!result.available) {
        toast.success('Up to Date', 'You have the latest version of LabFlow.');
      }
    } finally {
      setChecking(false);
    }
  };

  const downloadUpdate = async () => {
    if (!updateInfo || !updateInfo.available || updateInfo.updateType !== 'live') return;
    
    setDownloading(true);
    setDownloadProgress(0);
    
    try {
      const success = await appUpdateService.downloadUpdate((progress) => {
        setDownloadProgress(progress.percent);
      });
      
      if (success) {
        toast.success('Download Complete', 'Update is ready to install.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const applyUpdate = async () => {
    await appUpdateService.applyUpdate();
  };

  const resetApp = async () => {
    if (confirm('This will remove all live updates and reset the app to its original state. Continue?')) {
      await appUpdateService.reset();
    }
  };

  const requestReview = async () => {
    const presented = await appUpdateService.requestReview();
    if (!presented) {
      toast.info('Review', 'Thank you for considering to review LabFlow!');
    }
  };

  if (!isNative) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <InformationCircleIcon className="h-12 w-12 mx-auto mb-2" />
          <p>App updates are managed through your web browser.</p>
          <p className="text-sm mt-2">Current version: {versionInfo?.native || 'Unknown'}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Version Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Version Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">App Version:</span>
            <span className="font-medium">{versionInfo?.native || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Build Number:</span>
            <span className="font-medium">{versionInfo?.build || 'Unknown'}</span>
          </div>
          {versionInfo?.live && (
            <div className="flex justify-between">
              <span className="text-gray-600">Live Update:</span>
              <span className="font-medium">{versionInfo.live}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Update Status */}
      {updateInfo?.available && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-blue-900">Update Available</h4>
              <p className="text-sm text-blue-700 mt-1">
                Version {updateInfo.version} is available for download.
                {updateInfo.mandatory && ' This is a mandatory update.'}
              </p>
              {updateInfo.updateType === 'live' ? (
                <div className="mt-3 space-y-2">
                  {downloading ? (
                    <div className="w-full">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Downloading...</span>
                        <span>{downloadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : downloadProgress === 100 ? (
                    <Button
                      onClick={applyUpdate}
                      className="w-full"
                      variant="primary"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Install Update
                    </Button>
                  ) : (
                    <Button
                      onClick={downloadUpdate}
                      className="w-full"
                      variant="primary"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download Update
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => appUpdateService.openAppStore()}
                  className="mt-3"
                  variant="primary"
                >
                  Open App Store
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Update Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Update Settings</h3>
        <div className="space-y-3">
          <Button
            onClick={checkForUpdates}
            disabled={checking}
            variant="outline"
            className="w-full"
          >
            {checking ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Checking for Updates...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Check for Updates
              </>
            )}
          </Button>

          <Button
            onClick={requestReview}
            variant="outline"
            className="w-full"
          >
            Rate LabFlow
          </Button>

          {versionInfo?.live && (
            <Button
              onClick={resetApp}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700"
            >
              Reset to Original Version
            </Button>
          )}
        </div>
      </Card>

      {/* Auto-Update Status */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Automatic Updates</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              LabFlow automatically checks for updates when you open the app.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Critical updates will be downloaded automatically.
            </p>
          </div>
          <Badge variant="success">Enabled</Badge>
        </div>
      </Card>
    </div>
  );
};