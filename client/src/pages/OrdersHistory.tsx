import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import {
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Factory,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  HistoryIcon,
  Package,
  DollarSign,
  Truck,
  Calculator,
  Users,
  Building,
  ClipboardList,
  BoxIcon,
  FlaskConical,
  Settings,
  Save
} from 'lucide-react';

// Enhanced Order Interface with complete data structure
interface DetailedOrder {
  // Basic Order Info
  id: number;
  orderNumber: string;
  orderType: 'production' | 'refining';
  customerId: number;
  userId: number;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  // Financial Data
  totalMaterialCost: string;
  totalAdditionalFees: string;
  totalCost: string;
  profitMarginPercentage: string;
  
  // Materials Data
  rawMaterials: Array<{
    id: number;
    name: string;
    quantity: string;
    unitPrice: string;
    unitOfMeasure: string;
  }> | null;
  packagingMaterials: Array<{
    id: number;
    name: string;
    quantity: string;
    unitPrice: string;
    unitOfMeasure: string;
  }> | null;
  
  // Production/Refining Specific
  expectedOutputQuantity?: string;
  refiningSteps?: string;
  targetProductId?: number;
  
  // Customer & Date Info
  customerName?: string;
  customerCompany?: string;
  createdAt: string;
  updatedAt: string;
  
  // Calculated Fields
  revenue?: number;
  profit?: number;
  materialsCost?: number;
  packagingCost?: number;
  taxAmount?: number;
  finalTotal?: number;
}

interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  profitMargin: number;
}

const OrdersHistory: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State Management
  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<'production' | 'refining'>('production');
  const [configurableProfitMargin, setConfigurableProfitMargin] = useState<number | ''>('');
  const [isSavingProfitMargin, setIsSavingProfitMargin] = useState(false);

  // Initialize profit margin when dialog opens
  useEffect(() => {
    if (selectedOrder && isDetailsDialogOpen) {
      const orderProfitMargin = parseFloat(selectedOrder.profitMarginPercentage) || '';
      setConfigurableProfitMargin(orderProfitMargin);
    }
  }, [selectedOrder, isDetailsDialogOpen]);

  // Mutation to save profit margin percentage
  const saveProfitMarginMutation = useMutation({
    mutationFn: async ({ orderId, profitMarginPercentage }: { orderId: number, profitMarginPercentage: number }) => {
      const response = await fetch(`/api/orders/${orderId}/profit-margin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profitMarginPercentage })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profit margin');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم حفظ هامش الربح الجديد',
      });
      // Invalidate and refetch the orders data
      queryClient.invalidateQueries({ queryKey: ['/api/orders/detailed-history'] });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في الحفظ',
        description: 'فشل في حفظ هامش الربح',
        variant: 'destructive',
      });
      console.error('Error saving profit margin:', error);
    }
  });

  // Function to save profit margin
  const handleSaveProfitMargin = async () => {
    if (!selectedOrder || configurableProfitMargin === '') {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال هامش ربح صالح',
        variant: 'destructive',
      });
      return;
    }

    const marginValue = typeof configurableProfitMargin === 'number' ? configurableProfitMargin : parseFloat(String(configurableProfitMargin));
    
    if (isNaN(marginValue) || marginValue < 0 || marginValue > 100) {
      toast({
        title: 'خطأ في القيمة',
        description: 'يجب أن يكون هامش الربح بين 0 و 100',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingProfitMargin(true);
    try {
      await saveProfitMarginMutation.mutateAsync({
        orderId: selectedOrder.id,
        profitMarginPercentage: marginValue
      });
    } finally {
      setIsSavingProfitMargin(false);
    }
  };

  // Fetch system preferences for order status configuration
  const { data: statusPreferences } = useQuery({
    queryKey: ['/api/system-preferences/order_status_config'],
    refetchOnWindowFocus: false,
  });

  // Mutation to update order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, orderType, newStatus }: { orderId: number; orderType: string; newStatus: string }) => {
      const endpoint = orderType === 'production' ? '/api/production-orders' : '/api/refining-orders';
      return await apiRequest('PATCH', `${endpoint}/${orderId}`, { status: newStatus });
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Status Updated',
        description: `Order status changed to ${variables.newStatus.replace('_', ' ')}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    }
  });

  // Fetch all orders with complete details
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/orders/detailed-history'],
    queryFn: async () => {
      console.log('🔄 Fetching complete orders with detailed materials and costs...');
      const response = await fetch('/api/orders/detailed-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Complete orders data loaded:', data);
      return data;
    },
  });

  // Calculate comprehensive statistics
  const statistics = useMemo<OrderStatistics>(() => {
    if (!ordersData?.orders) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalCosts: 0,
        totalProfit: 0,
        completedOrders: 0,
        pendingOrders: 0,
        averageOrderValue: 0,
        profitMargin: 0
      };
    }

    const orders = ordersData.orders as DetailedOrder[];
    
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    // Calculate financial totals with tax
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalMaterialsCosts = 0;
    
    orders.forEach(order => {
      const orderCost = parseFloat(order.totalCost) || 0;
      const materialCost = parseFloat(order.totalMaterialCost) || 0;
      const additionalFees = parseFloat(order.totalAdditionalFees) || 0;
      const profitMargin = parseFloat(order.profitMarginPercentage) || 20;
      
      // Calculate revenue based on profit margin
      const revenue = orderCost * (1 + profitMargin / 100);
      
      totalRevenue += revenue;
      totalCosts += orderCost;
      totalMaterialsCosts += materialCost;
    });
    
    const totalProfit = totalRevenue - totalCosts;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalOrders,
      totalRevenue,
      totalCosts,
      totalProfit,
      completedOrders,
      pendingOrders,
      averageOrderValue,
      profitMargin
    };
  }, [ordersData]);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    if (!ordersData?.orders) return [];
    
    let filtered = ordersData.orders as DetailedOrder[];
    
    // Filter by order type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === typeFilter);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.description?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerCompany?.toLowerCase().includes(query)
      );
    }
    
    // Sort by creation date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [ordersData, typeFilter, statusFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Format currency in EGP
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(numAmount || 0);
  };

  // FIXED: Correct cost calculations with proper tax logic
  const calculateOrderCosts = (order: DetailedOrder, marginOverride?: number) => {
    const additionalFees = parseFloat(order.totalAdditionalFees) || 0;
    const profitMargin = marginOverride ?? (parseFloat(order.profitMarginPercentage) || 20);
    
    // FIXED: Robustly calculate material costs from line items
    const sumLineItems = (items: any[]) => {
      if (!items || !Array.isArray(items)) return 0;
      return items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        return sum + (quantity * unitPrice);
      }, 0);
    };
    
    // Get material costs from multiple sources (fallback chain)
    let rawMaterialsCost = 0;
    let packagingCost = 0;
    
    // Try to get from defined materialsCost/packagingCost fields first
    if (Number.isFinite(order.materialsCost)) {
      rawMaterialsCost = order.materialsCost;
    } else {
      // Calculate from rawMaterials line items
      rawMaterialsCost = sumLineItems(order.rawMaterials);
    }
    
    if (Number.isFinite(order.packagingCost)) {
      packagingCost = order.packagingCost;
    } else {
      // Calculate from packagingMaterials line items  
      packagingCost = sumLineItems(order.packagingMaterials);
    }
    
    // Final fallback: if both raw and packaging are 0, try totalMaterialCost
    if (rawMaterialsCost === 0 && packagingCost === 0 && order.totalMaterialCost) {
      rawMaterialsCost = parseFloat(order.totalMaterialCost) || 0;
    }
    
    const subtotal = rawMaterialsCost + packagingCost;
    
    // FIXED: Correct tax calculation
    // Tax base = materials + packaging + transport (total taxable amount)
    const taxBase = subtotal + additionalFees;
    const taxRate = 0.14; // 14%
    const taxAmount = taxBase * taxRate;
    
    // FIXED: Correct total cost calculation
    const totalWithTax = subtotal + additionalFees + taxAmount;
    
    // FIXED: Always calculate revenue from profit margin with validation
    // Profit margin should be percentage of REVENUE, not cost
    // If profit margin is 20%, then profit = 20% of revenue, cost = 80% of revenue
    // Therefore: revenue = cost / (1 - profit_margin_decimal)
    const profitMarginDecimal = Math.max(0, Math.min(95, profitMargin)) / 100; // Clamp 0-95%
    const revenue = profitMarginDecimal >= 0.95 ? totalWithTax * 20 : totalWithTax / (1 - profitMarginDecimal);
    const profit = revenue - totalWithTax;
    
    // Calculate percentage breakdown for UI display
    const preTaxTotal = subtotal + additionalFees;
    const percentages = preTaxTotal > 0 ? {
      rawMaterialsPercent: (rawMaterialsCost / preTaxTotal) * 100,
      packagingPercent: (packagingCost / preTaxTotal) * 100,
      additionalFeesPercent: (additionalFees / preTaxTotal) * 100
    } : {
      rawMaterialsPercent: 0,
      packagingPercent: 0,
      additionalFeesPercent: 0
    };


    return {
      rawMaterialsCost,
      packagingCost,
      subtotal,
      additionalFees,
      taxAmount, // FIXED: Properly calculated tax
      totalWithTax, // FIXED: Proper total cost calculation
      revenue,
      profit,
      profitMargin,
      actualTotalCost: totalWithTax,
      sellingPrice: revenue,
      // Add pre-calculated percentages
      percentages
    };
  };

  // FIXED: Make costs calculation reactive to profit margin changes
  const currentOrderCosts = useMemo(() => {
    if (!selectedOrder) return null;
    const marginValue = configurableProfitMargin === '' ? undefined : configurableProfitMargin;
    return calculateOrderCosts(selectedOrder, marginValue);
  }, [selectedOrder, configurableProfitMargin]);

  // Get status configuration (shared between badge and dropdown)
  const getStatusConfig = () => {
    // Default configuration
    const defaultStatusConfig = {
      pending: { color: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-300', label: 'Pending' },
      'in_progress': { color: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-300', label: 'In Progress' },
      completed: { color: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-300', label: 'Completed' },
      cancelled: { color: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-300', label: 'Cancelled' }
    };
    
    // Use configured settings if available, otherwise use defaults
    let statusConfig = defaultStatusConfig;
    if (statusPreferences && statusPreferences.value && Array.isArray(statusPreferences.value)) {
      const configuredStatuses = statusPreferences.value.reduce((acc: any, statusItem: any) => {
        acc[statusItem.key] = {
          color: statusItem.color,
          textColor: statusItem.textColor,
          borderColor: statusItem.borderColor,
          label: statusItem.label
        };
        return acc;
      }, {});
      statusConfig = { ...defaultStatusConfig, ...configuredStatuses };
    }
    
    return statusConfig;
  };

  // Status badge component with configurable settings (for read-only display)
  const getStatusBadge = (status: string) => {
    const statusConfig = getStatusConfig();
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={`${config.color} ${config.textColor} ${config.borderColor} border px-2 py-1 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  // Editable status dropdown component
  const getEditableStatusDropdown = (order: DetailedOrder) => {
    const statusConfig = getStatusConfig();
    const currentConfig = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
    
    const handleStatusChange = (newStatus: string) => {
      updateOrderStatusMutation.mutate({
        orderId: order.id,
        orderType: order.orderType,
        newStatus
      });
    };
    
    return (
      <Select
        value={order.status}
        onValueChange={handleStatusChange}
        disabled={updateOrderStatusMutation.isPending}
      >
        <SelectTrigger className={`w-[120px] h-7 ${currentConfig.color} ${currentConfig.textColor} ${currentConfig.borderColor} border text-xs font-medium`}>
          <SelectValue>{currentConfig.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(statusConfig).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              <div className={`flex items-center px-2 py-1 rounded text-xs font-medium ${config.color} ${config.textColor}`}>
                {config.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Type badge component
  const getTypeBadge = (type: string) => {
    const typeConfig = {
      production: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Production', icon: Factory },
      refining: { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Refining', icon: FlaskConical }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.production;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} border px-2 py-1 text-xs font-medium flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Handle view details
  const handleViewDetails = async (order: DetailedOrder) => {
    console.log('🔍 Viewing complete order details:', order.orderNumber);
    setSelectedOrder(order);
    setIsDetailsDialogOpen(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Order #', 'Order Type', 'Customer', 'Final Product', 'Status',
      'Materials Cost', 'Additional Fees', 'Total Cost', 'Profit Margin',
      'Revenue', 'Profit', 'Created Date'
    ];
    
    const csvData = filteredOrders.map(order => {
      const costs = calculateOrderCosts(order);
      return [
        order.orderNumber,
        order.orderType === 'production' ? 'Production' : 'Refining',
        order.customerName || '',
        order.description || '',
        order.status === 'pending' ? 'Pending' : 
        order.status === 'completed' ? 'Completed' : 
        order.status === 'in_progress' ? 'In Progress' : 'Cancelled',
        costs.subtotal.toFixed(2),
        costs.additionalFees.toFixed(2),
        costs.totalWithTax.toFixed(2),
        `${costs.profitMargin}%`,
        costs.revenue.toFixed(2),
        costs.profit.toFixed(2),
        new Date(order.createdAt).toLocaleDateString('en-US')
      ];
    });
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Factory className="h-12 w-12 text-[#3BCEAC] mx-auto mb-4 animate-spin" />
          <p className="text-lg text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <Factory className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Data Loading Error</h2>
            <p className="text-gray-600 mb-4">An error occurred while loading order details</p>
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#3BCEAC] rounded-lg">
              <HistoryIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders History</h1>
              <p className="text-gray-600">Comprehensive details for production and refining orders with costs</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Completed: {statistics.completedOrders} | Pending: {statistics.pendingOrders}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Average Order Value: {formatCurrency(statistics.averageOrderValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalCosts)}</div>
                <p className="text-xs text-muted-foreground">Production and materials costs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(statistics.totalProfit)}</div>
                <p className="text-xs text-muted-foreground">
                  Profit Margin: {statistics.profitMargin.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="production">Production Orders</SelectItem>
                  <SelectItem value="refining">Refining Orders</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order History ({filteredOrders.length} orders)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Order #</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Cost</th>
                    <th className="text-left p-4 font-medium">Revenue</th>
                    <th className="text-left p-4 font-medium">Profit</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order: DetailedOrder, index: number) => {
                    const costs = calculateOrderCosts(order);
                    return (
                      <tr key={`${order.orderType}-${order.id}-${index}`} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium text-blue-600">{order.orderNumber}</td>
                        <td className="p-4">{getTypeBadge(order.orderType)}</td>
                        <td className="p-4">
                          <div className="text-left">
                            <div className="font-medium">{order.customerName || 'Not specified'}</div>
                            <div className="text-sm text-gray-500">{order.customerCompany || ''}</div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{order.description || 'Not specified'}</td>
                        <td className="p-4">{getEditableStatusDropdown(order)}</td>
                        <td className="p-4 font-medium text-red-600">{formatCurrency(costs.totalWithTax)}</td>
                        <td className="p-4 font-medium text-green-600">{formatCurrency(costs.revenue)}</td>
                        <td className="p-4 font-medium text-blue-600">{formatCurrency(costs.profit)}</td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complete Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <Factory className="h-6 w-6 text-[#3BCEAC]" />
                  Order Details: {selectedOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  Comprehensive order details with materials, costs and profits
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="materials">Raw Materials</TabsTrigger>
                    <TabsTrigger value="packaging">Packaging</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Order Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Order Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order #:</span>
                            <span className="font-medium">{selectedOrder.orderNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order Type:</span>
                            {getTypeBadge(selectedOrder.orderType)}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            {getStatusBadge(selectedOrder.status)}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Final Product:</span>
                            <span className="font-medium">{selectedOrder.description || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created Date:</span>
                            <span className="font-medium">
                              {new Date(selectedOrder.createdAt).toLocaleDateString('en-US')}
                            </span>
                          </div>
                          {selectedOrder.expectedOutputQuantity && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Expected Quantity:</span>
                              <span className="font-medium">{selectedOrder.expectedOutputQuantity}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Customer Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Customer Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Customer:</span>
                            <span className="font-medium text-blue-900">{selectedOrder.customerName || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Company:</span>
                            <span className="font-medium text-blue-900">{selectedOrder.customerCompany || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Customer ID:</span>
                            <span className="font-medium text-blue-900">{selectedOrder.customerId}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Production/Refining Steps */}
                    {selectedOrder.refiningSteps && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            {selectedOrder.orderType === 'production' ? 'Production' : 'Refining'} Steps
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {JSON.parse(selectedOrder.refiningSteps).map((step: string, index: number) => (
                              <div key={index} className="flex items-start">
                                <span className="text-indigo-600 font-medium mr-2 text-sm">{index + 1}.</span>
                                <span className="text-indigo-800 text-sm">{step}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Raw Materials Tab */}
                  <TabsContent value="materials" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BoxIcon className="h-5 w-5" />
                          Raw Materials Used
                          <Badge className="ml-2">{selectedOrder.rawMaterials?.length || 0} items</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedOrder.rawMaterials && selectedOrder.rawMaterials.length > 0 ? (
                          <div className="space-y-4">
                            {selectedOrder.rawMaterials.map((material, index) => (
                              <div key={index} className="bg-blue-50 p-4 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <span className="text-sm text-gray-600">Material Name:</span>
                                    <p className="font-medium">{material.name}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600">Quantity:</span>
                                    <p className="font-medium">{material.quantity} {material.unitOfMeasure}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600">Unit Price:</span>
                                    <p className="font-medium">{formatCurrency(material.unitPrice)}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600">Total:</span>
                                    <p className="font-bold text-green-600">
                                      {formatCurrency(parseFloat(material.quantity) * parseFloat(material.unitPrice))}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            <div className="bg-blue-100 p-4 rounded-lg border-t-4 border-blue-500">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-blue-800">Total Raw Materials Cost:</span>
                                <span className="text-xl font-bold text-blue-600">
                                  {formatCurrency(
                                    selectedOrder.rawMaterials.reduce((sum, material) => 
                                      sum + (parseFloat(material.quantity) * parseFloat(material.unitPrice)), 0)
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BoxIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No raw materials specified for this order</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Packaging Materials Tab */}
                  <TabsContent value="packaging" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Packaging Materials
                          <Badge className="ml-2">{selectedOrder.packagingMaterials?.length || 0} items</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedOrder.packagingMaterials && selectedOrder.packagingMaterials.length > 0 ? (
                          <div className="space-y-4">
                            {selectedOrder.packagingMaterials.map((material, index) => (
                              <div key={index} className="bg-purple-50 p-4 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div>
                                    <span className="text-sm text-gray-600">Material Name:</span>
                                    <p className="font-medium">{material.name}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600">Quantity:</span>
                                    <p className="font-medium">{material.quantity} {material.unitOfMeasure}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600">Unit Price:</span>
                                    <p className="font-medium">{formatCurrency(material.unitPrice)}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-600">Total:</span>
                                    <p className="font-bold text-green-600">
                                      {formatCurrency(parseFloat(material.quantity) * parseFloat(material.unitPrice))}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            <div className="bg-purple-100 p-4 rounded-lg border-t-4 border-purple-500">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-purple-800">Total Packaging Materials Cost:</span>
                                <span className="text-xl font-bold text-purple-600">
                                  {formatCurrency(
                                    selectedOrder.packagingMaterials.reduce((sum, material) => 
                                      sum + (parseFloat(material.quantity) * parseFloat(material.unitPrice)), 0)
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No packaging materials specified for this order</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Financial Details Tab */}
                  <TabsContent value="financials" className="space-y-4">
                    {(() => {
                      const costs = currentOrderCosts;
                      if (!costs) {
                        return (
                          <div className="text-center py-8">
                            <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Unable to calculate costs for this order</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-6">
                          {/* Cost Breakdown */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                تفصيل التكاليف والأرباح
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Costs Section */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 border-b pb-2">التكاليف</h4>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">تكلفة المواد الخام:</span>
                                    <span className="font-medium">{formatCurrency(costs.rawMaterialsCost)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">تكلفة مواد التعبئة:</span>
                                    <span className="font-medium">{formatCurrency(costs.packagingCost)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">المجموع الفرعي:</span>
                                    <span className="font-medium">{formatCurrency(costs.subtotal)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">الرسوم الإضافية (نقل):</span>
                                    <span className="font-medium text-orange-600">{formatCurrency(costs.additionalFees)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">الضرائب (14%):</span>
                                    <span className="font-medium text-red-600">{formatCurrency(costs.taxAmount)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between border-t pt-2 font-bold">
                                    <span className="text-gray-800">إجمالي التكلفة:</span>
                                    <span className="text-red-600">{formatCurrency(costs.totalWithTax)}</span>
                                  </div>
                                </div>

                                {/* Revenue & Profit Section */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-800 border-b pb-2">الإيرادات والأرباح</h4>
                                  
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">هامش الربح:</span>
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                      <Input
                                        type="number"
                                        max="100"
                                        step="0.1"
                                        value={configurableProfitMargin}
                                        onChange={(e) => {
                                          const inputValue = e.target.value;
                                          if (inputValue === '') {
                                            setConfigurableProfitMargin('');
                                          } else {
                                            const value = Math.max(0, Math.min(100, parseFloat(inputValue) || 0));
                                            setConfigurableProfitMargin(value);
                                          }
                                        }}
                                        className="w-20 h-8 text-right rtl:text-left font-medium text-purple-600 border-purple-200 focus:border-purple-400"
                                        data-testid="input-profit-margin"
                                      />
                                      <span className="text-purple-600 font-medium">%</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSaveProfitMargin}
                                        disabled={isSavingProfitMargin || configurableProfitMargin === '' || saveProfitMarginMutation.isPending}
                                        className="h-8 px-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 disabled:opacity-50"
                                        data-testid="button-save-profit-margin"
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Settings className="h-4 w-4 text-purple-400" />
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">إجمالي الإيرادات:</span>
                                    <span className="font-medium text-green-600">{formatCurrency(costs.revenue)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between border-t pt-2 font-bold">
                                    <span className="text-gray-800">صافي الربح:</span>
                                    <span className="text-green-600 text-xl">{formatCurrency(costs.profit)}</span>
                                  </div>
                                  
                                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <div className="text-sm text-green-800">
                                      <strong>نسبة الربح الفعلية: </strong>
                                      {costs.revenue > 0 ? ((costs.profit / costs.revenue) * 100).toFixed(1) : '0'}%
                                    </div>
                                    <div className="text-xs text-green-600 mt-1 flex items-center">
                                      <Calculator className="h-3 w-3 ml-1" />
                                      يتم تحديث الحسابات تلقائياً عند تغيير هامش الربح
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Visual Cost Breakdown */}
                              <div className="mt-6">
                                <h4 className="font-semibold text-gray-800 mb-3">التوزيع المرئي للتكاليف</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {(() => {
                                    // Use pre-calculated percentages from the costs object
                                    const percentages = costs.percentages;
                                    const taxRate = 14; // Fixed 14% tax rate
                                    
                                    return (
                                      <>
                                        <div className="bg-blue-100 p-3 rounded-lg text-center">
                                          <div className="text-2xl font-bold text-blue-600">{percentages.rawMaterialsPercent.toFixed(0)}%</div>
                                          <div className="text-xs text-blue-800">مواد خام</div>
                                        </div>
                                        <div className="bg-purple-100 p-3 rounded-lg text-center">
                                          <div className="text-2xl font-bold text-purple-600">{percentages.packagingPercent.toFixed(0)}%</div>
                                          <div className="text-xs text-purple-800">تعبئة</div>
                                        </div>
                                        <div className="bg-orange-100 p-3 rounded-lg text-center">
                                          <div className="text-2xl font-bold text-orange-600">{percentages.additionalFeesPercent.toFixed(0)}%</div>
                                          <div className="text-xs text-orange-800">رسوم إضافية</div>
                                        </div>
                                        <div className="bg-green-100 p-3 rounded-lg text-center">
                                          <div className="text-2xl font-bold text-green-600">{taxRate}%</div>
                                          <div className="text-xs text-green-800">معدل الضريبة</div>
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6 flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    // Export this specific order details
                    const costs = currentOrderCosts;
                    if (!costs) {
                      console.error('Unable to export: costs calculation failed');
                      return;
                    }
                    const exportData = {
                      orderInfo: selectedOrder,
                      costs: costs,
                      exportDate: new Date().toLocaleDateString('en-US')
                    };
                    
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                      type: 'application/json;charset=utf-8;'
                    });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `order_${selectedOrder.orderNumber}_details.json`;
                    link.click();
                  }}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>تصدير التفاصيل</span>
                </Button>
                
                <Button
                  onClick={() => setIsDetailsDialogOpen(false)}
                  className="bg-[#3BCEAC] hover:bg-[#2A9A7A] text-white"
                >
                  إغلاق
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersHistory;