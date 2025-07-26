import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  Search, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import { useClinicianResults } from '@/hooks/useClinicianResults';
import { format } from 'date-fns';

export function ResultsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: results = [], isLoading } = useClinicianResults({ 
    clinicianId: 'current',
    status: statusFilter === 'all' ? undefined : statusFilter 
  });

  const filteredResults = results.filter(result => 
    result.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.testName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    preliminary: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
    final: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    critical: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
    amended: { bg: 'bg-purple-100', text: 'text-purple-800', icon: FileText },
  };

  const resultStats = {
    total: results.length,
    pending: results.filter(r => r.status === 'pending').length,
    final: results.filter(r => r.status === 'final').length,
    critical: results.filter(r => r.isCritical).length,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
        <button className="p-2 rounded-lg hover:bg-gray-100">
          <Download className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card 
          className={`p-3 text-center cursor-pointer ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg font-bold">{resultStats.total}</p>
        </Card>
        <Card 
          className={`p-3 text-center cursor-pointer ${statusFilter === 'pending' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          <p className="text-xs text-gray-600">Pending</p>
          <p className="text-lg font-bold text-yellow-600">{resultStats.pending}</p>
        </Card>
        <Card 
          className={`p-3 text-center cursor-pointer ${statusFilter === 'final' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter('final')}
        >
          <p className="text-xs text-gray-600">Final</p>
          <p className="text-lg font-bold text-green-600">{resultStats.final}</p>
        </Card>
        <Card 
          className={`p-3 text-center cursor-pointer ${statusFilter === 'critical' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setStatusFilter('critical')}
        >
          <p className="text-xs text-gray-600">Critical</p>
          <p className="text-lg font-bold text-red-600">{resultStats.critical}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="search"
          placeholder="Search by patient, order number, or test name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Loading results...</p>
          </Card>
        ) : filteredResults.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No results found</p>
          </Card>
        ) : (
          filteredResults.map((result) => {
            const status = statusColors[result.status as keyof typeof statusColors];
            const StatusIcon = status.icon;

            return (
              <Link key={result.id} to={`/clinician/results/${result.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {result.testName}
                        </h3>
                        <Badge className={`${status.bg} ${status.text}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {result.status}
                        </Badge>
                        {result.isCritical && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Critical
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {result.patientName} • Order #{result.orderNumber}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Result: {result.value} {result.unit}</span>
                        {result.referenceRange && (
                          <span>Ref: {result.referenceRange}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(result.resultDate), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}