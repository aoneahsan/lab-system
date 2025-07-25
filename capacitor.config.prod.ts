import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.labflow.app',
  appName: 'LabFlow',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://labflow.example.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1f2937',
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
      iconColor: '#488AFF',
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