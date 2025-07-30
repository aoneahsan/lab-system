import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, firestore } from '@/config/firebase.config';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from '@/stores/toast.store';
import { useNavigate, Link } from 'react-router-dom';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';

// This is a setup page to create the initial super admin
// Should be removed or protected after initial setup
const CreateSuperAdmin = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  
  // Pre-filled super admin data
  const superAdminData = {
    email: 'aoneahsan@gmail.com',
    firstName: 'Super',
    lastName: 'Admin',
  };

  const handleCreateSuperAdmin = async () => {
    setIsCreating(true);
    
    // Generate a secure random password
    const generatePassword = () => {
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 16; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password + 'Aa1!'; // Ensure it meets Firebase requirements
    };
    
    const password = generatePassword();

    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        superAdminData.email,
        password
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

      // Try to send email with credentials
      try {
        const functions = getFunctions();
        const sendCredentials = httpsCallable(functions, 'sendSuperAdminCredentials');
        await sendCredentials({
          email: superAdminData.email,
          password: password,
          firstName: superAdminData.firstName,
          lastName: superAdminData.lastName
        });
        
        toast.success(
          'Super Admin Created!',
          'Credentials have been sent to your email'
        );
        
        // Navigate to login after email sent
        setTimeout(() => navigate('/login'), 3000);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        
        // If email fails, store password temporarily to show to user
        setCreatedPassword(password);
        
        toast.success(
          'Super Admin Created!',
          'Account created successfully. See credentials below.'
        );
      }
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

  // Show success screen with credentials if email failed
  if (createdPassword) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Super Admin Created Successfully!
              </h2>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-1">
                ⚠️ IMPORTANT: Save these credentials immediately!
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Email service is not configured. Please save these credentials:
              </p>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Email:</span>
                <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-sm">
                  {superAdminData.email}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Password:</span>
                <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-sm font-mono select-all">
                  {createdPassword}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Role:</span>
                <span className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 px-2 py-1 rounded text-sm">
                  super_admin
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 Tip: Change this password after your first login for better security.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdPassword);
                  toast.success('Copied!', 'Password copied to clipboard');
                }}
                className="w-full btn btn-secondary"
              >
                📋 Copy Password
              </button>
              
              <Link to="/login" className="block w-full btn btn-primary text-center">
                Go to Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <p>Role: super_admin</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ After creation, credentials will be sent to your email.
                  If email fails, use the "Forgot Password" option.
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