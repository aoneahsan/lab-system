import React from 'react';
import { PatientApp } from './PatientApp';
import { PhlebotomistApp } from './PhlebotomistApp';
import { LabStaffApp } from './LabStaffApp';
import { Preferences } from '@capacitor/preferences';

export const MobileAppSelector: React.FC = () => {
  const [appType, setAppType] = React.useState<'patient' | 'phlebotomist' | 'labstaff' | null>(null);

  React.useEffect(() => {
    // Check for app type stored in preferences
    const checkAppType = async () => {
      const { value } = await Preferences.get({ key: 'appType' });
      if (value) {
        setAppType(value as any);
      } else {
        // Default to patient app if not set
        // In production, this would be determined by the app build
        setAppType('patient');
      }
    };
    
    checkAppType();
  }, []);

  // In production, each app would be a separate build
  // This is for development/demo purposes
  switch (appType) {
    case 'patient':
      return <PatientApp />;
    case 'phlebotomist':
      return <PhlebotomistApp />;
    case 'labstaff':
      return <LabStaffApp />;
    default:
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
};