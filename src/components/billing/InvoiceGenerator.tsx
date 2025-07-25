import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { billingService, Bill } from '@/services/billing';
import { formatCurrency } from '@/utils/formatters';
import {
  DocumentTextIcon,
  PrinterIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const InvoiceGenerator: React.FC = () => {
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date()
  });

  const { data: billsData, isLoading } = useQuery({
    queryKey: ['bills', searchTerm, dateRange],
    queryFn: () => billingService.getBills({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      limit: 50
    })
  });

  const generateMutation = useMutation({
    mutationFn: (billId: string) => billingService.generateInvoice(billId),
    onSuccess: (blob, billId) => {
      // Download the invoice
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  });

  const printMutation = useMutation({
    mutationFn: (billId: string) => billingService.printInvoice(billId)
  });

  const emailMutation = useMutation({
    mutationFn: ({ billId, email }: { billId: string; email: string }) =>
      billingService.emailInvoice(billId, email),
    onSuccess: () => {
      setShowEmailDialog(false);
      setEmailAddress('');
    }
  });

  const filteredBills = billsData?.bills.filter(bill => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      bill.billNumber.toLowerCase().includes(search) ||
      bill.patientId.toLowerCase().includes(search)
    );
  });

  const handleGenerateInvoice = (bill: Bill) => {
    setSelectedBill(bill);
    generateMutation.mutate(bill.billId);
  };

  const handlePrintInvoice = (bill: Bill) => {
    setSelectedBill(bill);
    printMutation.mutate(bill.billId);
  };

  const handleEmailInvoice = (bill: Bill) => {
    setSelectedBill(bill);
    setShowEmailDialog(true);
  };

  const sendEmail = () => {
    if (selectedBill && emailAddress) {
      emailMutation.mutate({ billId: selectedBill.billId, email: emailAddress });
    }
  };

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Invoice Generator</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate, print, and email invoices for patient bills
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">Search bills</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by bill number or patient ID..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="sr-only">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({
                ...dateRange,
                startDate: new Date(e.target.value)
              })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="sr-only">End Date</label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({
                ...dateRange,
                endDate: new Date(e.target.value)
              })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bill Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading bills...
                </td>
              </tr>
            ) : filteredBills?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No bills found
                </td>
              </tr>
            ) : (
              filteredBills?.map((bill) => (
                <tr key={bill.billId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bill.billNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Patient #{bill.patientId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(bill.totals.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleGenerateInvoice(bill)}
                        disabled={generateMutation.isPending && selectedBill?.billId === bill.billId}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        title="Download Invoice"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handlePrintInvoice(bill)}
                        disabled={printMutation.isPending && selectedBill?.billId === bill.billId}
                        className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                        title="Print Invoice"
                      >
                        <PrinterIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEmailInvoice(bill)}
                        className="text-green-600 hover:text-green-900"
                        title="Email Invoice"
                      >
                        <EnvelopeIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Email Dialog */}
      {showEmailDialog && selectedBill && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Email Invoice
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Send invoice for bill #{selectedBill.billNumber} via email
            </p>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="patient@example.com"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEmailDialog(false);
                  setEmailAddress('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={!emailAddress || emailMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {emailMutation.isPending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Messages */}
      {generateMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 p-4 rounded-lg shadow-lg">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm font-medium text-green-800">
              Invoice downloaded successfully!
            </p>
          </div>
        </div>
      )}

      {printMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 p-4 rounded-lg shadow-lg">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm font-medium text-green-800">
              Invoice sent to printer!
            </p>
          </div>
        </div>
      )}

      {emailMutation.isSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 p-4 rounded-lg shadow-lg">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm font-medium text-green-800">
              Invoice emailed successfully!
            </p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(generateMutation.isError || printMutation.isError || emailMutation.isError) && (
        <div className="fixed bottom-4 right-4 bg-red-50 p-4 rounded-lg shadow-lg">
          <div className="flex">
            <XMarkIcon className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm font-medium text-red-800">
              An error occurred. Please try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;