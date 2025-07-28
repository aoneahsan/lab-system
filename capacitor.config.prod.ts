import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.labflow.app',
  appName: 'LabFlow',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#ffffff',
  server: {
    url: 'https://labflow.app',
    cleartext: false,
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
    backgroundColor: '#ffffff',
    overrideUserAgent: 'LabFlow/1.0.0'
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
    overrideUserAgent: 'LabFlow/1.0.0'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0ea5e9',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#0ea5e9',
      sound: 'beep.wav',
    },
    Camera: {
      permissions: {
        photos: 'The app needs access to your photos to upload patient documents.',
        camera: 'The app needs access to your camera to take photos of test results.',
      },
    },
    Geolocation: {
      permissions: {
        location: 'The app needs access to your location for sample collection tracking.',
      },
    },
  },
};

export default config;