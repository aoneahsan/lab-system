import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useResult } from '@/hooks/useResult';
import { useApproveResult } from '@/hooks/useApproveResult';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ResultDetailScreen() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading } = useResult(resultId!);
  const { mutate: approveResult } = useApproveResult();

  const handleApprove = () => {
    if (!result || result.status === 'verified') return;

    approveResult(resultId!, {
      onSuccess: () => {
        toast.success('Result approved successfully');
      },
      onError: () => {
        toast.error('Failed to approve result');
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Implement PDF download functionality
    toast.success('Downloading PDF...');
  };

  if (isLoading || !result) {
    return (
      <div className="p-4">
        <Card className="p-8 text-center">
          <p className="text-gray-500">Loading result details...</p>
        </Card>
      </div>
    );
  }

  const statusColors = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    preliminary: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
    final: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    critical: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
    amended: { bg: 'bg-purple-100', text: 'text-purple-800', icon: FileText },
  };

  const status = statusColors[result.status as keyof typeof statusColors];
  const StatusIcon = status.icon;

  // Determine if value is abnormal
  const isAbnormal =
    result.flag && (result.flag === 'H' || result.flag === 'L' || result.flag === 'C');
  const TrendIcon = result.flag === 'H' ? TrendingUp : TrendingDown;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clinician/results')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Critical Alert */}
      {result.isCritical && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Critical Result</p>
              <p className="text-sm text-red-700">
                This result requires immediate attention. Please contact the patient or care team.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Result Info */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{result.testName}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {result.testCode} • {result.category}
            </p>
          </div>
          <Badge className={`${status.bg} ${status.text}`}>
            <StatusIcon className="h-4 w-4 mr-1" />
            {result.status}
          </Badge>
        </div>

        {/* Result Value */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Result</p>
              <div className="flex items-baseline space-x-2 mt-1">
                <p
                  className={`text-3xl font-bold ${isAbnormal ? 'text-red-600' : 'text-gray-900'}`}
                >
                  {result.value}
                </p>
                <p className="text-lg text-gray-600">{result.unit}</p>
                {isAbnormal && (
                  <Badge className="bg-red-100 text-red-800">
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {result.flag}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">Reference Range: {result.referenceRange}</p>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="border-t pt-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Patient Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-medium">{result.patientName}</p>
            </div>
            <div>
              <p className="text-gray-600">MRN</p>
              <p className="font-medium">{result.patientMRN}</p>
            </div>
            <div>
              <p className="text-gray-600">Order #</p>
              <p className="font-medium">{result.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Collection Date</p>
              <p className="font-medium">
                {format(new Date(result.collectionDate), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Method & Notes */}
        {result.method && (
          <div className="border-t pt-4 mt-4">
            <h2 className="font-semibold text-gray-900 mb-2">Method</h2>
            <p className="text-sm text-gray-700">{result.method}</p>
          </div>
        )}

        {result.notes && (
          <div className="border-t pt-4 mt-4">
            <h2 className="font-semibold text-gray-900 mb-2">Laboratory Notes</h2>
            <p className="text-sm text-gray-700">{result.notes}</p>
          </div>
        )}

        {/* Result History */}
        {result.history && result.history.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Result History
            </h2>
            <div className="space-y-2">
              {result.history.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {format(new Date(item.date), 'MMM d, yyyy')}
                  </span>
                  <span
                    className={`font-medium ${item.abnormal ? 'text-red-600' : 'text-gray-900'}`}
                  >
                    {item.value} {result.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="border-t pt-4 mt-4">
          <h2 className="font-semibold text-gray-900 mb-3">Processing Timeline</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-green-600 mt-1.5"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Sample collected</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(result.collectionDate), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Result entered</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(result.resultDate), 'MMM d, h:mm a')} • {result.performedBy}
                </p>
              </div>
            </div>
            {result.verifiedDate && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-purple-600 mt-1.5"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Result verified</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(result.verifiedDate), 'MMM d, h:mm a')} • {result.verifiedBy}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      {result.status === 'entered' && (
        <Card className="p-4">
          <Button variant="primary" className="w-full" onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Result
          </Button>
        </Card>
      )}
    </div>
  );
}
