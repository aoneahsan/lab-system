import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Eye, Edit, Trash2, QrCode, Printer } from 'lucide-react';
import type { Sample } from '@/types/sample.types';

interface SampleListTableProps {
  samples: Sample[];
  onView: (sample: Sample) => void;
  onEdit: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
  onPrintLabel: (sample: Sample) => void;
  onShowQR: (sample: Sample) => void;
}

const columnHelper = createColumnHelper<Sample>();

const SampleListTable: React.FC<SampleListTableProps> = ({
  samples,
  onView,
  onEdit,
  onDelete,
  onPrintLabel,
  onShowQR,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const getStatusColor = (status: Sample['status']) => {
    const colors = {
      pending_collection: 'bg-gray-100 text-gray-800',
      collected: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      processing: 'bg-purple-100 text-purple-800',
      stored: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: Sample['priority']) => {
    const colors = {
      routine: 'bg-gray-100 text-gray-800',
      stat: 'bg-red-100 text-red-800',
      asap: 'bg-orange-100 text-orange-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    columnHelper.accessor('sampleNumber', {
      header: 'Sample #',
      cell: (info) => (
        <div className="font-medium text-blue-600 hover:text-blue-800">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('barcode', {
      header: 'Barcode',
      cell: (info) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{info.getValue()}</code>
      ),
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: (info) => (
        <span className="capitalize">{info.getValue().replace('_', ' ')}</span>
      ),
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: (info) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(info.getValue())}`}>
          {info.getValue().toUpperCase()}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(info.getValue())}`}>
          {info.getValue().replace('_', ' ')}
        </span>
      ),
    }),
    columnHelper.accessor('collectionDate', {
      header: 'Collection Date',
      cell: (info) => {
        const date = info.getValue().toDate();
        return `${date.toLocaleDateString()} ${info.row.original.collectionTime}`;
      },
    }),
    columnHelper.accessor('collectedBy', {
      header: 'Collected By',
    }),
    columnHelper.accessor('storageLocation', {
      header: 'Storage',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(row.original)}
            className="text-gray-600 hover:text-gray-900"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onShowQR(row.original)}
            className="text-gray-600 hover:text-gray-900"
            title="Show QR Code"
          >
            <QrCode className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPrintLabel(row.original)}
            className="text-gray-600 hover:text-gray-900"
            title="Print Label"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(row.original)}
            className="text-blue-600 hover:text-blue-900"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(row.original)}
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: samples,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() && (
                      <span>
                        {header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  samples.length
                )}
              </span>{' '}
              of <span className="font-medium">{samples.length}</span> results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleListTable;