import { Capacitor } from '@capacitor/core';
import { CapacitorNativeUpdate } from 'capacitor-native-update';
import { toast } from '@/stores/toast.store';

interface UpdateCheckResult {
  available: boolean;
  version?: string;
  updateType?: 'live' | 'native';
  mandatory?: boolean;
}

interface UpdateProgress {
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
}

// App Update Service using capacitor-native-update v2.0.0
export const appUpdateService = {
  // Initialize the update service
  initialize: async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('App updates are only available on native platforms');
      return;
    }

    try {
      // Configure update service
      await CapacitorNativeUpdate.configure({
        updateUrl: import.meta.env.VITE_UPDATE_SERVER_URL || 'https://api.labflow.app/updates/v1',
        autoCheck: true,
        publicKey: import.meta.env.VITE_UPDATE_PUBLIC_KEY || '',
        channel: import.meta.env.VITE_UPDATE_CHANNEL || 'production',
        checkInterval: 3600000, // Check every hour
        updateStrategy: 'background', // background, immediate, or manual
      });

      console.log('📱 Native update service initialized');
      
      // Check for updates on startup
      await appUpdateService.checkForUpdates(true);
    } catch (error) {
      console.error('Failed to initialize update service:', error);
    }
  },

  // Check for both live and native updates
  checkForUpdates: async (silent = false): Promise<UpdateCheckResult> => {
    if (!Capacitor.isNativePlatform()) {
      return { available: false };
    }

    try {
      // First check for live/OTA updates
      const liveUpdate = await CapacitorNativeUpdate.checkForUpdate();
      
      if (liveUpdate.available) {
        if (!silent) {
          const message = liveUpdate.mandatory 
            ? `A mandatory update (v${liveUpdate.version}) is available.`
            : `An update (v${liveUpdate.version}) is available.`;
          
          toast.info('Update Available', message);
        }
        
        return {
          available: true,
          version: liveUpdate.version,
          updateType: 'live',
          mandatory: liveUpdate.mandatory
        };
      }

      // Then check for native app store updates
      const nativeUpdate = await CapacitorNativeUpdate.checkAppUpdate();
      
      if (nativeUpdate.updateAvailable) {
        if (!silent) {
          toast.info(
            'App Store Update', 
            `A new version (v${nativeUpdate.minimumVersion}) is available in the app store.`
          );
        }
        
        return {
          available: true,
          version: nativeUpdate.minimumVersion,
          updateType: 'native',
          mandatory: nativeUpdate.updateAvailability === 'UPDATE_REQUIRED'
        };
      }

      if (!silent) {
        toast.success('Up to Date', 'You have the latest version of LabFlow.');
      }
      
      return { available: false };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      if (!silent) {
        toast.error('Update Check Failed', 'Unable to check for updates. Please try again later.');
      }
      return { available: false };
    }
  },

  // Download live update with progress tracking
  downloadUpdate: async (onProgress?: (progress: UpdateProgress) => void): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      await CapacitorNativeUpdate.downloadUpdate({
        onProgress: (progress) => {
          console.log(`Download progress: ${progress.percent}%`);
          if (onProgress) {
            onProgress(progress);
          }
        }
      });
      
      toast.success('Download Complete', 'Update downloaded successfully.');
      return true;
    } catch (error) {
      console.error('Failed to download update:', error);
      toast.error('Download Failed', 'Unable to download the update. Please try again.');
      return false;
    }
  },

  // Apply the downloaded update (will restart the app)
  applyUpdate: async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      toast.info('Applying Update', 'The app will restart to apply the update...');
      
      // Give user time to see the message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Apply update - this will restart the app
      await CapacitorNativeUpdate.applyUpdate();
    } catch (error) {
      console.error('Failed to apply update:', error);
      toast.error('Update Failed', 'Unable to apply the update. Please restart the app manually.');
    }
  },

  // Open app store for native update
  openAppStore: async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await CapacitorNativeUpdate.openAppStore();
    } catch (error) {
      console.error('Failed to open app store:', error);
      toast.error('Error', 'Unable to open the app store.');
    }
  },

  // Get current version information
  getCurrentVersion: async () => {
    if (!Capacitor.isNativePlatform()) {
      return {
        native: import.meta.env.VITE_APP_VERSION || '1.0.0',
        build: import.meta.env.VITE_APP_BUILD || '1',
        live: null
      };
    }

    try {
      const versionInfo = await CapacitorNativeUpdate.getCurrentVersion();
      return {
        native: versionInfo.versionName,
        build: versionInfo.versionCode,
        live: versionInfo.liveUpdateVersion || null
      };
    } catch (error) {
      console.error('Failed to get version info:', error);
      return {
        native: 'Unknown',
        build: 'Unknown',
        live: null
      };
    }
  },

  // Check if running a live update
  isLiveUpdate: async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const result = await CapacitorNativeUpdate.isLiveUpdate();
      return result.isLiveUpdate;
    } catch (error) {
      console.error('Failed to check live update status:', error);
      return false;
    }
  },

  // Reload the app (useful for applying configuration changes)
  reload: async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      window.location.reload();
      return;
    }

    try {
      await CapacitorNativeUpdate.reload();
    } catch (error) {
      console.error('Failed to reload app:', error);
      // Fallback to web reload
      window.location.reload();
    }
  },

  // Reset to the original bundle (removes live updates)
  reset: async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await CapacitorNativeUpdate.reset();
      toast.success('Reset Complete', 'The app has been reset to the original version.');
      
      // Reload after reset
      await appUpdateService.reload();
    } catch (error) {
      console.error('Failed to reset app:', error);
      toast.error('Reset Failed', 'Unable to reset the app.');
    }
  },

  // Request in-app review
  requestReview: async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      // For web, could redirect to a review page
      return false;
    }

    try {
      const result = await CapacitorNativeUpdate.requestReview();
      return result.presented;
    } catch (error) {
      console.error('Failed to request review:', error);
      return false;
    }
  }
};

// Helper function to handle update flow
export const handleUpdateFlow = async (updateInfo: UpdateCheckResult) => {
  if (!updateInfo.available) return;

  if (updateInfo.updateType === 'native') {
    // For native updates, open app store
    await appUpdateService.openAppStore();
  } else if (updateInfo.updateType === 'live') {
    // For live updates, download and apply
    if (updateInfo.mandatory) {
      // For mandatory updates, download and apply immediately
      const downloaded = await appUpdateService.downloadUpdate((progress) => {
        // Could show a progress modal here
        console.log(`Downloading mandatory update: ${progress.percent}%`);
      });
      
      if (downloaded) {
        await appUpdateService.applyUpdate();
      }
    } else {
      // For optional updates, let user choose
      toast.info(
        'Update Available',
        `Version ${updateInfo.version} is available. Would you like to update now?`,
        {
          action: {
            label: 'Update',
            onClick: async () => {
              const downloaded = await appUpdateService.downloadUpdate();
              if (downloaded) {
                await appUpdateService.applyUpdate();
              }
            }
          }
        }
      );
    }
  }
};