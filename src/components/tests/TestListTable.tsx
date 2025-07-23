import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import type { TestDefinition } from '@/types/test.types';

interface TestListTableProps {
  tests: TestDefinition[];
  onEdit: (test: TestDefinition) => void;
  onDelete: (test: TestDefinition) => void;
  onView: (test: TestDefinition) => void;
}

const columnHelper = createColumnHelper<TestDefinition>();

const TestListTable: React.FC<TestListTableProps> = ({
  tests,
  onEdit,
  onDelete,
  onView,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = [
    columnHelper.accessor('code', {
      header: 'Code',
      cell: (info) => (
        <span className="font-medium text-gray-900">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Test Name',
      cell: (info) => (
        <div>
          <div className="font-medium text-gray-900">{info.getValue()}</div>
          {info.row.original.loincCode && (
            <div className="text-sm text-gray-500">
              LOINC: {info.row.original.loincCode.code}
            </div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('specimen.type', {
      header: 'Specimen',
      cell: (info) => (
        <span className="capitalize">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('turnaroundTime.routine', {
      header: 'TAT (hrs)',
      cell: (info) => `${info.getValue()}h`,
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            info.getValue()
              ? 'bg-green-100 text-green-800'
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
      cell: (props) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(props.row.original)}
            className="text-blue-600 hover:text-blue-800"
          >
            View
          </button>
          <button
            onClick={() => onEdit(props.row.original)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(props.row.original)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: tests,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search tests..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="text-sm text-gray-600">
          Showing {table.getFilteredRowModel().rows.length} of {tests.length} tests
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
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
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestListTable;