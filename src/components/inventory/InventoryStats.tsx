/**
 * Inventory Statistics Component
 * Displays key inventory metrics and statistics
 */

import React from 'react';
import { Package, DollarSign, AlertTriangle, TrendingDown, BarChart3, Clock } from 'lucide-react';

interface InventoryStatsProps {
  stats: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    expiringItems: number;
    outOfStockItems: number;
    activeAlerts: number;
    categoryBreakdown?: Record<string, number>;
  };
  isLoading?: boolean;
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({ stats, isLoading = false }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Items',
      value: stats.totalItems,
      icon: Package,
      color: 'blue',
      format: (val: number) => val.toString(),
    },
    {
      title: 'Total Value',
      value: stats.totalValue,
      icon: DollarSign,
      color: 'green',
      format: formatCurrency,
    },
    {
      title: 'Low Stock',
      value: stats.lowStockItems,
      icon: TrendingDown,
      color: 'yellow',
      format: (val: number) => val.toString(),
    },
    {
      title: 'Expiring Soon',
      value: stats.expiringItems,
      icon: Clock,
      color: 'orange',
      format: (val: number) => val.toString(),
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStockItems,
      icon: AlertTriangle,
      color: 'red',
      format: (val: number) => val.toString(),
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts,
      icon: BarChart3,
      color: 'purple',
      format: (val: number) => val.toString(),
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            orange: 'bg-orange-100 text-orange-600',
            red: 'bg-red-100 text-red-600',
            purple: 'bg-purple-100 text-purple-600',
          };

          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div
                className={`inline-flex p-2 rounded-lg ${
                  colorClasses[stat.color as keyof typeof colorClasses]
                } mb-4`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.format(stat.value)}</p>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Value by Category</h3>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, value]) => {
                const percentage = (value / stats.totalValue) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(value)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
};
