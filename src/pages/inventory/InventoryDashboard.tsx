import React, { useState } from 'react';
import { Package, TrendingUp, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import InventoryList from '@/components/inventory/InventoryList';
import StockTracking from '@/components/inventory/StockTracking';
import PurchaseOrders from '@/components/inventory/PurchaseOrders';
import Suppliers from '@/components/inventory/Suppliers';

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('inventory');

  const tabs = [
    { id: 'inventory', label: 'Inventory Items', icon: Package },
    { id: 'stock', label: 'Stock Tracking', icon: TrendingUp },
    { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
  ];

  const stats = [
    {
      label: 'Total Items',
      value: '324',
      change: '+12%',
      trend: 'up',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      label: 'Low Stock Items',
      value: '18',
      change: '-5%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      label: 'Pending Orders',
      value: '7',
      change: '+3',
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-indigo-500',
    },
    {
      label: 'Active Suppliers',
      value: '42',
      change: '+2',
      trend: 'up',
      icon: Users,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p
                  className={`text-sm mt-1 ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change} from last month
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'inventory' && <InventoryList />}
          {activeTab === 'stock' && <StockTracking />}
          {activeTab === 'orders' && <PurchaseOrders />}
          {activeTab === 'suppliers' && <Suppliers />}
        </div>
      </div>
    </div>
  );
}
