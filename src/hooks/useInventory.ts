/**
 * Inventory Management Hooks
 * React Query hooks for inventory operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory.service';
import { useTenant } from '@/hooks/useTenant';
import { useAuthStore } from '@/stores/auth.store';
import type { 
  InventoryItemFormData, 
  StockTransactionFormData,
  PurchaseOrder
} from '@/types/inventory.types';
import { DocumentSnapshot } from 'firebase/firestore';
import { toast } from '@/hooks/useToast';

// Query keys
const QUERY_KEYS = {
  items: (tenantId: string) => ['inventory', 'items', tenantId],
  item: (tenantId: string, itemId: string) => ['inventory', 'item', tenantId, itemId],
  transactions: (tenantId: string, itemId: string) => ['inventory', 'transactions', tenantId, itemId],
  lots: (tenantId: string, itemId: string) => ['inventory', 'lots', tenantId, itemId],
  reorderItems: (tenantId: string) => ['inventory', 'reorder', tenantId],
  expiringItems: (tenantId: string) => ['inventory', 'expiring', tenantId],
  alerts: (tenantId: string) => ['inventory', 'alerts', tenantId],
  value: (tenantId: string) => ['inventory', 'value', tenantId]
};

/**
 * Hook to get inventory items
 */
export function useInventoryItems(
  filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
  },
  pageSize: number = 20
) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id ? [...QUERY_KEYS.items(tenant.id), filters, pageSize] : ['inventory-no-tenant'],
    queryFn: async ({ pageParam }) => {
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.getItems(
        tenant.id,
        filters,
        pageSize,
        pageParam as DocumentSnapshot | undefined
      );
    },
    enabled: !!tenant?.id
  });
}

/**
 * Hook to get a single inventory item
 */
export function useInventoryItem(itemId: string) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id ? QUERY_KEYS.item(tenant.id, itemId) : ['inventory-no-tenant'],
    queryFn: () => {
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.getItem(tenant.id, itemId);
    },
    enabled: !!tenant?.id && !!itemId
  });
}

/**
 * Hook to create an inventory item
 */
export function useCreateInventoryItem() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: InventoryItemFormData) => {
      if (!currentUser) throw new Error('User not authenticated');
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.createItem(tenant.id, data, currentUser.id);
    },
    onSuccess: () => {
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(tenant.id) });
      }
      toast.success('Inventory item created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create inventory item');
    }
  });
}

/**
 * Hook to update an inventory item
 */
export function useUpdateInventoryItem(itemId: string) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<InventoryItemFormData>) => {
      if (!currentUser) throw new Error('User not authenticated');
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.updateItem(tenant.id, itemId, data, currentUser.id);
    },
    onSuccess: () => {
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.item(tenant.id, itemId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(tenant.id) });
      }
      toast.success('Inventory item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update inventory item');
    }
  });
}

/**
 * Hook to record a stock transaction
 */
export function useRecordTransaction() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: StockTransactionFormData) => {
      if (!currentUser) throw new Error('User not authenticated');
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.recordTransaction(tenant.id, data, currentUser.id);
    },
    onSuccess: (_, variables) => {
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.item(tenant.id, variables.itemId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions(tenant.id, variables.itemId) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.items(tenant.id) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts(tenant.id) });
        
        if (variables.lotNumber) {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lots(tenant.id, variables.itemId) });
        }
      }
      
      toast.success('Stock transaction recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record transaction');
    }
  });
}

/**
 * Hook to get stock transactions
 */
export function useStockTransactions(itemId: string, pageSize: number = 50) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id ? [...QUERY_KEYS.transactions(tenant.id, itemId), pageSize] : ['transactions-no-tenant'],
    queryFn: async ({ pageParam }) => {
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.getTransactions(
        tenant.id,
        itemId,
        pageSize,
        pageParam as DocumentSnapshot | undefined
      );
    },
    enabled: !!tenant?.id && !!itemId
  });
}

/**
 * Hook to get active lots for an item
 */
export function useActiveLots(itemId: string) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id ? QUERY_KEYS.lots(tenant.id, itemId) : ['lots-no-tenant'],
    queryFn: () => {
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.getActiveLots(tenant.id, itemId);
    },
    enabled: !!tenant?.id && !!itemId
  });
}

/**
 * Hook to get items needing reorder
 */
export function useReorderItems() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id ? QUERY_KEYS.reorderItems(tenant.id) : ['reorder-no-tenant'],
    queryFn: () => {
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.getReorderItems(tenant.id);
    },
    enabled: !!tenant?.id
  });
}

/**
 * Hook to get expiring items
 */
export function useExpiringItems(daysAhead: number = 30) {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id ? [...QUERY_KEYS.expiringItems(tenant.id), daysAhead] : ['expiring-no-tenant'],
    queryFn: () => {
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.getExpiringItems(tenant.id, daysAhead);
    },
    enabled: !!tenant?.id
  });
}

/**
 * Hook to get active alerts
 */
export function useInventoryAlerts() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id ? QUERY_KEYS.alerts(tenant.id) : ['alerts-no-tenant'],
    queryFn: () => {
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.getActiveAlerts(tenant.id);
    },
    enabled: !!tenant?.id,
    refetchInterval: 60000 // Refresh every minute
  });
}

/**
 * Hook to acknowledge an alert
 */
export function useAcknowledgeAlert() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ alertId, actionTaken }: { alertId: string; actionTaken?: string }) => {
      if (!currentUser) throw new Error('User not authenticated');
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.acknowledgeAlert(tenant.id, alertId, currentUser.id, actionTaken);
    },
    onSuccess: () => {
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.alerts(tenant.id) });
      }
      toast.success('Alert acknowledged');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to acknowledge alert');
    }
  });
}

/**
 * Hook to get inventory value summary
 */
export function useInventoryValue() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: tenant?.id ? QUERY_KEYS.value(tenant.id) : ['value-no-tenant'],
    queryFn: () => {
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.getInventoryValue(tenant.id);
    },
    enabled: !!tenant?.id
  });
}

/**
 * Hook to create a purchase order
 */
export function useCreatePurchaseOrder() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Omit<PurchaseOrder, 'id' | 'tenantId' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
      if (!currentUser) throw new Error('User not authenticated');
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.createPurchaseOrder(tenant.id, data, currentUser.id);
    },
    onSuccess: () => {
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders', tenant.id] });
      }
      toast.success('Purchase order created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create purchase order');
    }
  });
}

/**
 * Hook to update purchase order status
 */
export function useUpdatePurchaseOrderStatus() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: PurchaseOrder['status'] }) => {
      if (!currentUser) throw new Error('User not authenticated');
      if (!tenant?.id) throw new Error('No tenant');
      return inventoryService.updatePurchaseOrderStatus(tenant.id, orderId, status, currentUser.id);
    },
    onSuccess: () => {
      if (tenant?.id) {
        queryClient.invalidateQueries({ queryKey: ['purchaseOrders', tenant.id] });
      }
      toast.success('Purchase order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update purchase order status');
    }
  });
}