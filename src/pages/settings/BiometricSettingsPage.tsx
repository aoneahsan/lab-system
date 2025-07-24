import { useState, useEffect } from 'react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const BiometricSettingsPage = () => {
	const {
		isLoading,
		biometricStatus,
		preferences,
		updatePreferences,
		authenticate,
		checkStatus,
	} = useBiometricAuth();

	const [isEnabling, setIsEnabling] = useState(false);
	const [requireRecentAuth, setRequireRecentAuth] = useState(true);
	const [authThreshold, setAuthThreshold] = useState(5);

	useEffect(() => {
		if (preferences) {
			setRequireRecentAuth(preferences.requireRecentAuth);
			setAuthThreshold(preferences.recentAuthThresholdMinutes);
		}
	}, [preferences]);

	const handleToggleBiometric = async () => {
		if (!biometricStatus) return;

		if (!preferences?.enabled) {
			// Enabling biometric authentication
			if (!biometricStatus.isAvailable) {
				return;
			}

			if (!biometricStatus.isEnrolled) {
				return;
			}

			setIsEnabling(true);

			// Authenticate first before enabling
			const result = await authenticate({
				reason: 'Authenticate to enable biometric login',
			});

			if (result.success) {
				await updatePreferences({ enabled: true });
			}

			setIsEnabling(false);
		} else {
			// Disabling biometric authentication
			await updatePreferences({ enabled: false });
		}
	};

	const handleUpdateSettings = async () => {
		await updatePreferences({
			requireRecentAuth,
			recentAuthThresholdMinutes: authThreshold,
		});
	};

	const testBiometric = async () => {
		await authenticate({
			reason: 'Test biometric authentication',
		});
	};

	if (isLoading && !preferences) {
		return <LoadingScreen />;
	}

	return (
		<div className='max-w-4xl mx-auto py-8 px-4'>
			<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-8'>
				Biometric Settings
			</h1>

			{/* Biometric Status Card */}
			<div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
				<h2 className='text-xl font-semibold mb-4'>Biometric Status</h2>

				<div className='space-y-3'>
					<div className='flex justify-between'>
						<span className='text-gray-600 dark:text-gray-400'>Available</span>
						<span
							className={`font-medium ${
								biometricStatus?.isAvailable
									? 'text-success-600'
									: 'text-danger-600'
							}`}
						>
							{biometricStatus?.isAvailable ? 'Yes' : 'No'}
						</span>
					</div>

					<div className='flex justify-between'>
						<span className='text-gray-600 dark:text-gray-400'>Enrolled</span>
						<span
							className={`font-medium ${
								biometricStatus?.isEnrolled
									? 'text-success-600'
									: 'text-danger-600'
							}`}
						>
							{biometricStatus?.isEnrolled ? 'Yes' : 'No'}
						</span>
					</div>

					{biometricStatus?.biometryType && (
						<div className='flex justify-between'>
							<span className='text-gray-600 dark:text-gray-400'>Type</span>
							<span className='font-medium capitalize'>
								{biometricStatus.biometryType}
							</span>
						</div>
					)}

					{biometricStatus?.errorMessage && (
						<div className='mt-3 p-3 bg-danger-50 text-danger-800 rounded'>
							{biometricStatus.errorMessage}
						</div>
					)}
				</div>

				<button
					onClick={checkStatus}
					className='mt-4 btn btn-secondary btn-sm'
					disabled={isLoading}
				>
					Refresh Status
				</button>
			</div>

			{/* Enable/Disable Toggle */}
			<div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='text-lg font-medium'>
							Enable Biometric Authentication
						</h3>
						<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
							Use your fingerprint or face to quickly sign in
						</p>
					</div>

					<label className='relative inline-flex items-center cursor-pointer'>
						<input
							type='checkbox'
							className='sr-only peer'
							checked={preferences?.enabled || false}
							onChange={handleToggleBiometric}
							disabled={
								isLoading ||
								isEnabling ||
								!biometricStatus?.isAvailable ||
								!biometricStatus?.isEnrolled
							}
						/>
						<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
					</label>
				</div>

				{!biometricStatus?.isAvailable && (
					<div className='mt-3 p-3 bg-warning-50 text-warning-800 rounded text-sm'>
						Biometric authentication is not available on this device
					</div>
				)}

				{biometricStatus?.isAvailable && !biometricStatus?.isEnrolled && (
					<div className='mt-3 p-3 bg-warning-50 text-warning-800 rounded text-sm'>
						Please enroll biometrics in your device settings first
					</div>
				)}
			</div>

			{/* Advanced Settings */}
			{preferences?.enabled && (
				<div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6'>
					<h3 className='text-lg font-medium mb-4'>Advanced Settings</h3>

					<div className='space-y-4'>
						<div className='flex items-center justify-between'>
							<div>
								<label className='font-medium'>
									Require Recent Authentication
								</label>
								<p className='text-sm text-gray-600 dark:text-gray-400'>
									Request biometric auth for sensitive operations
								</p>
							</div>
							<label className='relative inline-flex items-center cursor-pointer'>
								<input
									type='checkbox'
									className='sr-only peer'
									checked={requireRecentAuth}
									onChange={(e) => setRequireRecentAuth(e.target.checked)}
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
							</label>
						</div>

						{requireRecentAuth && (
							<div>
								<label className='block font-medium mb-2'>
									Authentication Timeout (minutes)
								</label>
								<select
									value={authThreshold}
									onChange={(e) => setAuthThreshold(Number(e.target.value))}
									className='input'
								>
									<option value={1}>1 minute</option>
									<option value={5}>5 minutes</option>
									<option value={10}>10 minutes</option>
									<option value={15}>15 minutes</option>
									<option value={30}>30 minutes</option>
								</select>
							</div>
						)}
					</div>

					<button
						onClick={handleUpdateSettings}
						className='mt-4 btn btn-primary'
						disabled={isLoading}
					>
						Save Settings
					</button>
				</div>
			)}

			{/* Test Biometric */}
			{preferences?.enabled && (
				<div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
					<h3 className='text-lg font-medium mb-4'>Test Biometric</h3>
					<p className='text-gray-600 dark:text-gray-400 mb-4'>
						Test your biometric authentication to ensure it's working properly
					</p>
					<button
						onClick={testBiometric}
						className='btn btn-secondary'
						disabled={isLoading}
					>
						Test Authentication
					</button>
				</div>
			)}
		</div>
	);
};
