import { useQuery } from '@tanstack/react-query';
import { Notification } from '../contexts/NotificationContext';

interface InventorySummary {
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  expiredCount: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
}

interface ExpiringProduct {
  id: number;
  name: string;
  expiryDate: string;
  currentStock: number;
  daysUntilExpiry: number;
  expiryStatus: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  grandTotal: string;
  paymentStatus: string;
  createdAt: string;
  dueDate?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  total: string;
  status: string;
  createdAt: string;
}

export const useNotificationsData = () => {
  // Fetch inventory data
  const { data: inventorySummary } = useQuery<InventorySummary>({
    queryKey: ['/api/inventory/summary'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: lowStockProducts } = useQuery<LowStockProduct[]>({
    queryKey: ['/api/inventory/low-stock'],
    refetchInterval: 30000,
  });

  const { data: expiringProducts } = useQuery<ExpiringProduct[]>({
    queryKey: ['/api/inventory/expiring'],
    refetchInterval: 30000,
  });

  // Fetch recent invoices
  const { data: recentInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/unified/invoices'],
    select: (data: Invoice[]) => {
      // Get invoices from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      return data?.filter(invoice => 
        new Date(invoice.createdAt) > yesterday
      ).slice(0, 5) || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch overdue payments
  const { data: overdueInvoices } = useQuery<Invoice[]>({
    queryKey: ['/api/unified/invoices'],
    select: (data: Invoice[]) => {
      const today = new Date();
      return data?.filter(invoice => {
        if (invoice.paymentStatus === 'paid' || !invoice.dueDate) return false;
        const dueDate = new Date(invoice.dueDate);
        return dueDate < today && invoice.paymentStatus !== 'paid';
      }).slice(0, 5) || [];
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch recent orders (if we have an orders API)
  const { data: recentOrders } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    select: (data: Order[]) => {
      // Get orders from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      return data?.filter(order => 
        new Date(order.createdAt) > yesterday
      ).slice(0, 3) || [];
    },
    refetchInterval: 60000,
    retry: false, // Don't retry if orders API doesn't exist
  });

  // Generate notifications from real data
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    let notificationId = 1;

    // Low stock notifications
    if (lowStockProducts && lowStockProducts.length > 0) {
      lowStockProducts.forEach(product => {
        notifications.push({
          id: `low-stock-${notificationId++}`,
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (only ${product.currentStock} units remaining)`,
          timestamp: getRelativeTime(new Date()),
          isRead: false,
          category: 'inventory',
          priority: 'high',
          actionUrl: '/inventory'
        });
      });
    }

    // Out of stock notifications
    if (inventorySummary?.outOfStockCount && inventorySummary.outOfStockCount > 0) {
      notifications.push({
        id: `out-of-stock-${notificationId++}`,
        type: 'error',
        title: 'Out of Stock Alert',
        message: `${inventorySummary.outOfStockCount} products are completely out of stock`,
        timestamp: getRelativeTime(new Date()),
        isRead: false,
        category: 'inventory',
        priority: 'high',
        actionUrl: '/inventory'
      });
    }

    // Expiring products notifications
    if (expiringProducts && expiringProducts.length > 0) {
      const urgentlyExpiring = expiringProducts.filter(p => 
        p.daysUntilExpiry <= 30 && p.daysUntilExpiry > 0
      );
      const expired = expiringProducts.filter(p => 
        p.daysUntilExpiry <= 0 || p.expiryStatus === 'expired'
      );

      expired.forEach(product => {
        notifications.push({
          id: `expired-${notificationId++}`,
          type: 'error',
          title: 'Product Expired',
          message: `${product.name} has expired (${Math.abs(product.daysUntilExpiry)} days ago)`,
          timestamp: getRelativeTime(new Date(product.expiryDate)),
          isRead: false,
          category: 'inventory',
          priority: 'high',
          actionUrl: '/inventory'
        });
      });

      urgentlyExpiring.slice(0, 3).forEach(product => {
        notifications.push({
          id: `expiring-${notificationId++}`,
          type: 'warning',
          title: 'Product Expiring Soon',
          message: `${product.name} expires in ${product.daysUntilExpiry} days`,
          timestamp: getRelativeTime(new Date()),
          isRead: false,
          category: 'inventory',
          priority: 'medium',
          actionUrl: '/inventory'
        });
      });
    }

    // Overdue payments notifications
    if (overdueInvoices && overdueInvoices.length > 0) {
      overdueInvoices.slice(0, 3).forEach(invoice => {
        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(invoice.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
        );
        notifications.push({
          id: `overdue-${notificationId++}`,
          type: 'error',
          title: 'Payment Overdue',
          message: `Payment from ${invoice.customerName} is ${daysOverdue} days overdue (EGP ${parseFloat(invoice.grandTotal).toLocaleString()})`,
          timestamp: getRelativeTime(new Date(invoice.dueDate!)),
          isRead: false,
          category: 'financial',
          priority: 'high',
          actionUrl: '/accounting'
        });
      });
    }

    // Recent invoice notifications
    if (recentInvoices && recentInvoices.length > 0) {
      recentInvoices.slice(0, 3).forEach(invoice => {
        notifications.push({
          id: `invoice-${notificationId++}`,
          type: 'success',
          title: 'Invoice Created',
          message: `Invoice ${invoice.invoiceNumber} created for ${invoice.customerName} (EGP ${parseFloat(invoice.grandTotal).toLocaleString()})`,
          timestamp: getRelativeTime(new Date(invoice.createdAt)),
          isRead: false,
          category: 'financial',
          priority: 'medium',
          actionUrl: '/invoice-history'
        });
      });
    }

    // Recent order notifications
    if (recentOrders && recentOrders.length > 0) {
      recentOrders.slice(0, 2).forEach(order => {
        notifications.push({
          id: `order-${notificationId++}`,
          type: 'info',
          title: 'New Order Received',
          message: `Order ${order.orderNumber} received from ${order.customerName} (EGP ${parseFloat(order.total).toLocaleString()})`,
          timestamp: getRelativeTime(new Date(order.createdAt)),
          isRead: false,
          category: 'orders',
          priority: 'medium',
          actionUrl: '/orders'
        });
      });
    }

    // Sort by priority and timestamp
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by timestamp (newer first) - use current time for relative sorting
      return 0; // Since timestamp is relative text, we'll maintain insertion order
    }).slice(0, 20); // Limit to 20 notifications max
  };

  return {
    notifications: generateNotifications(),
    isLoading: false // We'll handle loading states in individual queries
  };
};

// Helper function to format relative time
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
};