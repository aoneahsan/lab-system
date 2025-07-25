import React, { useState } from 'react';
import { Package, TrendingUp, TrendingDown, RotateCcw, Trash2 } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventory.store';
import type { StockMovement } from '@/types/inventory';

export default function StockTracking() {
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [movementType, setMovementType] = useState<StockMovement['type']>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const { items, stockMovements, recordStockMovement, fetchStockMovements, loading } = useInventoryStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity) return;

    await recordStockMovement({
      itemId: selectedItem,
      type: movementType,
      quantity: parseInt(quantity),
      reason,
      referenceNumber,
      notes,
    });

    // Reset form
    setShowAddMovement(false);
    setSelectedItem('');
    setQuantity('');
    setReason('');
    setReferenceNumber('');
    setNotes('');
  };

  const getMovementIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'adjustment':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'disposal':
        return <Trash2 className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: StockMovement['type']) => {
    switch (type) {
      case 'in':
        return 'text-green-600 bg-green-100';
      case 'out':
        return 'text-red-600 bg-red-100';
      case 'adjustment':
        return 'text-blue-600 bg-blue-100';
      case 'disposal':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Stock Movements</h2>
        <button 
          onClick={() => setShowAddMovement(!showAddMovement)}
          className="btn btn-primary"
        >
          Record Movement
        </button>
      </div>

      {/* Add Movement Form */}
      {showAddMovement && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Record Stock Movement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => {
                    setSelectedItem(e.target.value);
                    if (e.target.value) {
                      fetchStockMovements(e.target.value);
                    }
                  }}
                  className="input"
                  required
                >
                  <option value="">Select an item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Movement Type
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as StockMovement['type'])}
                  className="input"
                  required
                >
                  <option value="in">Stock In (Receipt)</option>
                  <option value="out">Stock Out (Usage)</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="return">Return</option>
                  <option value="disposal">Disposal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="input"
                  placeholder="PO number, invoice, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                  placeholder="Reason for movement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddMovement(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                Record Movement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Movements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Movements</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {stockMovements.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {selectedItem ? 'No movements found for this item' : 'Select an item to view movements'}
            </div>
          ) : (
            stockMovements.map((movement) => {
              const item = items.find(i => i.id === movement.itemId);
              return (
                <div key={movement.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getMovementIcon(movement.type)}
                      <div>
                        <div className="font-medium text-gray-900">
                          {item?.name || 'Unknown Item'}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMovementColor(movement.type)}`}>
                            {movement.type.toUpperCase()}
                          </span>
                          <span className="ml-2">
                            Quantity: {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                          {movement.referenceNumber && (
                            <span className="ml-2">
                              Ref: {movement.referenceNumber}
                            </span>
                          )}
                        </div>
                        {movement.reason && (
                          <div className="text-sm text-gray-500 mt-1">
                            Reason: {movement.reason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {movement.createdAt.toDate().toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {movement.createdAt.toDate().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}