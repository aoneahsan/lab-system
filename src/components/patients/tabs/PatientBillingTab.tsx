interface PatientBillingTabProps {
	patientId: string;
}

export const PatientBillingTab = ({ patientId }: PatientBillingTabProps) => {
	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-medium text-gray-900 dark:text-white'>
					Billing & Payments
				</h3>
				<button className='btn btn-primary'>Create Invoice</button>
			</div>

			{/* Account Summary */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
					<div className='flex items-center justify-between'>
						<div>
							<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
								Total Billed
							</p>
							<p className='text-2xl font-semibold text-gray-900 dark:text-white'>
								$0.00
							</p>
						</div>
						<div className='h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center'>
							<svg
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
						</div>
					</div>
				</div>

				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
					<div className='flex items-center justify-between'>
						<div>
							<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
								Total Paid
							</p>
							<p className='text-2xl font-semibold text-success-600'>$0.00</p>
						</div>
						<div className='h-12 w-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center'>
							<svg
								className='h-6 w-6 text-success-600 dark:text-success-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
						</div>
					</div>
				</div>

				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
					<div className='flex items-center justify-between'>
						<div>
							<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
								Outstanding
							</p>
							<p className='text-2xl font-semibold text-danger-600'>$0.00</p>
						</div>
						<div className='h-12 w-12 bg-danger-100 dark:bg-danger-900 rounded-lg flex items-center justify-center'>
							<svg
								className='h-6 w-6 text-danger-600 dark:text-danger-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
						</div>
					</div>
				</div>

				<div className='bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
					<div className='flex items-center justify-between'>
						<div>
							<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
								Insurance Coverage
							</p>
							<p className='text-2xl font-semibold text-gray-900 dark:text-white'>
								$0.00
							</p>
						</div>
						<div className='h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center'>
							<svg
								className='h-6 w-6 text-purple-600 dark:text-purple-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
								/>
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Placeholder for billing history */}
			<div className='text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg'>
				<svg
					className='mx-auto h-12 w-12 text-gray-400'
					fill='none'
					viewBox='0 0 24 24'
					stroke='currentColor'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
					/>
				</svg>
				<h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
					No billing history
				</h3>
				<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
					Billing information for patient {patientId} will appear here once tests are ordered.
				</p>
			</div>
		</div>
	);
};
