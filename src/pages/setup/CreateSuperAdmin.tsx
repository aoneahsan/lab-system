import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/config/firebase.config';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from '@/stores/toast.store';
import { useNavigate } from 'react-router-dom';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';

// This is a setup page to create the initial super admin
// Should be removed or protected after initial setup
const CreateSuperAdmin = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Pre-filled super admin credentials
  const superAdminData = {
    email: 'aoneahsan@gmail.com',
    password: 'Ahsan6553665201!',
    firstName: 'Super',
    lastName: 'Admin',
  };

  const handleCreateSuperAdmin = async () => {
    setIsCreating(true);

    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        superAdminData.email,
        superAdminData.password
      );

      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${superAdminData.firstName} ${superAdminData.lastName}`,
      });

      // Create user document with super_admin role
      const userData = {
        id: user.uid,
        email: superAdminData.email,
        firstName: superAdminData.firstName,
        lastName: superAdminData.lastName,
        role: 'super_admin',
        isActive: true,
        emailVerified: false,
        phoneNumber: '',
        profileImageUrl: '',
        bio: 'System Super Administrator',
        specializations: [],
        licenseNumber: '',
        preferredLanguage: 'en',
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
          criticalAlerts: true,
          resultUpdates: true,
          appointmentReminders: true,
        },
        theme: 'system',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, COLLECTION_NAMES.USERS, user.uid), userData);

      toast.success(
        'Super Admin Created!',
        'You can now login with the super admin credentials'
      );

      // Show success message
      alert(`
        ✅ Super Admin Account Created Successfully!
        
        Email: ${superAdminData.email}
        Password: ${superAdminData.password}
        
        Please save these credentials securely.
        You can now login and access the admin panel at /admin
      `);

      navigate('/login');
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Account exists', 'This email is already registered');
      } else {
        toast.error('Creation failed', error.message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Shield className="h-16 w-16 text-primary-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create Super Admin Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Initial setup for system administration
            </p>
          </div>

          {!showForm ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                This will create a super admin account with full system access.
                Only run this during initial setup.
              </p>
              
              <button
                onClick={() => setShowForm(true)}
                className="w-full btn btn-primary"
              >
                Proceed to Create Super Admin
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full btn btn-secondary"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Account Details:
                </h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>Email: {superAdminData.email}</p>
                  <p>Password: {superAdminData.password}</p>
                  <p>Role: super_admin</p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Save these credentials securely. This page should be removed
                  after initial setup.
                </p>
              </div>

              <button
                onClick={handleCreateSuperAdmin}
                disabled={isCreating}
                className="w-full btn btn-primary"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Creating Super Admin...
                  </span>
                ) : (
                  'Create Super Admin Account'
                )}
              </button>

              <button
                onClick={() => setShowForm(false)}
                disabled={isCreating}
                className="w-full btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSuperAdmin;