/**
 * Inventory Alerts Component
 * Displays and manages inventory alerts
 */

import React from 'react';
import type { InventoryAlert } from '@/types/inventory.types';
import { AlertTriangle, Package, Clock, TrendingDown, CheckCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { modalService } from '@/services/modal.service';

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  onAcknowledge: (alertId: string, actionTaken?: string) => void;
  isLoading?: boolean;
}

export const InventoryAlerts: React.FC<InventoryAlertsProps> = ({
  alerts,
  onAcknowledge,
  isLoading = false,
}) => {
  const getAlertIcon = (type: InventoryAlert['type']) => {
    switch (type) {
      case 'low_stock':
      case 'reorder_needed':
        return <TrendingDown className="w-5 h-5" />;
      case 'expiring_soon':
      case 'expired':
        return <Clock className="w-5 h-5" />;
      case 'overstock':
        return <Package className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getAlertColor = (priority: InventoryAlert['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getAlertMessage = (alert: InventoryAlert) => {
    switch (alert.type) {
      case 'low_stock':
        return `Low stock: ${alert.currentValue} units remaining (minimum: ${alert.thresholdValue})`;
      case 'reorder_needed':
        return `Reorder needed: ${alert.currentValue} units remaining (reorder point: ${alert.thresholdValue})`;
      case 'expiring_soon':
        return `Expiring soon: ${alert.lotNumber ? `Lot ${alert.lotNumber}` : 'Item'} expires on ${
          alert.expirationDate
            ? new Date(alert.expirationDate.toDate()).toLocaleDateString()
            : 'unknown date'
        }`;
      case 'expired':
        return `Expired: ${alert.lotNumber ? `Lot ${alert.lotNumber}` : 'Item'} expired on ${
          alert.expirationDate
            ? new Date(alert.expirationDate.toDate()).toLocaleDateString()
            : 'unknown date'
        }`;
      case 'overstock':
        return `Overstock: ${alert.currentValue} units in stock (maximum: ${alert.thresholdValue})`;
      default:
        return 'Unknown alert';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-gray-600">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 rounded-lg p-4 ${getAlertColor(alert.priority)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div
                className={`
                ${alert.priority === 'critical' ? 'text-red-600' : ''}
                ${alert.priority === 'high' ? 'text-orange-600' : ''}
                ${alert.priority === 'medium' ? 'text-yellow-600' : ''}
                ${alert.priority === 'low' ? 'text-blue-600' : ''}
              `}
              >
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{alert.itemName}</h4>
                <p className="text-sm text-gray-600 mt-1">{getAlertMessage(alert)}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Created {formatDistanceToNow(alert.createdAt.toDate(), { addSuffix: true })}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const actionTaken = await modalService.prompt({
                  title: 'Acknowledge Alert',
                  message: 'Action taken (optional):',
                  placeholder: 'Describe the action taken...',
                  required: false
                });
                onAcknowledge(alert.id, actionTaken || undefined);
              }}
              className="ml-4 p-1 hover:bg-white rounded-full transition-colors"
              title="Acknowledge alert"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
