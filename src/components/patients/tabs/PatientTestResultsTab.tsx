interface PatientTestResultsTabProps {
	patientId: string;
}

// eslint-disable-next-line @/typescript-eslint/no-unused-vars
export const PatientTestResultsTab = ({
	patientId,
}: PatientTestResultsTabProps) => {
	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-medium text-gray-900 dark:text-white'>
					Test Results
				</h3>
				<button className='btn btn-primary'>Order New Test</button>
			</div>

			{/* Placeholder for test results */}
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
						d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
					/>
				</svg>
				<h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
					No test results yet
				</h3>
				<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
					Test results will appear here once available.
				</p>
				<div className='mt-6'>
					<button className='btn btn-primary'>Order First Test</button>
				</div>
			</div>
		</div>
	);
};
