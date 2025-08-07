import React, { memo, useMemo, useCallback } from 'react';
import { VirtualList } from './VirtualList';
import { debounce } from '@/utils/performance';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface OptimizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  height?: number;
  onRowClick?: (item: T) => void;
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  sortColumn?: keyof T;
  sortDirection?: 'asc' | 'desc';
  className?: string;
  enableVirtualization?: boolean;
  stickyHeader?: boolean;
}

export const OptimizedTable = memo(<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 48,
  height = 600,
  onRowClick,
  onSort,
  sortColumn,
  sortDirection,
  className = '',
  enableVirtualization = true,
  stickyHeader = true,
}: OptimizedTableProps<T>) => {
  // Memoize sorted data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      
      const result = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? result : -result;
    });
  }, [data, sortColumn, sortDirection]);

  // Debounced sort handler
  const handleSort = useCallback(
    debounce((column: keyof T) => {
      if (!onSort) return;
      
      const newDirection = 
        sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
      
      onSort(column, newDirection);
    }, 300),
    [onSort, sortColumn, sortDirection]
  );

  // Render table header
  const renderHeader = () => (
    <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
      <tr>
        {columns.map((column) => (
          <th
            key={String(column.key)}
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            style={{ width: column.width }}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.header}</span>
              {column.sortable && (
                <div className="flex flex-col">
                  <svg
                    className={`w-3 h-3 ${sortColumn === column.key && sortDirection === 'asc' ? 'text-primary-600' : 'text-gray-400'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7 10l5-5 5 5H7z" />
                  </svg>
                  <svg
                    className={`w-3 h-3 -mt-1 ${sortColumn === column.key && sortDirection === 'desc' ? 'text-primary-600' : 'text-gray-400'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7 10l5 5 5-5H7z" />
                  </svg>
                </div>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  // Render table row
  const renderRow = useCallback((item: T, index: number) => (
    <tr
      key={index}
      className="hover:bg-gray-50 cursor-pointer border-b border-gray-200"
      onClick={() => onRowClick?.(item)}
    >
      {columns.map((column) => (
        <td
          key={String(column.key)}
          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
        >
          {column.render
            ? column.render(item[column.key], item)
            : item[column.key]}
        </td>
      ))}
    </tr>
  ), [columns, onRowClick]);

  // Non-virtualized table
  if (!enableVirtualization || sortedData.length < 100) {
    return (
      <div className={`overflow-auto ${className}`} style={{ maxHeight: height }}>
        <table className="min-w-full divide-y divide-gray-200">
          {renderHeader()}
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => renderRow(item, index))}
          </tbody>
        </table>
      </div>
    );
  }

  // Virtualized table for large datasets
  return (
    <div className={`${className}`}>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          {renderHeader()}
        </table>
      </div>
      <VirtualList
        items={sortedData}
        height={height - rowHeight} // Subtract header height
        itemHeight={rowHeight}
        renderItem={renderRow}
        className="bg-white"
      />
    </div>
  );
});

OptimizedTable.displayName = 'OptimizedTable';

// Table with search and filters
export const SearchableTable = memo(<T extends Record<string, any>>({
  data,
  searchKeys,
  ...tableProps
}: OptimizedTableProps<T> & { searchKeys: (keyof T)[] }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Debounced search
  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term.toLowerCase());
    }, 300),
    []
  );
  
  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return searchKeys.some(key => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm);
        }
        return String(value).toLowerCase().includes(searchTerm);
      });
    });
  }, [data, searchTerm, searchKeys]);
  
  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <OptimizedTable {...tableProps} data={filteredData} />
    </div>
  );
});

SearchableTable.displayName = 'SearchableTable';