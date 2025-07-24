import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export const ProtectedRoute = () => {
	const { isAuthenticated } = useAuthStore();
	const { tenant, isLoading } = useTenant();

	if (!isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!tenant) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4'>
				<div className='max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6'>
					<div className='text-center'>
						<div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4'>
							<svg className='h-6 w-6 text-red-600 dark:text-red-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
							</svg>
						</div>
						<h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
							Tenant Not Found
						</h3>
						<p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
							Unable to load tenant information. Please contact support.
						</p>
						
						{/* Demo Mode Instructions */}
						<div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4'>
							<h4 className='text-sm font-medium text-blue-900 dark:text-blue-100 mb-2'>
								Demo Mode Available
							</h4>
							<p className='text-sm text-blue-700 dark:text-blue-300 mb-3'>
								To use the demo tenant, register a new account with:
							</p>
							<div className='text-left bg-white dark:bg-gray-800 rounded p-3 text-xs font-mono'>
								<div>Tenant Code: <span className='font-bold text-blue-600 dark:text-blue-400'>DEMO</span></div>
							</div>
						</div>
						
						<button
							onClick={() => useAuthStore.getState().logout()}
							className='btn btn-primary w-full'
						>
							Sign Out
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!tenant.isActive) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
						Account Suspended
					</h1>
					<p className='text-gray-600 dark:text-gray-400 mb-6'>
						Your laboratory account has been suspended. Please contact support.
					</p>
					<button
						onClick={() => useAuthStore.getState().logout()}
						className='btn btn-primary'
					>
						Logout
					</button>
				</div>
			</div>
		);
	}

	return <Outlet />;
};
