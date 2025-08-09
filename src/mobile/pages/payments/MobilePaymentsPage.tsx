import React, { useState } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Plus, 
  ChevronRight,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit' | 'hsa' | 'insurance';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  holderName: string;
}

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
  invoiceId?: string;
  testName?: string;
}

interface Balance {
  current: number;
  pending: number;
  insurance: number;
}

const MobilePaymentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'methods' | 'history'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedsetSelectedFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Mock data
  const [balance] = useState<Balance>({
    current: 125.50,
    pending: 450.00,
    insurance: 325.00
  });

  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'credit',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      holderName: 'John Doe'
    },
    {
      id: '2',
      type: 'hsa',
      last4: '5678',
      brand: 'HSA Bank',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false,
      holderName: 'John Doe'
    },
    {
      id: '3',
      type: 'insurance',
      last4: '9012',
      brand: 'Blue Cross',
      expiryMonth: 0,
      expiryYear: 0,
      isDefault: false,
      holderName: 'John Doe'
    }
  ]);

  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      date: new Date(2024, 9, 25),
      description: 'Lab Test Payment',
      amount: 75.00,
      status: 'completed',
      paymentMethod: 'Visa ****4242',
      testName: 'Complete Blood Count'
    },
    {
      id: '2',
      date: new Date(2024, 9, 20),
      description: 'Insurance Copay',
      amount: 25.00,
      status: 'completed',
      paymentMethod: 'Insurance',
      testName: 'Lipid Panel'
    },
    {
      id: '3',
      date: new Date(2024, 9, 15),
      description: 'Lab Test Payment',
      amount: 150.00,
      status: 'pending',
      paymentMethod: 'Pending Insurance',
      testName: 'Thyroid Function Test'
    },
    {
      id: '4',
      date: new Date(2024, 9, 10),
      description: 'Lab Test Payment',
      amount: 200.00,
      status: 'failed',
      paymentMethod: 'Visa ****4242',
      testName: 'Comprehensive Metabolic Panel'
    }
  ]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.testName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || transaction.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getPaymentMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'credit':
      case 'debit':
        return <CreditCard className="h-5 w-5" />;
      case 'hsa':
        return <DollarSign className="h-5 w-5" />;
      case 'insurance':
        return <Receipt className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
    }
  };

  const handleAddPaymentMethod = () => {
    console.log('Add payment method');
  };

  const handleDownloadReceipt = (transactionId: string) => {
    console.log('Download receipt for:', transactionId);
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your billing and payments</p>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'methods' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Methods
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Balance Cards */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Balance</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-900">${balance.current.toFixed(2)}</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
                    Pay Now
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Pending Insurance</p>
                    <p className="text-xl font-semibold text-gray-900">${balance.insurance.toFixed(2)}</p>
                  </div>
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Processing</p>
                    <p className="text-xl font-semibold text-gray-900">${balance.pending.toFixed(2)}</p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-sm text-indigo-600 font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 3).map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(transaction.status)}
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{transaction.testName}</p>
                        <p className="text-sm text-gray-500">
                          {format(transaction.date, 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${getStatusColor(transaction.status)}`}>
                      ${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'methods' && (
          <div className="space-y-4">
            {paymentMethods.map(method => (
              <div key={method.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      method.type === 'insurance' ? 'bg-green-100 text-green-600' :
                      method.type === 'hsa' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getPaymentMethodIcon(method.type)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">
                        {method.brand} {method.last4 && `•••• ${method.last4}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {method.type === 'insurance' ? 'Insurance' :
                         method.expiryMonth > 0 ? `Expires ${method.expiryMonth}/${method.expiryYear}` :
                         'No expiry'}
                      </p>
                      {method.isDefault && (
                        <span className="inline-block mt-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}

            <button
              onClick={handleAddPaymentMethod}
              className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Payment Method
            </button>
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter('completed')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedFilter === 'completed'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setSelectedFilter('pending')}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedFilter === 'pending'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              {filteredTransactions.map(transaction => (
                <div key={transaction.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start">
                      {getStatusIcon(transaction.status)}
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        {transaction.testName && (
                          <p className="text-sm text-gray-600">{transaction.testName}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          {format(transaction.date, 'MMM dd, yyyy')} • {transaction.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${getStatusColor(transaction.status)}`}>
                      ${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                  {transaction.status === 'completed' && (
                    <button
                      onClick={() => handleDownloadReceipt(transaction.id)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Receipt
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-20" />
    </div>
  );
};

export default MobilePaymentsPage;