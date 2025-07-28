import React, { useState } from 'react';
import { ClipboardList, FileText } from 'lucide-react';
import OrderList from '@/components/orders/OrderList';
import BarcodeGenerator from '@/components/orders/BarcodeGenerator';

const tabs = [
  { id: 'orders', label: 'Test Orders', icon: ClipboardList },
  { id: 'barcodes', label: 'Barcode Generator', icon: FileText },
];

export default function OrderDashboard() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                    ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && <OrderList />}
          {activeTab === 'barcodes' && (
            <div className="max-w-2xl mx-auto">
              <BarcodeGenerator value="SAMPLE123456" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
