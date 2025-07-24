interface PatientTimelineTabProps {
	patientId: string;
}

// eslint-disable-next-line @/typescript-eslint/no-unused-vars
export const PatientTimelineTab = ({ patientId }: PatientTimelineTabProps) => {
	// Placeholder timeline data
	const timelineEvents = [
		{
			id: '1',
			type: 'registration',
			title: 'Patient Registered',
			description: 'Patient profile created in the system',
			date: new Date(),
			icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
			iconBg: 'bg-primary-100 dark:bg-primary-900',
			iconColor: 'text-primary-600 dark:text-primary-400',
		},
	];

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between mb-4'>
				<h3 className='text-lg font-medium text-gray-900 dark:text-white'>
					Patient Timeline
				</h3>
				<div className='flex items-center gap-2'>
					<button className='btn btn-sm btn-secondary'>Filter</button>
				</div>
			</div>

			{/* Timeline */}
			<div className='flow-root'>
				<ul className='-mb-8'>
					{timelineEvents.map((event, eventIdx) => (
						<li key={event.id}>
							<div className='relative pb-8'>
								{eventIdx !== timelineEvents.length - 1 ? (
									<span
										className='absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700'
										aria-hidden='true'
									/>
								) : null}
								<div className='relative flex space-x-3'>
									<div>
										<span
											className={`h-8 w-8 rounded-full ${event.iconBg} flex items-center justify-center ring-8 ring-white dark:ring-gray-900`}
										>
											<svg
												className={`h-5 w-5 ${event.iconColor}`}
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d={event.icon}
												/>
											</svg>
										</span>
									</div>
									<div className='flex min-w-0 flex-1 justify-between space-x-4 pt-1.5'>
										<div>
											<p className='text-sm font-medium text-gray-900 dark:text-white'>
												{event.title}
											</p>
											<p className='text-sm text-gray-500 dark:text-gray-400'>
												{event.description}
											</p>
										</div>
										<div className='whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400'>
											<time dateTime={event.date.toISOString()}>
												{event.date.toLocaleDateString()}
											</time>
										</div>
									</div>
								</div>
							</div>
						</li>
					))}
				</ul>

				{timelineEvents.length === 0 && (
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
								d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
							/>
						</svg>
						<h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
							No timeline events
						</h3>
						<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
							Patient activities will appear here.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
