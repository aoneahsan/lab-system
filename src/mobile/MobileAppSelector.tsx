import React from 'react';
import { PatientApp } from './PatientApp';
import { PhlebotomistApp } from './PhlebotomistApp';
import { LabStaffApp } from './LabStaffApp';
import { ClinicianApp } from '@/apps/clinician/ClinicianApp';
import { Preferences } from '@capacitor/preferences';
import { useAuthStore } from '@/stores/auth.store';

export const MobileAppSelector: React.FC = () => {
  const [appType, setAppType] = React.useState<
    'patient' | 'phlebotomist' | 'labstaff' | 'clinician' | null
  >(null);
  const { currentUser } = useAuthStore();

  React.useEffect(() => {
    // Check for app type stored in preferences
    const checkAppType = async () => {
      const { value } = await Preferences.get({ key: 'appType' });
      if (value) {
        setAppType(value as any);
      } else {
        // Determine app type based on user role
        if (currentUser) {
          switch (currentUser.role) {
            case 'patient':
              setAppType('patient');
              break;
            case 'phlebotomist':
              setAppType('phlebotomist');
              break;
            case 'lab_technician':
              setAppType('labstaff');
              break;
            case 'clinician':
              setAppType('clinician');
              break;
            default:
              setAppType('patient');
          }
        } else {
          // Default to patient app if not set
          setAppType('patient');
        }
      }
    };

    checkAppType();
  }, [currentUser]);

  // In production, each app would be a separate build
  // This is for development/demo purposes
  switch (appType) {
    case 'patient':
      return <PatientApp />;
    case 'phlebotomist':
      return <PhlebotomistApp />;
    case 'labstaff':
      return <LabStaffApp />;
    case 'clinician':
      return <ClinicianApp />;
    default:
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
};
