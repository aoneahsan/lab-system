import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone, Mail, Shield, Check, X, Copy, Phone, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/useToast';
import { twoFactorAuthService } from '@/services/two-factor-auth.service';
import { subscriptionService } from '@/services/subscription.service';
import type { TwoFactorMethod, UserTwoFactorPermissions, TwoFactorSetupData } from '@/types/two-factor.types';

const TwoFactorAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { showToast } = useToast();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'select' | 'verify' | 'backup' | 'complete'>('select');
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [permissions, setPermissions] = useState<UserTwoFactorPermissions | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');

  // Load user permissions on mount
  useEffect(() => {
    const loadPermissions = async () => {
      if (currentUser?.id) {
        const perms = await twoFactorAuthService.getUserTwoFactorPermissions(currentUser.id);
        setPermissions(perms);
      }
    };
    loadPermissions();
  }, [currentUser]);

  const methods = [
    {
      id: 'totp' as TwoFactorMethod,
      name: 'Authenticator App',
      description: 'Use an app like Google Authenticator or Authy',
      icon: <Smartphone className="w-6 h-6" />,
      recommended: true,
      enabled: permissions?.canUseTOTP ?? true,
    },
    {
      id: 'sms' as TwoFactorMethod,
      name: 'SMS Text Message',
      description: 'Receive codes via text message',
      icon: <Phone className="w-6 h-6" />,
      recommended: false,
      enabled: permissions?.canUseSMS ?? true,
    },
    {
      id: 'email' as TwoFactorMethod,
      name: 'Email',
      description: 'Receive codes via email',
      icon: <MessageSquare className="w-6 h-6" />,
      recommended: false,
      enabled: permissions?.canUseEmail ?? true,
    },
  ];

  const handleMethodSelect = async (method: TwoFactorMethod) => {
    if (!currentUser?.id || !currentUser?.email) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'User information not available',
      });
      return;
    }

    setSelectedMethod(method);
    setIsLoading(true);

    try {
      let setup: TwoFactorSetupData;
      
      if (method === 'totp') {
        setup = await twoFactorAuthService.generateTOTPSetup(currentUser.id, currentUser.email);
      } else if (method === 'sms') {
        if (!phoneNumber) {
          setSetupStep('verify');
          setIsLoading(false);
          return;
        }
        setup = await twoFactorAuthService.setupSMS2FA(currentUser.id, phoneNumber);
      } else {
        setup = await twoFactorAuthService.setupEmail2FA(currentUser.id, email);
      }
      
      setSetupData(setup);
      setSetupStep('verify');
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Setup Failed',
        message: error instanceof Error ? error.message : 'Failed to setup 2FA',
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleVerification = async () => {
    if (!currentUser?.id || !selectedMethod || !setupData) {
      return;
    }

    if (verificationCode.length !== 6) {
      showToast({
        type: 'error',
        title: 'Invalid Code',
        message: 'Please enter a 6-digit verification code',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await twoFactorAuthService.enable2FA(
        currentUser.id,
        selectedMethod,
        verificationCode,
        setupData
      );

      if (result.success) {
        setBackupCodes(result.backupCodes || []);
        setSetupStep('backup');
        showToast({
          type: 'success',
          title: 'Verification Successful',
          message: 'Your two-factor authentication is being set up',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Verification Failed',
          message: result.error || 'The code you entered is invalid',
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Verification Failed',
        message: 'The code you entered is invalid. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save 2FA settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEnabled(true);
      setSetupStep('complete');
      
      showToast({
        type: 'success',
        title: '2FA Enabled',
        message: 'Two-factor authentication has been successfully enabled',
      });
      
      setTimeout(() => {
        navigate('/settings/security');
      }, 2000);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Setup Failed',
        message: 'Failed to enable two-factor authentication',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEnabled(false);
      setSetupStep('select');
      setSelectedMethod(null);
      showToast({
        type: 'success',
        title: '2FA Disabled',
        message: 'Two-factor authentication has been disabled',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to disable two-factor authentication',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({
      type: 'success',
      title: 'Copied',
      message: 'Copied to clipboard',
    });
  };

  const downloadBackupCodes = () => {
    const content = `LabFlow Two-Factor Authentication Backup Codes
Account: ${currentUser?.email}
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes in a safe place. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authentication device, you can use one of these codes to sign in.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'labflow-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate('/settings/security')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Security Settings
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Two-Factor Authentication
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Add an extra layer of security to your account
        </p>
      </div>

      {isEnabled && setupStep !== 'complete' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-green-900 dark:text-green-200">
              Two-factor authentication is enabled
            </span>
          </div>
        </div>
      )}

      {setupStep === 'select' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Choose your authentication method</h2>
            <div className="space-y-3">
              {methods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id as 'app' | 'sms' | 'email')}
                  className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {method.name}
                        </h3>
                        {method.recommended && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {isEnabled && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Manage 2FA</h2>
              <button
                onClick={handleDisable2FA}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
              </button>
            </div>
          )}
        </div>
      )}

      {setupStep === 'verify' && selectedMethod === 'app' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Set up your authenticator app</h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Scan this QR code with your authenticator app, or enter the secret key manually.
              </p>
              
              {showQRCode && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-300">
                    <QrCode className="w-48 h-48 text-gray-800" />
                  </div>
                  
                  <div className="w-full max-w-md">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Or enter this secret key manually:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={secretKey}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(secretKey.replace(/\s/g, ''))}
                        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter the 6-digit code from your app:
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-32 px-4 py-2 text-center text-lg font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                  maxLength={6}
                />
                <button
                  onClick={handleVerification}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {setupStep === 'verify' && selectedMethod === 'sms' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Set up SMS authentication</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSendSMSCode}
                  disabled={isLoading || !phoneNumber}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enter your phone number with country code
              </p>
            </div>

            {setupData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter the 6-digit code sent to your phone:
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-32 px-4 py-2 text-center text-lg font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerification}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {setupStep === 'verify' && selectedMethod === 'email' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Set up Email authentication</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleSendEmailCode}
                  disabled={isLoading || !email}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Code'}
                </button>
              </div>
            </div>

            {setupData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter the 6-digit code sent to your email:
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-32 px-4 py-2 text-center text-lg font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerification}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {setupStep === 'backup' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Save your backup codes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Save these backup codes in a safe place. You can use them to access your account if you lose your authentication device.
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {backupCodes.map((code, index) => (
              <div key={index} className="font-mono text-sm">
                {index + 1}. {code}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={downloadBackupCodes}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Download Codes
            </button>
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Completing Setup...' : 'Complete Setup'}
            </button>
          </div>
        </div>
      )}

      {setupStep === 'complete' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Two-Factor Authentication Enabled!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuthPage;