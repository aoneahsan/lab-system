import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { useInvoice, usePayments, useRecordPayment } from '@/hooks/useBilling';
import PaymentModal from '@/components/billing/PaymentModal';
import type { PaymentFormData } from '@/types/billing.types';

const InvoiceDetailPage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(invoiceId!);
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(invoiceId);
  const recordPaymentMutation = useRecordPayment();

  const handleRecordPayment = async (data: PaymentFormData) => {
    await recordPaymentMutation.mutateAsync({
      ...data,
      invoiceId: invoiceId!,
    });
    setShowPaymentModal(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      check: 'Check',
      insurance: 'Insurance',
      eft: 'Electronic Transfer',
      other: 'Other',
    };
    return labels[method] || method;
  };

  if (invoiceLoading || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/billing')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Billing
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  invoice.status
                )}`}
              >
                {invoice.status}
              </span>
              <span className="text-gray-600">
                Created {invoice.invoiceDate.toDate().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Invoice
            </button>
            {invoice.balanceDue > 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Record Payment
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="font-medium">{invoice.invoiceDate.toDate().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">{invoice.dueDate.toDate().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Patient ID</p>
                <p className="font-medium">{invoice.patientId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Terms</p>
                <p className="font-medium">{invoice.paymentTerms} days</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">
                      Description
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">
                      Qty
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">
                      Rate
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(invoice.lineItems || invoice.items).map((item, index) => (
                    <tr key={index}>
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{item.description || item.testName}</p>
                          {(item.code || item.testCode) && <p className="text-sm text-gray-500">Code: {item.code || item.testCode}</p>}
                        </div>
                      </td>
                      <td className="text-right py-4">{item.quantity}</td>
                      <td className="text-right py-4">${item.unitPrice.toFixed(2)}</td>
                      <td className="text-right py-4 font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm mt-2">
                  <span>Discount</span>
                  <span className="text-green-600">-${invoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mt-2">
                <span>Tax ({(invoice.taxRate * 100).toFixed(1)}%)</span>
                <span>${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg mt-4 pt-4 border-t">
                <span>Total</span>
                <span>${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment History</h2>
            {paymentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No payments recorded yet</div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          ${payment.amount.toFixed(2)} - {getPaymentMethodLabel(payment.method)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {payment.paymentDate.toDate().toLocaleDateString()}
                        </p>
                        {payment.referenceNumber && (
                          <p className="text-sm text-gray-500">Ref: {payment.referenceNumber}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">by {payment.createdBy}</span>
                    </div>
                    {payment.notes && <p className="text-sm text-gray-600 mt-2">{payment.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-medium">${invoice.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium text-green-600">${invoice.paidAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Balance Due</span>
                  <span className="font-bold text-lg">${invoice.balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {invoice.paymentStatus === 'overdue' && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Payment Overdue</p>
                  <p className="text-sm text-red-600">This invoice is past its due date</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Insurance Info */}
          {invoice.insuranceClaimId && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Insurance Claim</h2>
              <button
                onClick={() => navigate(`/billing/claims/${invoice.insuranceClaimId}`)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Claim Details →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && invoice && (
        <PaymentModal
          isOpen={showPaymentModal}
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default InvoiceDetailPage;
