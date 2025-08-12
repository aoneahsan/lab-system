import { Package, AlertTriangle, TrendingDown, ShoppingCart, Download, BarChart3 } from 'lucide-react';
import { useInventoryItems } from '@/hooks/useInventory';
import { toast } from '@/stores/toast.store';

export default function InventoryAdminControls() {
  const { data } = useInventoryItems();
  const inventory = Array.isArray(data) ? data : (data?.items || []);

  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter(i => i.quantity <= i.minQuantity).length,
    expiringSoon: 8, // Mock data
    totalValue: '$45,250.00', // Mock data
  };

  const handleGenerateOrder = () => {
    toast.success('Order generated', 'Purchase order has been generated for low stock items');
  };

  const handleExportInventory = () => {
    toast.info('Export started', 'Inventory report export initiated');
  };

  return (
    <div className="space-y-6">
      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalValue}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Inventory Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Management</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleGenerateOrder}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Generate Order
          </button>
          
          <button 
            onClick={handleExportInventory}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Inventory
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <BarChart3 className="h-4 w-4" />
            Usage Report
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
            <AlertTriangle className="h-4 w-4" />
            Expiry Report
          </button>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Critical Inventory Alerts</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Glucose Test Strips</p>
                <p className="text-sm text-red-600">Stock critically low: Only 50 units left</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline">Order Now</button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">COVID-19 Test Kits</p>
                <p className="text-sm text-yellow-600">Expiring in 30 days: 200 units</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline">View Details</button>
          </div>
        </div>
      </div>
    </div>
  );
}