import { useEffect } from 'react';
import { useToastStore } from '@/stores/toast.store';
import type { Toast } from '@/stores/toast.store';

const TOAST_ICONS = {
	success: '✅',
	error: '❌',
	warning: '⚠️',
	info: 'ℹ️',
} as const;

const TOAST_COLORS = {
	success: 'bg-success-50 text-success-800 border-success-200',
	error: 'bg-danger-50 text-danger-800 border-danger-200',
	warning: 'bg-warning-50 text-warning-800 border-warning-200',
	info: 'bg-primary-50 text-primary-800 border-primary-200',
} as const;

const DEFAULT_TOAST_DURATION = 5000;

const ToastItem = ({ toast }: { toast: Toast }) => {
	const { removeToast } = useToastStore();

	useEffect(() => {
		const timer = setTimeout(() => {
			removeToast(toast.id);
		}, toast.duration || DEFAULT_TOAST_DURATION);

		return () => clearTimeout(timer);
	}, [toast, removeToast]);

	return (
		<div
			className={`flex items-start gap-3 p-4 rounded-lg border ${
				TOAST_COLORS[toast.type]
			} shadow-lg transition-all duration-300`}
		>
			<span className='text-2xl'>{TOAST_ICONS[toast.type]}</span>
			<div className='flex-1'>
				<h4 className='font-semibold'>{toast.title}</h4>
				{toast.message && (
					<p className='text-sm mt-1 opacity-80'>{toast.message}</p>
				)}
			</div>
			<button
				onClick={() => removeToast(toast.id)}
				className='text-gray-400 hover:text-gray-600 transition-colors'
			>
				✕
			</button>
		</div>
	);
};

export const Toaster = () => {
	const { toasts } = useToastStore();

	return (
		<div className='fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none'>
			{toasts.map((toast) => (
				<div key={toast.id} className='pointer-events-auto'>
					<ToastItem toast={toast} />
				</div>
			))}
		</div>
	);
};
