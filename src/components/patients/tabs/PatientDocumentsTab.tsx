import { useState } from 'react';
import { format } from 'date-fns';
import type { Patient } from '@/types/patient.types';
import { DocumentUpload } from '@/components/patients/DocumentUpload';
import { useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/hooks/useTenant';

interface PatientDocumentsTabProps {
	patient: Patient;
}

export const PatientDocumentsTab = ({ patient }: PatientDocumentsTabProps) => {
	const [selectedCategory, setSelectedCategory] = useState<string>('all');
	const [showUploadDialog, setShowUploadDialog] = useState(false);
	const queryClient = useQueryClient();
	const { tenant: currentTenant } = useTenant();

	const categories = [
		{ id: 'all', label: 'All Documents' },
		{ id: 'lab_report', label: 'Lab Reports' },
		{ id: 'prescription', label: 'Prescriptions' },
		{ id: 'insurance_card', label: 'Insurance Cards' },
		{ id: 'medical_record', label: 'Medical Records' },
		{ id: 'id_proof', label: 'ID Proofs' },
		{ id: 'other', label: 'Other' },
	];

	const filteredDocuments =
		selectedCategory === 'all'
			? patient.documents || []
			: (patient.documents || []).filter((doc) => doc.type === selectedCategory);

	const getDocumentIcon = (mimeType: string) => {
		switch (mimeType) {
			case 'application/pdf':
				return 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
			case 'image/jpeg':
			case 'image/png':
				return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
			default:
				return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	};

	return (
		<>
			<div className='space-y-6'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						{categories.map((category) => (
							<button
								key={category.id}
								onClick={() => setSelectedCategory(category.id)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									selectedCategory === category.id
										? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
								}`}
							>
								{category.label}
							</button>
						))}
					</div>
					<button
						className='btn btn-primary'
						onClick={() => setShowUploadDialog(true)}
					>
						Upload Document
					</button>
				</div>

				{filteredDocuments.length > 0 ? (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{filteredDocuments.map((document) => (
							<div
								key={document.id}
								className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer'
							>
								<div className='flex items-start gap-3'>
									<div className='flex-shrink-0'>
										<div className='h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center'>
											<svg
												className='h-6 w-6 text-gray-600 dark:text-gray-400'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d={getDocumentIcon(document.mimeType)}
												/>
											</svg>
										</div>
									</div>
									<div className='flex-1 min-w-0'>
										<h4 className='text-sm font-medium text-gray-900 dark:text-white truncate'>
											{document.fileName}
										</h4>
										<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
											{formatFileSize(document.fileSize)}
										</p>
										<p className='text-xs text-gray-500 dark:text-gray-400'>
											{format(document.uploadedAt, 'MMM dd, yyyy')}
										</p>
									</div>
									<div className='flex-shrink-0'>
										<button className='text-gray-400 hover:text-gray-600'>
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
								{document.notes && (
									<p className='text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2'>
										{document.notes}
									</p>
								)}
								<div className='mt-3 flex items-center gap-2'>
									<span
										className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
											document.type === 'lab_report'
												? 'bg-blue-100 text-blue-800'
												: document.type === 'prescription'
												? 'bg-green-100 text-green-800'
												: document.type === 'insurance_card'
												? 'bg-purple-100 text-purple-800'
												: document.type === 'medical_record'
												? 'bg-yellow-100 text-yellow-800'
												: document.type === 'id_proof'
												? 'bg-indigo-100 text-indigo-800'
												: 'bg-gray-100 text-gray-800'
										}`}
									>
										{document.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
									</span>
								</div>
							</div>
						))}
					</div>
				) : (
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
								d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
							/>
						</svg>
						<h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
							No documents uploaded
						</h3>
						<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
							Upload documents like lab reports, prescriptions, and insurance
							cards.
						</p>
						<div className='mt-6'>
							<button
								className='btn btn-primary'
								onClick={() => setShowUploadDialog(true)}
							>
								Upload First Document
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Upload Dialog */}
			{showUploadDialog && (
				<div className='fixed inset-0 z-50 overflow-y-auto'>
					<div className='flex min-h-full items-center justify-center p-4'>
						<div
							className='fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity'
							onClick={() => setShowUploadDialog(false)}
						/>

						<div className='relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'>
							<div className='mb-4'>
								<h3 className='text-lg font-medium text-gray-900 dark:text-white'>
									Upload Document
								</h3>
								<p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
									Upload a document for {patient.firstName} {patient.lastName}
								</p>
							</div>

							<DocumentUpload
								patientId={patient.id}
								onUploadComplete={() => {
									setShowUploadDialog(false);
									// Refresh patient data
									queryClient.invalidateQueries({
										queryKey: ['patient', currentTenant?.id, patient.id],
									});
								}}
								onCancel={() => setShowUploadDialog(false)}
							/>
						</div>
					</div>
				</div>
			)}
		</>
	);
};
