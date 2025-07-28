import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  AlertCircle,
  Phone,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useCriticalResults } from '@/hooks/useCriticalResults';
import { useAcknowledgeResult } from '@/hooks/useAcknowledgeResult';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function CriticalResultsScreen() {
  const [filter, setFilter] = useState<'pending' | 'acknowledged' | 'all'>('pending');
  const { data: results = [], isLoading, refetch } = useCriticalResults({ filter });
  const { mutate: acknowledgeResult } = useAcknowledgeResult();

  const handleAcknowledge = (resultId: string) => {
    acknowledgeResult(
      { resultId },
      {
        onSuccess: () => {
          toast.success('Critical result acknowledged');
          refetch();
        },
        onError: () => {
          toast.error('Failed to acknowledge result');
        },
      }
    );
  };

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleMessage = () => {
    // Implement messaging functionality
    toast.success('Opening secure message...');
  };

  const criticalityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-orange-100 text-orange-800 border-orange-200',
    panic: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <AlertCircle className="h-6 w-6 mr-2 text-red-600" />
          Critical Results
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Immediate attention required for patient safety
        </p>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pending ({results.filter((r) => !r.acknowledged).length})
        </Button>
        <Button
          variant={filter === 'acknowledged' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('acknowledged')}
        >
          Acknowledged
        </Button>
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {/* Alert Message */}
      {filter === 'pending' && results.filter((r) => !r.acknowledged).length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">
                You have {results.filter((r) => !r.acknowledged).length} critical results pending
                acknowledgment
              </p>
              <p className="text-sm text-red-700 mt-1">
                Please review and contact patients immediately as required by protocol.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Results List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Loading critical results...</p>
          </Card>
        ) : results.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-gray-500">No critical results to review</p>
          </Card>
        ) : (
          results.map((result) => {
            const criticalityClass =
              criticalityColors[result.criticality as keyof typeof criticalityColors];

            return (
              <Card
                key={result.id}
                className={`p-4 ${result.acknowledged ? 'opacity-75' : ''} ${
                  !result.acknowledged ? 'border-red-300' : ''
                }`}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{result.testName}</h3>
                        <Badge className={criticalityClass}>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {result.criticality.toUpperCase()}
                        </Badge>
                        {result.acknowledged && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        <User className="h-3 w-3 inline mr-1" />
                        {result.patientName} • MRN: {result.patientMRN}
                      </p>
                    </div>
                    <Link to={`/clinician/results/${result.id}`}>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </Link>
                  </div>

                  {/* Result Value */}
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-sm text-gray-600">Result:</span>
                      <span className="text-lg font-bold text-red-600">
                        {result.value} {result.unit}
                      </span>
                      <span className="text-sm text-gray-600">(Ref: {result.referenceRange})</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{result.criticalMessage}</p>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDistanceToNow(new Date(result.resultDate), { addSuffix: true })}
                    </span>
                    <span>Reported: {format(new Date(result.resultDate), 'MMM d, h:mm a')}</span>
                  </div>

                  {/* Actions */}
                  {!result.acknowledged && (
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcknowledge(result.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCall(result.patientPhone)}
                        className="flex-1"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call Patient
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleMessage()}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Acknowledgment Info */}
                  {result.acknowledged && result.acknowledgedBy && result.acknowledgedAt && (
                    <div className="bg-green-50 rounded-lg p-3 text-sm">
                      <p className="text-green-800">
                        Acknowledged by {result.acknowledgedBy} on{' '}
                        {format(new Date(result.acknowledgedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                      {result.acknowledgedNote && (
                        <p className="text-green-700 mt-1">Note: {result.acknowledgedNote}</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
