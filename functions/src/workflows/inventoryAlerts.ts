import * as admin from 'firebase-admin';
import { notificationService } from '../services/notificationService';

interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  unit: string;
  supplierId?: string;
  lastOrderedAt?: admin.firestore.Timestamp;
  expirationDate?: admin.firestore.Timestamp;
}

interface Supplier {
  id: string;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  autoOrder: boolean;
}

export const inventoryAlerts = async () => {
  console.log('Starting inventory alerts monitor...');
  
  try {
    // Get all tenants
    const tenantsSnapshot = await admin.firestore()
      .collection('tenants')
      .where('isActive', '==', true)
      .get();
    
    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      
      console.log(`Checking inventory for tenant: ${tenantData.name}`);
      
      // Check for low stock items
      await checkLowStock(tenantId);
      
      // Check for expiring items
      await checkExpiringItems(tenantId);
      
      // Check for items needing reorder
      await checkReorderNeeded(tenantId);
    }
    
    console.log('Inventory alerts monitor completed');
    
  } catch (error) {
    console.error('Error in inventory alerts monitor:', error);
    throw error;
  }
};

async function checkLowStock(tenantId: string) {
  const lowStockItems = await admin.firestore()
    .collection(`labflow_${tenantId}_inventory`)
    .where('currentQuantity', '<=', 'reorderPoint')
    .where('alertSent', '==', false)
    .get();
  
  console.log(`Found ${lowStockItems.size} low stock items for tenant ${tenantId}`);
  
  for (const doc of lowStockItems.docs) {
    const item = { id: doc.id, ...doc.data() } as InventoryItem;
    
    // Create alert record
    await admin.firestore()
      .collection(`labflow_${tenantId}_inventory_alerts`)
      .add({
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        currentQuantity: item.currentQuantity,
        reorderPoint: item.reorderPoint,
        alertType: 'low_stock',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Send notification to inventory managers
    await notifyInventoryManagers(tenantId, {
      type: 'low_stock',
      item,
      message: `Low stock alert: ${item.name} (${item.sku}) - Current: ${item.currentQuantity} ${item.unit}, Reorder point: ${item.reorderPoint} ${item.unit}`
    });
    
    // Mark alert as sent
    await doc.ref.update({
      alertSent: true,
      lastAlertAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Auto-create purchase order if configured
    if (item.supplierId) {
      const supplier = await getSupplier(tenantId, item.supplierId);
      if (supplier?.autoOrder) {
        await createAutoPurchaseOrder(tenantId, item, supplier);
      }
    }
  }
}

async function checkExpiringItems(tenantId: string) {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expiringItems = await admin.firestore()
    .collection(`labflow_${tenantId}_inventory`)
    .where('expirationDate', '<=', thirtyDaysFromNow)
    .where('expirationAlertSent', '==', false)
    .get();
  
  console.log(`Found ${expiringItems.size} expiring items for tenant ${tenantId}`);
  
  for (const doc of expiringItems.docs) {
    const item = { id: doc.id, ...doc.data() } as InventoryItem;
    
    if (!item.expirationDate) continue;
    
    const daysUntilExpiry = Math.ceil(
      (item.expirationDate.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    // Create alert record
    await admin.firestore()
      .collection(`labflow_${tenantId}_inventory_alerts`)
      .add({
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        expirationDate: item.expirationDate,
        daysUntilExpiry,
        alertType: 'expiring_soon',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Send notification
    await notifyInventoryManagers(tenantId, {
      type: 'expiring_soon',
      item,
      message: `Expiration alert: ${item.name} (${item.sku}) expires in ${daysUntilExpiry} days`
    });
    
    // Mark alert as sent
    await doc.ref.update({
      expirationAlertSent: true,
      lastExpirationAlertAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function checkReorderNeeded(tenantId: string) {
  // Check items that haven't been ordered in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const reorderNeeded = await admin.firestore()
    .collection(`labflow_${tenantId}_inventory`)
    .where('currentQuantity', '<=', 'reorderPoint')
    .where('lastOrderedAt', '<=', sevenDaysAgo)
    .get();
  
  console.log(`Found ${reorderNeeded.size} items needing reorder for tenant ${tenantId}`);
  
  // Group by supplier for efficient ordering
  const itemsBySupplier = new Map<string, InventoryItem[]>();
  
  for (const doc of reorderNeeded.docs) {
    const item = { id: doc.id, ...doc.data() } as InventoryItem;
    
    if (item.supplierId) {
      const supplierItems = itemsBySupplier.get(item.supplierId) || [];
      supplierItems.push(item);
      itemsBySupplier.set(item.supplierId, supplierItems);
    }
  }
  
  // Create purchase order suggestions
  for (const [supplierId, items] of itemsBySupplier) {
    await admin.firestore()
      .collection(`labflow_${tenantId}_purchase_order_suggestions`)
      .add({
        supplierId,
        items: items.map(item => ({
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          currentQuantity: item.currentQuantity,
          reorderQuantity: item.reorderQuantity,
          unit: item.unit
        })),
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
  }
}

async function getSupplier(tenantId: string, supplierId: string): Promise<Supplier | null> {
  const doc = await admin.firestore()
    .collection(`labflow_${tenantId}_suppliers`)
    .doc(supplierId)
    .get();
  
  return doc.exists ? { id: doc.id, ...doc.data() } as Supplier : null;
}

async function createAutoPurchaseOrder(tenantId: string, item: InventoryItem, supplier: Supplier) {
  const orderNumber = `PO-${Date.now()}`;
  
  await admin.firestore()
    .collection(`labflow_${tenantId}_purchase_orders`)
    .add({
      orderNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: [{
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        quantity: item.reorderQuantity,
        unit: item.unit
      }],
      status: 'draft',
      autoGenerated: true,
      totalAmount: 0, // Would be calculated based on pricing
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system'
    });
  
  // Update item's last ordered timestamp
  await admin.firestore()
    .collection(`labflow_${tenantId}_inventory`)
    .doc(item.id)
    .update({
      lastOrderedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
  console.log(`Auto-created purchase order ${orderNumber} for ${item.name}`);
}

async function notifyInventoryManagers(tenantId: string, notification: any) {
  // Get inventory managers for the tenant
  const managers = await admin.firestore()
    .collection('labflow_users')
    .where('tenantId', '==', tenantId)
    .where('roles', 'array-contains', 'inventory_manager')
    .where('notificationsEnabled', '==', true)
    .get();
  
  const notifications = [];
  
  for (const managerDoc of managers.docs) {
    const manager = managerDoc.data();
    
    // In-app notification
    notifications.push(
      admin.firestore()
        .collection(`labflow_${tenantId}_notifications`)
        .add({
          userId: managerDoc.id,
          type: 'inventory_alert',
          title: `Inventory Alert: ${notification.type.replace('_', ' ')}`,
          message: notification.message,
          data: notification,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
    );
    
    // Email notification
    if (manager.email && manager.emailNotifications) {
      notifications.push(
        notificationService.sendEmail(
          manager.email,
          `Inventory Alert - ${notification.type.replace('_', ' ')}`,
          `
          <h3>Inventory Alert</h3>
          <p>${notification.message}</p>
          <p>Please log in to the LabFlow system to review and take action.</p>
          `
        )
      );
    }
  }
  
  await Promise.all(notifications);
}