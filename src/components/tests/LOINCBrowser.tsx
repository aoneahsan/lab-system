import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Info, ExternalLink, Loader2 } from 'lucide-react';
import { useLOINCSearch, useCommonLOINCTests } from '@/hooks/useTests';
import { useUrlState } from '@/hooks/useUrlState';
import { loincService } from '@/services/loinc.service';
import type { LOINCCode } from '@/types/test.types';

interface LOINCBrowserProps {
  onSelect: (loinc: LOINCCode) => void;
  onClose: () => void;
  selectedCode?: string;
}

const LOINCBrowser: React.FC<LOINCBrowserProps> = ({ onSelect, onClose, selectedCode }) => {
  const [searchTerm, setSearchTerm] = useUrlState('search', {
    defaultValue: '',
    removeDefault: true
  });
  const [selectedCategory, setSelectedCategory] = useUrlState('category', {
    defaultValue: '',
    removeDefault: true
  });
  const [categoryResults, setCategoryResults] = useState<LOINCCode[]>([]);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useLOINCSearch(searchTerm);
  const { data: commonTests, isLoading: isLoadingCommon } = useCommonLOINCTests();

  const categories = [
    { value: 'CHEM', label: 'Chemistry' },
    { value: 'HEM/BC', label: 'Hematology' },
    { value: 'MICRO', label: 'Microbiology' },
    { value: 'SERO', label: 'Serology/Immunology' },
    { value: 'UA', label: 'Urinalysis' },
    { value: 'COAG', label: 'Coagulation' },
    { value: 'DRUG/TOX', label: 'Drug/Toxicology' },
    { value: 'PATH', label: 'Pathology' },
  ];

  const loadCategoryResults = useCallback(async () => {
    setIsLoadingCategory(true);
    try {
      const results = await loincService.searchByCategory(selectedCategory);
      setCategoryResults(results);
    } catch (error) {
      console.error('Error loading category results:', error);
      setCategoryResults([]);
    } finally {
      setIsLoadingCategory(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryResults();
    }
  }, [selectedCategory, loadCategoryResults]);

  const displayResults = searchTerm
    ? searchResults || []
    : selectedCategory
      ? categoryResults
      : commonTests || [];

  const isLoading = searchTerm
    ? isSearching
    : selectedCategory
      ? isLoadingCategory
      : isLoadingCommon;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">LOINC Code Browser</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, name, or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Common Tests</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading LOINC codes...</span>
            </div>
          ) : displayResults.length === 0 ? (
            <div className="text-center py-12">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? 'No LOINC codes found matching your search.'
                  : 'No LOINC codes available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayResults.map((loinc) => (
                <div
                  key={loinc.code}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCode === loinc.code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onSelect(loinc)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{loinc.displayName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {loinc.code} {loinc.class && `• ${loinc.class}`}
                      </p>
                    </div>
                    {selectedCode === loinc.code && (
                      <span className="text-sm text-blue-600 font-medium">Selected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <a
              href="https://loinc.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Learn more about LOINC
            </a>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LOINCBrowser;
