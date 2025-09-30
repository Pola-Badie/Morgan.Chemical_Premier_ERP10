import { format } from 'date-fns';

/**
 * Helper function to format materials array for CSV
 */
export const formatMaterials = (materials: any) => {
  if (!materials) return 'None';
  if (!Array.isArray(materials)) return 'None';
  return materials.map(m => `${m.name || 'Unknown'} (${m.quantity || 0})`).join('; ');
};

/**
 * Export orders data to CSV file
 */
export const exportOrdersToCSV = (
  orders: any[],
  orderType: 'production' | 'refining', 
  warehouseFilter: string | null = null
) => {
  if (!orders || orders.length === 0) {
    return { success: false, message: `No ${orderType} orders available to export` };
  }
  
  try {
    // Filter by warehouse if specified
    const filteredOrders = warehouseFilter 
      ? orders.filter(order => 
          (order.location === warehouseFilter || 
           order.warehouseLocation === warehouseFilter))
      : orders;
    
    if (filteredOrders.length === 0) {
      return { 
        success: false, 
        message: `No orders found in ${warehouseFilter}` 
      };
    }

    // Define CSV headers based on order type
    const headers = [
      'Batch Number',
      'Customer',
      'Final Product',
      'Materials',
      'Packaging',
      'Total Cost',
      'Tax Amount',
      'Date Created',
      'Location',
      'Status'
    ];
    
    // Format the data for CSV
    const rows = filteredOrders.map((order) => [
      order.batchNumber || order.orderNumber || 'Unknown',
      order.customerName || (order.customer?.name) || 'Unknown',
      orderType === 'production' 
        ? (order.finalProduct || 'N/A') 
        : (order.expectedOutput || order.finalProduct || 'N/A'),
      formatMaterials(order.materials),
      formatMaterials(order.packaging),
      parseFloat(order.totalCost || 0).toFixed(2),
      parseFloat(order.taxAmount || 0).toFixed(2),
      order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'Unknown',
      order.location || order.warehouseLocation || 'Not specified',
      order.status || 'Pending'
    ]);
    
    // Generate CSV content with proper escaping for quoted values
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(cell => 
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(",")
      )
    ].join("\n");
    
    // Create a download link and trigger the download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Set filename with warehouse filter if specified
    const warehouseLabel = warehouseFilter ? `-${warehouseFilter.replace(/\s+/g, '-')}` : '';
    link.setAttribute(
      'download', 
      `${orderType}-orders${warehouseLabel}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    );
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { 
      success: true, 
      message: `Successfully exported ${filteredOrders.length} ${orderType} orders` 
    };
  } catch (error) {
    console.error(`Error exporting ${orderType} orders:`, error);
    return { 
      success: false, 
      message: `Error exporting ${orderType} orders` 
    };
  }
};