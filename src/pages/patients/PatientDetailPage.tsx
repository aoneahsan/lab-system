import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePatient } from '@/hooks/usePatients';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { format } from 'date-fns';
import type { Patient } from '@/types/patient.types';

// Tab Components
import { PatientOverviewTab } from '@/components/patients/tabs/PatientOverviewTab';
import { PatientMedicalHistoryTab } from '@/components/patients/tabs/PatientMedicalHistoryTab';
import { PatientTestResultsTab } from '@/components/patients/tabs/PatientTestResultsTab';
import { PatientDocumentsTab } from '@/components/patients/tabs/PatientDocumentsTab';
import { PatientBillingTab } from '@/components/patients/tabs/PatientBillingTab';
import { PatientTimelineTab } from '@/components/patients/tabs/PatientTimelineTab';

const tabs = [
	{
		id: 'overview',
		label: 'Overview',
		icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
	},
	{
		id: 'medical-history',
		label: 'Medical History',
		icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
	},
	{
		id: 'test-results',
		label: 'Test Results',
		icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
	},
	{
		id: 'documents',
		label: 'Documents',
		icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
	},
	{
		id: 'billing',
		label: 'Billing',
		icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
	},
	{
		id: 'timeline',
		label: 'Timeline',
		icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
	},
];

const PatientDetailPage = () => {
	const { patientId } = useParams<{ patientId: string }>();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState('overview');

	const { data: patient, isLoading, error } = usePatient(patientId || '');

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (error || !patient) {
		return (
			<div className='text-center py-12'>
				<h2 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>
					Patient not found
				</h2>
				<p className='text-gray-600 dark:text-gray-400 mb-4'>
					The patient you're looking for doesn't exist or has been removed.
				</p>
				<Link to='/patients' className='btn btn-primary'>
					Back to Patients
				</Link>
			</div>
		);
	}

	const getPatientAge = (patient: Patient) => {
		const today = new Date();
		const birthDate = new Date(patient.dateOfBirth);
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();

		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birthDate.getDate())
		) {
			age--;
		}

		return age;
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case 'overview':
				return <PatientOverviewTab patient={patient} />;
			case 'medical-history':
				return <PatientMedicalHistoryTab patient={patient} />;
			case 'test-results':
				return <PatientTestResultsTab patientId={patient.id} />;
			case 'documents':
				return <PatientDocumentsTab patient={patient} />;
			case 'billing':
				return <PatientBillingTab patientId={patient.id} />;
			case 'timeline':
				return <PatientTimelineTab patientId={patient.id} />;
			default:
				return <PatientOverviewTab patient={patient} />;
		}
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='bg-white dark:bg-gray-800 shadow rounded-lg p-6'>
				<div className='flex items-start justify-between'>
					<div className='flex items-start gap-4'>
						<div className='h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center'>
							<span className='text-2xl font-semibold text-primary-600 dark:text-primary-400'>
								{patient.firstName[0]}
								{patient.lastName[0]}
							</span>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								{patient.firstName} {patient.middleName} {patient.lastName}
							</h1>
							<div className='flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400'>
								<span className='flex items-center gap-1'>
									<svg
										className='h-4 w-4'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2'
										/>
									</svg>
									ID: {patient.patientId}
								</span>
								<span className='flex items-center gap-1'>
									<svg
										className='h-4 w-4'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
										/>
									</svg>
									{getPatientAge(patient)} years (
									{format(patient.dateOfBirth, 'MMM dd, yyyy')})
								</span>
								<span className='flex items-center gap-1'>
									<svg
										className='h-4 w-4'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
										/>
									</svg>
									{patient.gender}
								</span>
								{patient.bloodGroup && patient.bloodGroup !== 'unknown' && (
									<span className='flex items-center gap-1'>
										<svg
											className='h-4 w-4'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
											/>
										</svg>
										{patient.bloodGroup}
									</span>
								)}
							</div>
							<div className='flex items-center gap-2 mt-3'>
								{patient.isActive ? (
									<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800'>
										Active
									</span>
								) : (
									<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
										Inactive
									</span>
								)}
								{patient.isVip && (
									<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800'>
										VIP
									</span>
								)}
							</div>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<button
							onClick={() => navigate(`/patients/${patient.id}/edit`)}
							className='btn btn-secondary'
						>
							Edit
						</button>
						<button className='btn btn-secondary'>
							<svg
								className='h-5 w-5'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z'
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div className='bg-white dark:bg-gray-800 shadow rounded-lg'>
				<div className='border-b border-gray-200 dark:border-gray-700'>
					<nav className='-mb-px flex overflow-x-auto' aria-label='Tabs'>
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`
                  whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm
                  flex items-center gap-2 transition-colors
                  ${
										activeTab === tab.id
											? 'border-primary-500 text-primary-600 dark:text-primary-400'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
									}
                `}
							>
								<svg
									className='h-5 w-5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d={tab.icon}
									/>
								</svg>
								{tab.label}
							</button>
						))}
					</nav>
				</div>

				{/* Tab Content */}
				<div className='p-6'>{renderTabContent()}</div>
			</div>
		</div>
	);
};

export default PatientDetailPage;
