import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { PatientListItem } from '@/types/patient.types';

interface PatientListTableProps {
  patients: PatientListItem[];
  onPatientSelect?: (patient: PatientListItem) => void;
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<PatientListItem>();

export const PatientListTable = ({ patients, onPatientSelect, isLoading }: PatientListTableProps) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('patientId', {
        header: 'Patient ID',
        cell: (info) => (
          <Link
            to={`/patients/${info.row.original.id}`}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('fullName', {
        header: 'Name',
        cell: (info) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {info.getValue()}
            </div>
            {info.row.original.isVip && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800">
                VIP
              </span>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('age', {
        header: 'Age',
        cell: (info) => (
          <div className="text-sm">
            <div>{info.getValue()} years</div>
            <div className="text-gray-500">
              {format(info.row.original.dateOfBirth, 'MMM dd, yyyy')}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('gender', {
        header: 'Gender',
        cell: (info) => (
          <span className="capitalize">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('phoneNumber', {
        header: 'Phone',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('lastVisitDate', {
        header: 'Last Visit',
        cell: (info) => {
          const date = info.getValue();
          return date ? format(date, 'MMM dd, yyyy') : 'Never';
        },
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              info.getValue()
                ? 'bg-success-100 text-success-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {info.getValue() ? 'Active' : 'Inactive'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Link
              to={`/patients/${info.row.original.id}`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View
            </Link>
            <Link
              to={`/patients/${info.row.original.id}/edit`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Edit
            </Link>
          </div>
        ),
      }),
    ],
    []
  );
  
  const table = useReactTable({
    data: patients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">Loading patients...</p>
        </div>
      </div>
    );
  }
  
  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No patients found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new patient.
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() && (
                      <span>
                        {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => onPatientSelect?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};