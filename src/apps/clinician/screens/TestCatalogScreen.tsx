import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Search, 
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Beaker,
  DollarSign
} from 'lucide-react';
import { useTests } from '@/hooks/useTests';

export function TestCatalogScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  
  const { data: tests = [], isLoading } = useTests({ 
    searchTerm: searchQuery,
    category: selectedCategory === 'all' ? undefined : selectedCategory 
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'hematology', label: 'Hematology' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'molecular', label: 'Molecular' },
    { value: 'urinalysis', label: 'Urinalysis' },
    { value: 'coagulation', label: 'Coagulation' },
    { value: 'pathology', label: 'Pathology' },
  ];

  const toggleExpanded = (testId: string) => {
    setExpandedTest(expandedTest === testId ? null : testId);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test Catalog</h1>
        <p className="text-sm text-gray-600 mt-1">
          Browse available laboratory tests and panels
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search by test name, code, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {tests.length} test{tests.length !== 1 ? 's' : ''}
      </div>

      {/* Tests List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Loading test catalog...</p>
          </Card>
        ) : tests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No tests found</p>
          </Card>
        ) : (
          tests.map((test) => {
            const isExpanded = expandedTest === test.id;
            
            return (
              <Card key={test.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpanded(test.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {test.name}
                        </h3>
                        <Badge variant="outline" size="sm">
                          {test.code}
                        </Badge>
                        {false && (
                          <Badge className="bg-purple-100 text-purple-800" size="sm">
                            Panel
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Beaker className="h-4 w-4 mr-1" />
                          {test.category}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          TAT: {test.turnaroundTime.routine}h
                        </span>
                        {test.price && (
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ${test.price}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-gray-50">
                    <div className="pt-4 space-y-3">
                      {/* Test Details */}
                      {test.notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                          <p className="text-sm text-gray-700">{test.notes}</p>
                        </div>
                      )}


                      {/* Specimen Requirements */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Specimen Requirements</h4>
                        <div className="text-sm text-gray-700">
                          <p>Type: {test.specimen.type}</p>
                          <p>Volume: {test.specimen.volume} {test.specimen.volumeUnit}</p>
                          <p>Container: {test.specimen.container || 'Standard'}</p>
                          {test.specimen.specialInstructions && (
                            <p className="mt-1 italic">
                              Special Instructions: {test.specimen.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Reference Ranges */}
                      {test.referenceRanges && test.referenceRanges.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Reference Ranges</h4>
                          <p className="text-sm text-gray-700">
                            {test.referenceRanges[0].textRange || 
                             `${test.referenceRanges[0].normalMin || ''} - ${test.referenceRanges[0].normalMax || ''}`}
                          </p>
                        </div>
                      )}


                      {/* Additional Info */}
                      <div className="flex items-start space-x-2 bg-blue-50 rounded-lg p-3">
                        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p>CPT Code: {test.cptCode || 'N/A'}</p>
                          <p>LOINC Code: {test.loincCode?.code || 'N/A'}</p>
                          {test.methodology && <p>Method: {test.methodology}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}