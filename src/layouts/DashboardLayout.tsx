import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTenant } from '@/hooks/useTenant';

const navigation = [
	{ name: 'Dashboard', href: '/dashboard', icon: '📊', roles: 'all' },
	{
		name: 'Patients',
		href: '/patients',
		icon: '👥',
		roles: [
			'super_admin',
			'lab_admin',
			'lab_manager',
			'lab_technician',
			'front_desk',
			'clinician',
		],
	},
	{
		name: 'Tests',
		href: '/tests',
		icon: '🧪',
		roles: [
			'super_admin',
			'lab_admin',
			'lab_manager',
			'lab_technician',
			'clinician',
		],
	},
	{
		name: 'Samples',
		href: '/samples',
		icon: '🩸',
		roles: [
			'super_admin',
			'lab_admin',
			'lab_manager',
			'lab_technician',
			'phlebotomist',
		],
	},
	{
		name: 'Results',
		href: '/results',
		icon: '📋',
		roles: [
			'super_admin',
			'lab_admin',
			'lab_manager',
			'lab_technician',
			'pathologist',
			'radiologist',
			'clinician',
		],
	},
	{
		name: 'Billing',
		href: '/billing',
		icon: '💳',
		roles: ['super_admin', 'lab_admin', 'lab_manager', 'billing_staff'],
	},
	{
		name: 'Inventory',
		href: '/inventory',
		icon: '📦',
		roles: ['super_admin', 'lab_admin', 'lab_manager', 'lab_technician'],
	},
	{
		name: 'Quality Control',
		href: '/quality-control',
		icon: '✅',
		roles: [
			'super_admin',
			'lab_admin',
			'lab_manager',
			'lab_technician',
			'pathologist',
		],
	},
	{
		name: 'Reports',
		href: '/reports',
		icon: '📈',
		roles: ['super_admin', 'lab_admin', 'lab_manager'],
	},
	{
		name: 'Settings',
		href: '/settings',
		icon: '⚙️',
		roles: ['super_admin', 'lab_admin'],
	},
];

export const DashboardLayout = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const location = useLocation();
	const { currentUser, logout } = useAuthStore();
	const { tenant } = useTenant();

	const filteredNavigation = navigation.filter((item) => {
		if (item.roles === 'all') return true;
		return item.roles.includes(currentUser?.role || '');
	});

	return (
		<div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
			{/* Mobile sidebar toggle */}
			<div className='lg:hidden fixed top-4 left-4 z-50'>
				<button
					onClick={() => setSidebarOpen(!sidebarOpen)}
					className='p-2 rounded-md bg-white dark:bg-gray-800 shadow-md'
				>
					<span className='text-2xl'>{sidebarOpen ? '✕' : '☰'}</span>
				</button>
			</div>

			{/* Sidebar */}
			<div
				className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} lg:translate-x-0 transition-transform duration-300`}
			>
				<div className='flex flex-col h-full'>
					{/* Logo */}
					<div className='p-6 border-b border-gray-200 dark:border-gray-700'>
						<h1 className='text-2xl font-bold text-primary-600'>LabFlow</h1>
						{tenant && (
							<p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
								{tenant.name}
							</p>
						)}
					</div>

					{/* Navigation */}
					<nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
						{filteredNavigation.map((item) => {
							const isActive = location.pathname === item.href;
							return (
								<Link
									key={item.name}
									to={item.href}
									className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
										isActive
											? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
											: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
									}`}
									onClick={() => setSidebarOpen(false)}
								>
									<span className='text-xl'>{item.icon}</span>
									<span className='font-medium'>{item.name}</span>
								</Link>
							);
						})}
					</nav>

					{/* User menu */}
					<div className='p-4 border-t border-gray-200 dark:border-gray-700'>
						<div className='space-y-2'>
							<Link
								to='/profile'
								className='flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
								onClick={() => setSidebarOpen(false)}
							>
								<span className='text-xl'>👤</span>
								<div className='flex-1'>
									<p className='font-medium'>{currentUser?.displayName}</p>
									<p className='text-xs text-gray-500 dark:text-gray-400'>
										{currentUser?.role}
									</p>
								</div>
							</Link>
							<button
								onClick={() => logout()}
								className='w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
							>
								<span className='text-xl'>🚪</span>
								<span className='font-medium'>Logout</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className='lg:pl-64'>
				<main className='min-h-screen p-4 lg:p-8'>
					<Outlet />
				</main>
			</div>

			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<div
					className='fixed inset-0 bg-black/50 z-30 lg:hidden'
					onClick={() => setSidebarOpen(false)}
				/>
			)}
		</div>
	);
};
