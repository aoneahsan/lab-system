import React, { useState } from 'react';
import { Package, AlertTriangle, TrendingDown, Plus, Minus } from 'lucide-react';
import { toast } from '@/stores/toast.store';

interface InventoryItem {
  id: string;
  name: string;
  category: 'tubes' | 'needles' | 'supplies';
  currentStock: number;
  minStock: number;
  unit: string;
  color?: string;
  size?: string;
  expiry?: string;
}

export const InventoryScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'tubes' | 'needles' | 'supplies'>('tubes');
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'EDTA Tubes',
      category: 'tubes',
      currentStock: 150,
      minStock: 100,
      unit: 'units',
      color: 'purple',
      size: '3ml',
      expiry: '2025-06-30',
    },
    {
      id: '2',
      name: 'SST Tubes',
      category: 'tubes',
      currentStock: 80,
      minStock: 100,
      unit: 'units',
      color: 'gold',
      size: '5ml',
      expiry: '2025-08-15',
    },
    {
      id: '3',
      name: 'Fluoride Tubes',
      category: 'tubes',
      currentStock: 45,
      minStock: 50,
      unit: 'units',
      color: 'gray',
      size: '2ml',
      expiry: '2025-05-20',
    },
    {
      id: '4',
      name: '21G Needles',
      category: 'needles',
      currentStock: 200,
      minStock: 150,
      unit: 'units',
      size: '21G x 1"',
    },
    {
      id: '5',
      name: '23G Butterfly',
      category: 'needles',
      currentStock: 50,
      minStock: 75,
      unit: 'units',
      size: '23G x 3/4"',
    },
    {
      id: '6',
      name: 'Alcohol Swabs',
      category: 'supplies',
      currentStock: 500,
      minStock: 300,
      unit: 'pcs',
    },
    {
      id: '7',
      name: 'Tourniquets',
      category: 'supplies',
      currentStock: 15,
      minStock: 20,
      unit: 'units',
    },
    {
      id: '8',
      name: 'Gauze Pads',
      category: 'supplies',
      currentStock: 250,
      minStock: 200,
      unit: 'pcs',
    },
  ]);

  const filteredInventory = inventory.filter(item => item.category === activeCategory);

  const getTubeColorClass = (color?: string) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-500',
      gold: 'bg-yellow-500',
      gray: 'bg-gray-500',
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      green: 'bg-green-500',
    };
    return color ? colorMap[color] || 'bg-gray-400' : 'bg-gray-400';
  };

  const getStockStatus = (current: number, min: number) => {
    const percentage = (current / min) * 100;
    if (percentage <= 50) return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' };
    if (percentage <= 90) return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Low' };
    return { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Good' };
  };

  const handleUpdateStock = (itemId: string, change: number) => {
    setInventory(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, currentStock: Math.max(0, item.currentStock + change) }
          : item
      )
    );
    toast.success('Stock Updated', `Stock ${change > 0 ? 'added' : 'removed'} successfully`);
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your supplies</p>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveCategory('tubes')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeCategory === 'tubes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Tubes
            </button>
            <button
              onClick={() => setActiveCategory('needles')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeCategory === 'needles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Needles
            </button>
            <button
              onClick={() => setActiveCategory('supplies')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeCategory === 'supplies' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Supplies
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {inventory.some(item => item.currentStock <= item.minStock) && (
        <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800">Low Stock Alert</p>
            <p className="text-yellow-700">
              {inventory.filter(item => item.currentStock <= item.minStock).length} items need restocking
            </p>
          </div>
        </div>
      )}

      {/* Inventory List */}
      <div className="p-4 space-y-3">
        {filteredInventory.map((item) => {
          const status = getStockStatus(item.currentStock, item.minStock);
          return (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {item.color && (
                    <div className={`w-4 h-4 rounded-full ${getTubeColorClass(item.color)} mt-1`} />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                    {item.expiry && (
                      <p className="text-sm text-gray-500">Expires: {item.expiry}</p>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {/* Stock Level */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Stock Level</span>
                  <span className="text-sm font-medium">
                    {item.currentStock} / {item.minStock} {item.unit}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      item.currentStock <= item.minStock * 0.5 ? 'bg-red-500' :
                      item.currentStock <= item.minStock * 0.9 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((item.currentStock / item.minStock) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Quick Stock Update */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStock(item.id, -1)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleUpdateStock(item.id, -10)}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                >
                  -10
                </button>
                <div className="flex-1 text-center">
                  <span className="text-lg font-medium">{item.currentStock}</span>
                  <span className="text-sm text-gray-500 ml-1">{item.unit}</span>
                </div>
                <button
                  onClick={() => handleUpdateStock(item.id, 10)}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                >
                  +10
                </button>
                <button
                  onClick={() => handleUpdateStock(item.id, 1)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Request Supplies Button */}
      <div className="p-4">
        <button className="w-full btn btn-primary flex items-center justify-center gap-2">
          <Package className="h-5 w-5" />
          Request Supplies
        </button>
      </div>
    </div>
  );
};