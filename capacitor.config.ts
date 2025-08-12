import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zaions.labflow',
  appName: 'LabFlow',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    overrideUserAgent: 'LabFlow/1.0.0',
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    overrideUserAgent: 'LabFlow/1.0.0',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0ea5e9',
      sound: 'beep.wav',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
