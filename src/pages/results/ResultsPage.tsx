import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  AlertCircle,
  FileText,
  BarChart3,
  Download,
  Printer,
  Edit,
  History,
} from 'lucide-react';
import { useResults, useResultStatistics } from '@/hooks/useResults';
import { useTenant } from '@/hooks/useTenant';
import { usePatients } from '@/hooks/usePatients';
import { useSamples } from '@/hooks/useSamples';
import { useTests } from '@/hooks/useTests';
import { pdfService } from '@/services/pdf.service';
import { toast } from '@/stores/toast.store';
import CriticalResultsDashboard from '@/components/results/CriticalResultsDashboard';
import ResultAmendmentModal from '@/components/results/ResultAmendmentModal';
import ResultCorrectionModal from '@/components/results/ResultCorrectionModal';
import type { ResultFilter, TestResult } from '@/types/result.types';
import type { Test } from '@/types';

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters] = useState<ResultFilter>({});
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [amendmentModal, setAmendmentModal] = useState<{
    isOpen: boolean;
    result: TestResult | null;
  }>({ isOpen: false, result: null });
  const [correctionModal, setCorrectionModal] = useState<{
    isOpen: boolean;
    result: TestResult | null;
    test: Test | null;
  }>({ isOpen: false, result: null, test: null });

  const { data: results = [], isLoading } = useResults(filters);
  const { data: statistics } = useResultStatistics();
  const { tenant } = useTenant();
  const { data: patientsData } = usePatients();
  const { data: samplesData } = useSamples();
  const { data: testsData } = useTests();

  const patients = patientsData?.patients || [];
  const samples = samplesData || [];
  const tests = testsData?.tests || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      preliminary: 'bg-purple-100 text-purple-800',
      final: 'bg-green-100 text-green-800',
      corrected: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getFlagColor = (flag: string) => {
    const colors: Record<string, string> = {
      normal: 'text-green-600',
      abnormal: 'text-yellow-600',
      high: 'text-orange-600',
      low: 'text-orange-600',
      critical_high: 'text-red-600 font-bold',
      critical_low: 'text-red-600 font-bold',
    };
    return colors[flag] || 'text-gray-600';
  };

  const handleGeneratePDF = async (resultId: string) => {
    const result = results.find((r) => r.id === resultId);
    if (!result || !tenant) return;

    const sample = samples.find((s) => s.id === result.sampleId);
    const patient = patients.find((p) => p.id === result.patientId);
    const test = tests.find((t) => t.id === result.testId);

    if (!sample || !patient || !test) {
      toast.error('Missing Data', 'Unable to find complete data for this result');
      return;
    }

    try {
      const doc = pdfService.generateResultReport({
        result,
        sample,
        patient,
        test,
        tenant: {
          name: tenant.name,
          address: tenant.address,
          contact: tenant.contact,
        },
      });

      pdfService.downloadReport(doc, `result_${result.id}_${patient.patientId}`);
      toast.success('PDF Generated', 'Result report has been downloaded');
    } catch {
      toast.error('PDF Generation Failed', 'Failed to generate PDF report');
    }
  };

  const handlePrintResult = async (resultId: string) => {
    const result = results.find((r) => r.id === resultId);
    if (!result || !tenant) return;

    const sample = samples.find((s) => s.id === result.sampleId);
    const patient = patients.find((p) => p.id === result.patientId);
    const test = tests.find((t) => t.id === result.testId);

    if (!sample || !patient || !test) {
      toast.error('Missing Data', 'Unable to find complete data for this result');
      return;
    }

    try {
      const doc = pdfService.generateResultReport({
        result,
        sample,
        patient,
        test,
        tenant: {
          name: tenant.name,
          address: tenant.address,
          contact: tenant.contact,
        },
      });

      pdfService.printReport(doc);
    } catch {
      toast.error('Print Failed', 'Failed to print result report');
    }
  };

  const handleBatchPDF = async () => {
    if (selectedResults.length === 0) {
      toast.error('No Selection', 'Please select results to generate reports');
      return;
    }

    // TODO: Implement batch PDF generation
    toast.info('Coming Soon', 'Batch PDF generation will be available soon');
  };

  const handleAmendResult = (result: TestResult) => {
    if (result.status !== 'final') {
      toast.error(
        'Cannot Amend',
        'Only finalized results can be amended. Use correction for non-final results.'
      );
      return;
    }
    setAmendmentModal({ isOpen: true, result });
  };

  const handleCorrectResult = (result: TestResult) => {
    if (result.status === 'final') {
      toast.error(
        'Cannot Correct',
        'Finalized results cannot be corrected. Use amendment instead.'
      );
      return;
    }
    const test = tests.find((t) => t.id === result.testId);
    if (!test) {
      toast.error('Test Not Found', 'Unable to find test information');
      return;
    }
    setCorrectionModal({ isOpen: true, result, test });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
            <p className="text-gray-600 mt-2">Manage test results and reports</p>
          </div>
          <div className="flex gap-3">
            {selectedResults.length > 0 && (
              <button
                onClick={handleBatchPDF}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download ({selectedResults.length})
              </button>
            )}
            <button
              onClick={() => navigate('/results/review')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Review Results
            </button>
            <button
              onClick={() => navigate('/results/entry')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Enter Result
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Results</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalResults}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Results</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.todaysResults}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Results</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.pendingResults}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Results</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.criticalResults}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Critical Results Dashboard */}
      {statistics && statistics.criticalResults > 0 && (
        <div className="mb-6">
          <CriticalResultsDashboard />
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No results found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedResults.length === results.length && results.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResults(results.map((r) => r.id));
                        } else {
                          setSelectedResults([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedResults.includes(result.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResults([...selectedResults, result.id]);
                          } else {
                            setSelectedResults(selectedResults.filter((id) => id !== result.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{result.testName}</div>
                        <div className="text-sm text-gray-500">{result.testCode}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.value} {result.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getFlagColor(result.flag)}`}>
                        {result.flag.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          result.status
                        )}`}
                      >
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.performedAt.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/results/${result.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {result.status === 'final' ? (
                          <button
                            onClick={() => handleAmendResult(result)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Amend Result"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        ) : (
                          result.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCorrectResult(result)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Correct Result"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleGeneratePDF(result.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePrintResult(result.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Print"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Amendment Modal */}
      {amendmentModal.result && (
        <ResultAmendmentModal
          isOpen={amendmentModal.isOpen}
          onClose={() => setAmendmentModal({ isOpen: false, result: null })}
          result={amendmentModal.result}
        />
      )}

      {/* Correction Modal */}
      {correctionModal.result && correctionModal.test && (
        <ResultCorrectionModal
          isOpen={correctionModal.isOpen}
          onClose={() => setCorrectionModal({ isOpen: false, result: null, test: null })}
          result={correctionModal.result}
          test={correctionModal.test}
        />
      )}
    </div>
  );
};

export default ResultsPage;
