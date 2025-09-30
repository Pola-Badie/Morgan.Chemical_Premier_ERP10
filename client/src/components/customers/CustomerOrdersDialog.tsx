import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CustomerData } from './CustomerCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileText, ChevronDown, Calendar, DollarSign, Package, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CustomerOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData | null;
}

// Sample invoice/order data for the customer
interface OrderData {
  id: number;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  paymentMethod: string;
}

const generateMockOrders = (customerId: number, realProducts: any[] = []): OrderData[] => {
  // Use real products from database if available, otherwise fallback to basic list
  const products = realProducts.length > 0 
    ? realProducts.map(p => p.name).slice(0, 9) // Use up to 9 real product names
    : [
        'Generic Pharmaceutical Product', 'Medical Supplement', 'Healthcare Item',
        'Therapeutic Product', 'Clinical Supply', 'Medical Equipment',
        'Healthcare Solution', 'Pharmaceutical Supply', 'Medical Device'
      ];
  
  const statuses: OrderData['status'][] = ['paid', 'pending', 'overdue', 'draft'];
  const paymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Check'];
  
  return Array.from({ length: 8 }, (_, index) => {
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const items = Array.from({ length: itemCount }, (_, itemIndex) => {
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = Math.floor(Math.random() * 500) + 50;
      return {
        product: products[Math.floor(Math.random() * products.length)],
        quantity,
        unitPrice,
        total: quantity * unitPrice
      };
    });
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.14; // 14% VAT
    const total = subtotal + tax;
    
    const orderDate = new Date(2025, 2 + index, Math.floor(Math.random() * 28) + 1);
    const dueDate = new Date(orderDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days later
    
    return {
      id: 3000 + index,
      invoiceNumber: `INV-${2025}${String(customerId).padStart(2, '0')}${String(index + 1).padStart(3, '0')}`,
      date: orderDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      items,
      subtotal,
      tax,
      total,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
    };
  });
};

const CustomerOrdersDialog: React.FC<CustomerOrdersDialogProps> = ({
  open,
  onOpenChange,
  customer
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  // Fetch real products from database
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
    select: (data: any[]) => data.filter(p => p.productType === 'finished').slice(0, 10)
  });

  if (!customer) return null;

  const orders = generateMockOrders(customer.id, products);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Get status color
  const getStatusColor = (status: OrderData['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Export orders to PDF
  const exportOrdersToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(41, 128, 185);
      doc.text('Customer Orders Report', 20, 20);
      
      // Company info
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Premier ERP System', 150, 20);
      doc.text(new Date().toLocaleDateString(), 150, 30);
      
      // Customer info section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Customer Information', 20, 45);
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 48, 190, 48);
      
      // Customer details
      doc.setFontSize(11);
      let yPos = 55;
      
      const customerDetails = [
        ['Customer:', customer.name],
        ['Company:', customer.company || 'N/A'],
        ['Email:', customer.email],
        ['Phone:', customer.phone || 'N/A'],
        ['Address:', customer.address || 'N/A']
      ];
      
      customerDetails.forEach(([label, value]) => {
        doc.setTextColor(80, 80, 80);
        doc.text(label, 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), 60, yPos);
        yPos += 7;
      });
      
      yPos += 8;
      
      // Orders summary section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Orders Summary', 20, yPos);
      doc.line(20, yPos + 3, 190, yPos + 3);
      yPos += 12;
      
      doc.setFontSize(11);
      const totalOrders = orders.length;
      const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
      const paidOrders = orders.filter(order => order.status === 'paid').length;
      const pendingOrders = orders.filter(order => order.status !== 'paid').length;
      
      const summaryStats = [
        ['Total Orders:', totalOrders.toString()],
        ['Total Value:', `EGP ${totalAmount.toLocaleString()}`],
        ['Paid Orders:', paidOrders.toString()],
        ['Pending Orders:', pendingOrders.toString()]
      ];
      
      summaryStats.forEach(([label, value]) => {
        doc.setTextColor(80, 80, 80);
        doc.text(label, 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(value, 80, yPos);
        yPos += 7;
      });
      
      yPos += 10;
      
      // Orders table using manual table creation
      doc.setFontSize(14);
      doc.text('Order Details', 20, yPos);
      doc.line(20, yPos + 3, 190, yPos + 3);
      yPos += 15;
      
      // Table headers
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(41, 128, 185);
      doc.rect(20, yPos, 170, 7, 'F');
      
      doc.text('Invoice #', 22, yPos + 5);
      doc.text('Date', 50, yPos + 5);
      doc.text('Due Date', 75, yPos + 5);
      doc.text('Amount', 105, yPos + 5);
      doc.text('Status', 135, yPos + 5);
      doc.text('Payment', 160, yPos + 5);
      
      yPos += 7;
      
      // Table rows
      doc.setTextColor(0, 0, 0);
      orders.forEach((order, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(20, yPos, 170, 7, 'F');
        }
        
        doc.text(order.invoiceNumber, 22, yPos + 5);
        doc.text(formatDate(order.date), 50, yPos + 5);
        doc.text(formatDate(order.dueDate), 75, yPos + 5);
        doc.text(`EGP ${order.total.toLocaleString()}`, 105, yPos + 5);
        doc.text(order.status.toUpperCase(), 135, yPos + 5);
        doc.text(order.paymentMethod.substring(0, 8), 160, yPos + 5);
        
        yPos += 7;
      });
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Generated by Premier ERP System', 20, pageHeight - 15);
      doc.text(`Report Date: ${new Date().toLocaleString()}`, 20, pageHeight - 10);
      doc.text('Page 1 of 1', 170, pageHeight - 10);
      
      // Save the PDF
      const fileName = `customer-orders-${customer.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate totals
  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const paidAmount = orders.filter(order => order.status === 'paid').reduce((sum, order) => sum + order.total, 0);
  const pendingAmount = orders.filter(order => order.status !== 'paid').reduce((sum, order) => sum + order.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Customer Orders - {customer.name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={exportOrdersToPDF} className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-blue-800">{orders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Total Value</p>
                <p className="text-2xl font-bold text-green-800">EGP {totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Paid Amount</p>
                <p className="text-2xl font-bold text-green-800">EGP {paidAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-800">EGP {pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">{order.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>{formatDate(order.dueDate)}</TableCell>
                  <TableCell>{order.items.length} items</TableCell>
                  <TableCell className="font-semibold">EGP {order.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Details - {selectedOrder.invoiceNumber}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Order Date</p>
                    <p className="text-lg">{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Due Date</p>
                    <p className="text-lg">{formatDate(selectedOrder.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Method</p>
                    <p className="text-lg">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Order Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>EGP {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>EGP {item.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-end space-y-1 text-right">
                    <div className="space-y-1">
                      <div className="flex justify-between w-48">
                        <span>Subtotal:</span>
                        <span>EGP {selectedOrder.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between w-48">
                        <span>Tax (14%):</span>
                        <span>EGP {selectedOrder.tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between w-48 font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span>EGP {selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerOrdersDialog;