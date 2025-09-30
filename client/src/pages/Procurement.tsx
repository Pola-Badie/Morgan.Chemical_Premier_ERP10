import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, MoreHorizontal, Trash2, X, Eye, Upload, FileText, Download, ShoppingBag, Paperclip, Landmark, DollarSign, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Truck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier: string;
  supplierId: number;
  date: string;
  status: 'draft' | 'sent' | 'received' | 'cancelled' | 'pending';
  totalAmount: string; // API returns this as string
  items: PurchaseOrderItem[];
  materials?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  paymentMethod?: string;
  paymentTerms?: string;
  paymentDueDate?: string;
  documents?: Array<{
    id: number;
    name: string;
    type: string;
    uploadDate: string;
    size: string;
  }>;
}

export default function Procurement() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [selectedSupplierType, setSelectedSupplierType] = useState<string>("local");
  const [detailsOrder, setDetailsOrder] = useState<PurchaseOrder | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Fetch purchase orders from unified API for 100% synchronization with accounting
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching purchase orders from unified API for 100% synchronization');
        const response = await fetch('/api/unified/purchase-orders');
        if (response.ok) {
          const data = await response.json();
          console.log('Unified purchase orders API response (with items):', data);
          setPurchaseOrders(data);
        } else {
          console.error('Failed to fetch purchase orders');
        }
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        console.log('Fetching suppliers from API');
        const response = await fetch('/api/suppliers');
        if (response.ok) {
          const data = await response.json();
          console.log('API response for suppliers:', data);
          setSuppliers(data);
        } else {
          console.error('Failed to fetch suppliers');
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchSuppliers();
  }, []);

  // Sample purchase orders data with materials (fallback only)
  const samplePurchaseOrders: PurchaseOrder[] = [
    {
      id: 1,
      poNumber: "PO-2024-001",
      supplier: "MedChem Supplies Ltd",
      supplierId: 1,
      date: "2024-05-20",
      status: 'pending',
      totalAmount: 25420.00,
      items: [
        { id: 1, productId: 1, productName: "Acetaminophen API", quantity: 500, unitPrice: 42.50, total: 21250.00 },
        { id: 2, productId: 2, productName: "Microcrystalline Cellulose", quantity: 200, unitPrice: 18.50, total: 3700.00 },
        { id: 3, productId: 3, productName: "Magnesium Stearate", quantity: 25, unitPrice: 18.80, total: 470.00 }
      ],
      materials: [
        { name: "Acetaminophen API", quantity: 500, unit: "kg" },
        { name: "Microcrystalline Cellulose", quantity: 200, unit: "kg" },
        { name: "Magnesium Stearate", quantity: 25, unit: "kg" }
      ],
      paymentMethod: "Bank Transfer",
      paymentTerms: "Net 30 Days",
      paymentDueDate: "2024-06-20",
      documents: [
        { id: 1, name: "Receipt_PO-2024-001.pdf", type: "Receipt", uploadDate: "2024-05-21", size: "2.4 MB" },
        { id: 2, name: "Delivery_Note_001.pdf", type: "Delivery Note", uploadDate: "2024-05-21", size: "1.2 MB" }
      ]
    },
    {
      id: 2,
      poNumber: "PO-2024-002", 
      supplier: "PharmaCorp International",
      supplierId: 2,
      date: "2024-05-18",
      status: 'received',
      totalAmount: 18950.00,
      items: [
        { id: 4, productId: 4, productName: "Ibuprofen API", quantity: 300, unitPrice: 55.00, total: 16500.00 },
        { id: 5, productId: 5, productName: "Lactose Monohydrate", quantity: 150, unitPrice: 12.50, total: 1875.00 },
        { id: 6, productId: 6, productName: "Croscarmellose Sodium", quantity: 10, unitPrice: 57.50, total: 575.00 }
      ],
      materials: [
        { name: "Ibuprofen API", quantity: 300, unit: "kg" },
        { name: "Lactose Monohydrate", quantity: 150, unit: "kg" },
        { name: "Croscarmellose Sodium", quantity: 10, unit: "kg" }
      ],
      paymentMethod: "Letter of Credit",
      paymentTerms: "Net 45 Days",
      paymentDueDate: "2024-07-05"
    },
    {
      id: 3,
      poNumber: "PO-2024-003",
      supplier: "Global Chemical Solutions",
      supplierId: 3,
      date: "2024-05-15",
      status: 'draft',
      totalAmount: 31200.00,
      items: [],
      materials: [
        { name: "Amoxicillin Trihydrate", quantity: 250, unit: "kg" },
        { name: "Clavulanic Acid", quantity: 50, unit: "kg" },
        { name: "Sodium Starch Glycolate", quantity: 15, unit: "kg" },
        { name: "Colloidal Silicon Dioxide", quantity: 5, unit: "kg" }
      ],
      paymentMethod: "Cash on Delivery",
      paymentTerms: "Immediate Payment"
    },
    {
      id: 4,
      poNumber: "PO-2024-004",
      supplier: "BioActive Materials Inc",
      supplierId: 4,
      date: "2024-05-12",
      status: 'cancelled',
      totalAmount: 8950.00,
      items: [],
      materials: [
        { name: "Aspirin API", quantity: 100, unit: "kg" },
        { name: "Corn Starch", quantity: 75, unit: "kg" }
      ]
    },
    {
      id: 5,
      poNumber: "PO-2024-005",
      supplier: "Precision Pharmaceuticals",
      supplierId: 5,
      date: "2024-05-10",
      status: 'pending',
      totalAmount: 22300.00,
      items: [],
      materials: [
        { name: "Metformin HCl", quantity: 400, unit: "kg" },
        { name: "Hydroxypropyl Methylcellulose", quantity: 50, unit: "kg" },
        { name: "Polyethylene Glycol", quantity: 20, unit: "kg" }
      ]
    },
    {
      id: 6,
      poNumber: "PO-2024-006",
      supplier: "ChemSource Distribution",
      supplierId: 6,
      date: "2024-05-08",
      status: 'sent',
      totalAmount: 14750.00,
      items: [],
      materials: [
        { name: "Calcium Carbonate", quantity: 300, unit: "kg" },
        { name: "Vitamin D3", quantity: 5, unit: "kg" },
        { name: "Talc", quantity: 25, unit: "kg" }
      ]
    }
  ];

  // Handler functions for purchase order actions
  const handleEditPurchaseOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setIsPurchaseOrderFormOpen(true);
    toast({
      title: "Edit Purchase Order",
      description: `Opening ${order.poNumber} for editing`,
    });
  };

  const handleChangePurchaseOrderStatus = (order: PurchaseOrder, newStatus: string) => {
    setPurchaseOrders(prev => 
      prev.map(po => 
        po.id === order.id 
          ? { ...po, status: newStatus as PurchaseOrder['status'] }
          : po
      )
    );
    toast({
      title: "Status Updated", 
      description: `${order.poNumber} marked as ${newStatus}`,
    });
  };

  const handleDeletePurchaseOrder = (order: PurchaseOrder) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== order.id));
    toast({
      title: "Purchase Order Deleted",
      description: `${order.poNumber} has been deleted`,
      variant: "destructive",
    });
  };

  const handleCreatePurchaseOrder = () => {
    setEditingOrder(null);
    setSelectedSupplier('');
    setSelectedSupplierType('local');
    setPurchaseItems([{
      id: Date.now(),
      name: "",
      description: "",
      quantity: 0,
      unit: "kg",
      unitPrice: 0,
      expiryDate: "",
      discountType: "percentage",
      discountValue: 0,
      discountAmount: 0,
      subtotal: 0,
      total: 0
    }]);
    setUploadedDocuments([]);
    setPurchaseVatPercentage(14);
    setTransportationType("standard");
    setTransportationCost(0);
    setTransportationNotes("");
    setIsPurchaseOrderFormOpen(true);
  };

  // Create purchase order function with automatic sync to accounting
  const createPurchaseOrder = async () => {
    if (!selectedSupplier || purchaseItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier and add at least one item",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get form values
      const purchaseDate = (document.getElementById('purchase-date') as HTMLInputElement)?.value;
      const expectedDeliveryDate = (document.getElementById('delivery-date') as HTMLInputElement)?.value;
      const notes = (document.getElementById('purchase-notes') as HTMLTextAreaElement)?.value;

      // Prepare purchase order data
      const purchaseOrderData = {
        supplier: selectedSupplier,
        supplierType: selectedSupplierType,
        items: purchaseItems.map(item => ({
          productName: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
          expiryDate: item.expiryDate
        })),
        totalAmount: calculatePurchaseGrandTotal(),
        orderDate: purchaseDate || new Date().toISOString().split('T')[0],
        expectedDeliveryDate: expectedDeliveryDate || null,
        status: 'pending',
        notes: notes || '',
        vatPercentage: purchaseVatPercentage,
        transportationType: transportationType,
        transportationCost: transportationCost,
        transportationNotes: transportationNotes
      };

      console.log('Creating purchase order:', purchaseOrderData);

      // Create purchase order via API
      const response = await fetch('/api/procurement/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseOrderData)
      });

      if (response.ok) {
        const newOrder = await response.json();
        console.log('Purchase order created successfully:', newOrder);

        // Refresh the purchase orders list to get the latest data
        const refreshResponse = await fetch('/api/unified/purchase-orders');
        if (refreshResponse.ok) {
          const updatedOrders = await refreshResponse.json();
          setPurchaseOrders(updatedOrders);
          console.log('Purchase orders refreshed:', updatedOrders);
        }

        // Trigger global cache invalidation for accounting module synchronization
        if (window.queryClient) {
          window.queryClient.invalidateQueries({ queryKey: ['/api/unified/purchase-orders'] });
          window.queryClient.invalidateQueries({ queryKey: ['/api/accounting/pending-purchases'] });
          console.log('Cache invalidated for accounting module synchronization');
        }

        // Reset form state
        setSelectedSupplier('');
        setSelectedSupplierType('local');
        setPurchaseItems([]);
        setUploadedDocuments([]);
        setPurchaseVatPercentage(14);
        setIsPurchaseOrderFormOpen(false);

        toast({
          title: "Purchase Order Created Successfully",
          description: `Purchase order ${newOrder.poNumber} created and synced with accounting module. Total: ${calculatePurchaseGrandTotal().toFixed(2)} EGP`,
          variant: "default"
        });

      } else {
        const errorData = await response.json();
        console.error('Failed to create purchase order:', errorData);
        toast({
          title: "Creation Failed",
          description: errorData.error || "Failed to create purchase order",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Error",
        description: "An error occurred while creating the purchase order",
        variant: "destructive"
      });
    }
  };

  // Purchase Items State
  const [purchaseItems, setPurchaseItems] = useState([
    {
      id: 1,
      name: "Ibuprofen 500mg",
      description: "Active Pharmaceutical Ingredient",
      quantity: 500,
      unit: "kg",
      unitPrice: 25.50,
      expiryDate: "2026-12-31",
      discountType: "percentage", // "percentage" or "amount"
      discountValue: 5.0,
      discountAmount: 637.50,
      subtotal: 12750.00,
      total: 12112.50
    }
  ]);
  const [purchaseVatPercentage, setPurchaseVatPercentage] = useState(14);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [transportationType, setTransportationType] = useState("standard");
  const [transportationCost, setTransportationCost] = useState(0);
  const [transportationNotes, setTransportationNotes] = useState("");

  // Purchase Item Functions
  const addPurchaseItem = () => {
    const newItem = {
      id: Date.now(),
      name: "",
      description: "",
      quantity: 0,
      unit: "kg",
      unitPrice: 0,
      expiryDate: "",
      discountType: "percentage",
      discountValue: 0,
      discountAmount: 0,
      subtotal: 0,
      total: 0
    };
    setPurchaseItems([...purchaseItems, newItem]);
  };

  const updatePurchaseItem = (id: number, field: string, value: any) => {
    setPurchaseItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Calculate subtotal (quantity * unitPrice)
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        // Calculate discount amount based on type
        if (field === 'discountType' || field === 'discountValue' || field === 'quantity' || field === 'unitPrice') {
          if (updatedItem.discountType === 'percentage') {
            updatedItem.discountAmount = updatedItem.subtotal * (updatedItem.discountValue / 100);
          } else if (updatedItem.discountType === 'amount') {
            updatedItem.discountAmount = updatedItem.discountValue;
          }
        }
        
        // Calculate final total (subtotal - discount)
        updatedItem.total = updatedItem.subtotal - updatedItem.discountAmount;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removePurchaseItem = (id: number) => {
    setPurchaseItems(items => items.filter(item => item.id !== id));
  };

  const calculatePurchaseSubtotal = () => {
    return purchaseItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  const calculatePurchaseVAT = () => {
    return calculatePurchaseSubtotal() * (purchaseVatPercentage / 100);
  };

  const calculatePurchaseGrandTotal = () => {
    return calculatePurchaseSubtotal() + calculatePurchaseVAT() + transportationCost;
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Filter purchase orders based on search term and status
  const filteredPurchaseOrders = purchaseOrders?.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filteredPurchaseOrders?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredPurchaseOrders?.slice(startIndex, endIndex) || [];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'sent':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Sent</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Received</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-700">Cancelled</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchases Management</h1>
          <p className="text-slate-600 mt-1">
            Manage purchase records, suppliers, and inventory-related accounting
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button 
            onClick={() => {
              setEditingOrder(null);
              setSelectedSupplier('');
              setIsPurchaseOrderFormOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Purchase
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by PO number or supplier..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter" className="whitespace-nowrap text-sm font-medium">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Procurement Activity */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Recent Procurement Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {samplePurchaseOrders.slice(0, 3).map((order, index) => (
              <div key={order.id} className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  {getStatusBadge(order.status)}
                  <span className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{order.poNumber}</h4>
                <p className="text-sm text-gray-600 mb-2">{order.supplier}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-blue-600">{parseFloat(order.totalAmount || 0).toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDetailsOrder(order);
                      setIsDetailsDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                {(order as any).materials && (order as any).materials.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-xs text-gray-500">
                      {(order as any).materials.length} item(s): {(order as any).materials[0]?.name}
                      {(order as any).materials.length > 1 && ` +${(order as any).materials.length - 1} more`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {samplePurchaseOrders.length > 3 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  // Scroll to the main table
                  document.querySelector('[data-procurement-table]')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                View All {samplePurchaseOrders.length} Orders
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card data-procurement-table>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Purchase Orders
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/create-invoice')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View Invoices
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/suppliers')}
                className="flex items-center gap-2"
              >
                <Landmark className="h-4 w-4" />
                Manage Suppliers
              </Button>
              <Button
                onClick={() => {
                  setEditingOrder(null);
                  setSelectedSupplier('');
                  setIsPurchaseOrderFormOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Purchase Order
              </Button>
            </div>
          </div>
          
          {/* Latest Procurement Summary */}
          {filteredPurchaseOrders && filteredPurchaseOrders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Latest Order</p>
                    <p className="text-lg font-bold text-blue-900">
                      {filteredPurchaseOrders[0]?.poNumber}
                    </p>
                    <p className="text-xs text-blue-600">
                      {filteredPurchaseOrders[0]?.supplier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-700">Amount</p>
                    <p className="text-lg font-bold text-blue-900">
                      {parseFloat(filteredPurchaseOrders[0]?.totalAmount || '0').toLocaleString()} EGP
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Orders</p>
                    <p className="text-2xl font-bold text-green-900">
                      {filteredPurchaseOrders.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">This Month</p>
                    <p className="text-sm text-green-600">
                      {filteredPurchaseOrders.filter(order => {
                        const orderDate = new Date(order.date);
                        const currentDate = new Date();
                        return orderDate.getMonth() === currentDate.getMonth() && 
                               orderDate.getFullYear() === currentDate.getFullYear();
                      }).length} orders
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Sent Orders</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {filteredPurchaseOrders.filter(order => order.status === 'sent').length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-700">Total Value</p>
                    <p className="text-sm text-orange-600">
                      {filteredPurchaseOrders
                        .filter(order => order.status === 'sent')
                        .reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0)
                        .toLocaleString()} EGP
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Total Value</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {filteredPurchaseOrders
                        .reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0)
                        .toLocaleString()} EGP
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-purple-700">Average</p>
                    <p className="text-sm text-purple-600">
                      {Math.round(filteredPurchaseOrders
                        .reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0) / 
                        Math.max(filteredPurchaseOrders.length, 1)
                      ).toLocaleString()} EGP
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : paginatedOrders && paginatedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ETA No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        ETA{order.id.toString().padStart(8, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.supplier}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {(order as any).materials && (order as any).materials.length > 0 ? (
                            <div className="space-y-1">
                              {(order as any).materials.slice(0, 2).map((material: any, index: number) => (
                                <div key={index} className="text-xs">
                                  {material.name} ({material.quantity} {material.unit})
                                </div>
                              ))}
                              {(order as any).materials.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{(order as any).materials.length - 2} more items
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">No items specified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(order as any).paymentMethod || 'Bank Transfer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {parseFloat(order.totalAmount || '0').toLocaleString()} EGP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingOrder(order);
                              setSelectedSupplier(order.supplier);
                              setIsPurchaseOrderFormOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDetailsOrder(order);
                              setIsDetailsDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Sent to Financial Accounting",
                                description: `Purchase order ${order.poNumber} has been forwarded to the financial accounting department for processing and payment authorization.`,
                                variant: "default"
                              });
                            }}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Send to Financial Accounting"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-4">No purchase orders found</p>
              <p className="text-sm text-slate-400 mb-4">
                Try adjusting your search or create a new purchase order
              </p>
              <Button 
                onClick={() => {
                  setEditingOrder(null);
                  setSelectedSupplier('');
                  setIsPurchaseOrderFormOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Purchase Order
              </Button>
            </div>
          )}

          {/* Enhanced Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="font-medium">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
                    </span>
                  </div>
                  
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Show:</span>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => {
                        const newItemsPerPage = parseInt(e.target.value);
                        setItemsPerPage(newItemsPerPage);
                        setCurrentPage(1); // Reset to first page when changing items per page
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-gray-600">per page</span>
                  </div>
                </div>
                
                {/* Navigation Controls */}
                <div className="flex items-center space-x-1">
                  {/* First Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 hidden sm:flex"
                    title="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-1 flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((pageNum, index) => (
                      <div key={index}>
                        {pageNum === '...' ? (
                          <span className="px-3 py-1 text-gray-500 font-medium">...</span>
                        ) : (
                          <Button
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum as number)}
                            className={`px-3 py-1 min-w-[40px] font-medium transition-all duration-200 ${
                              currentPage === pageNum 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md transform scale-105' 
                                : 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Last Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 hidden sm:flex"
                    title="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Page Info for Mobile */}
              <div className="sm:hidden mt-3 text-center">
                <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional New Purchase Dialog */}
      <Dialog open={isPurchaseOrderFormOpen} onOpenChange={setIsPurchaseOrderFormOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 bg-gradient-to-br from-slate-50 to-blue-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              {editingOrder ? `Edit ${editingOrder.poNumber}` : 'New Purchase Order'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Create a detailed pharmaceutical purchase order with itemized products and pricing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {/* Purchase Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="purchase-supplier">Supplier</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="supplier-type">Supplier Type</Label>
                <Select value={selectedSupplierType} onValueChange={setSelectedSupplierType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase-eta">ETA Number</Label>
                <Input
                  id="purchase-eta"
                  placeholder="Auto-generated ETA number"
                  defaultValue={`ETA${new Date().toISOString().slice(2,10).replace(/-/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`}
                />
              </div>
              <div>
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Select defaultValue="net30">
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net15">Net 15 days</SelectItem>
                    <SelectItem value="net30">Net 30 days</SelectItem>
                    <SelectItem value="net45">Net 45 days</SelectItem>
                    <SelectItem value="cod">Cash on Delivery</SelectItem>
                    <SelectItem value="advance">Advance Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Detailed Product Items Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg font-semibold">Purchase Items</Label>
                <Button 
                  type="button" 
                  onClick={addPurchaseItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                    <div className="col-span-2">Product Name</div>
                    <div className="col-span-2">Description</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-1">Unit Price (EGP)</div>
                    <div className="col-span-1">Expiry Date</div>
                    <div className="col-span-1">Discount</div>
                    <div className="col-span-1">Subtotal (EGP)</div>
                    <div className="col-span-1">Total (EGP)</div>
                    <div className="col-span-1">Action</div>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  {purchaseItems.map((item, index) => (
                    <div key={item.id} className={`px-4 py-3 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updatePurchaseItem(item.id, 'name', e.target.value)}
                            placeholder="Product name"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updatePurchaseItem(item.id, 'description', e.target.value)}
                            placeholder="Product description"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-1 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <Select value={item.unit} onValueChange={(value) => updatePurchaseItem(item.id, 'unit', value)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="mg">mg</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="mL">mL</SelectItem>
                              <SelectItem value="units">units</SelectItem>
                              <SelectItem value="boxes">boxes</SelectItem>
                              <SelectItem value="bottles">bottles</SelectItem>
                              <SelectItem value="vials">vials</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updatePurchaseItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            placeholder="Price"
                            className="w-full px-1 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => updatePurchaseItem(item.id, 'expiryDate', e.target.value)}
                            className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <div className="space-y-1">
                            <div className="flex flex-col gap-1">
                              <Select 
                                value={item.discountType} 
                                onValueChange={(value) => updatePurchaseItem(item.id, 'discountType', value)}
                              >
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">%</SelectItem>
                                  <SelectItem value="amount">EGP</SelectItem>
                                </SelectContent>
                              </Select>
                              <input
                                type="number"
                                value={item.discountValue}
                                onChange={(e) => updatePurchaseItem(item.id, 'discountValue', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                placeholder="0"
                                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-xs font-medium text-right text-gray-600">
                            {(Number(item.subtotal) || 0).toFixed(2)} EGP
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-xs font-medium text-right text-green-600">
                            {(Number(item.total) || 0).toFixed(2)} EGP
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="flex flex-col items-center gap-1">
                            <Button
                              type="button"
                              onClick={() => removePurchaseItem(item.id)}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            {item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                              <div className="text-xs text-orange-500" title="Expires within 30 days">
                                ⚠️
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Purchase Totals Section */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal (before discounts):</span>
                      <span className="font-medium">{purchaseItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0).toFixed(2)} EGP</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Total Discounts:</span>
                      <span className="font-medium">-{purchaseItems.reduce((sum, item) => sum + (Number(item.discountAmount) || 0), 0).toFixed(2)} EGP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Subtotal (after discounts):</span>
                      <span className="font-medium">{calculatePurchaseSubtotal().toFixed(2)} EGP</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span>VAT:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={purchaseVatPercentage}
                            onChange={(e) => setPurchaseVatPercentage(parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs">%</span>
                        </div>
                      </div>
                      <span className="font-medium">{calculatePurchaseVAT().toFixed(2)} EGP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Transportation Cost:</span>
                      <span className="font-medium">{transportationCost.toFixed(2)} EGP</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                      <span>Grand Total:</span>
                      <span className="text-blue-600">{calculatePurchaseGrandTotal().toFixed(2)} EGP</span>
                    </div>
                    
                    {/* Expiry Date Summary */}
                    {purchaseItems.some(item => item.expiryDate) && (
                      <div className="border-t border-gray-300 pt-2 mt-3">
                        <div className="text-xs text-gray-600 mb-1">Expiry Summary:</div>
                        {purchaseItems.filter(item => item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length > 0 && (
                          <div className="text-xs text-orange-600 flex items-center gap-1">
                            ⚠️ {purchaseItems.filter(item => item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length} item(s) expire within 30 days
                          </div>
                        )}
                        {purchaseItems.filter(item => item.expiryDate && new Date(item.expiryDate) < new Date()).length > 0 && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            🚨 {purchaseItems.filter(item => item.expiryDate && new Date(item.expiryDate) < new Date()).length} item(s) already expired
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Purchase Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delivery-date">Expected Delivery Date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                />
              </div>
              <div>
                <Label htmlFor="purchase-status">Purchase Status</Label>
                <Select defaultValue={editingOrder?.status || 'draft'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Transportation Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Truck className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-900">Transportation Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transportation-type">Transportation Type</Label>
                  <Select value={transportationType} onValueChange={setTransportationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transportation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Delivery</SelectItem>
                      <SelectItem value="express">Express Delivery</SelectItem>
                      <SelectItem value="overnight">Overnight Delivery</SelectItem>
                      <SelectItem value="refrigerated">Refrigerated Transport</SelectItem>
                      <SelectItem value="hazmat">Hazardous Material Transport</SelectItem>
                      <SelectItem value="pickup">Supplier Pickup</SelectItem>
                      <SelectItem value="freight">Freight/Cargo</SelectItem>
                      <SelectItem value="courier">Courier Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transportation-cost">Transportation Cost (EGP)</Label>
                  <Input
                    id="transportation-cost"
                    type="number"
                    value={transportationCost}
                    onChange={(e) => setTransportationCost(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="text-right"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="transportation-notes">Transportation Notes</Label>
                <Textarea
                  id="transportation-notes"
                  value={transportationNotes}
                  onChange={(e) => setTransportationNotes(e.target.value)}
                  placeholder="Special handling instructions, delivery location details, contact information..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <Label htmlFor="purchase-notes">Purchase Notes</Label>
              <Textarea
                id="purchase-notes"
                placeholder="Special instructions, delivery requirements, quality specifications..."
                rows={3}
              />
            </div>

            {/* Document Upload Section */}
            <div>
              <Label>Supporting Documents</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="purchase-document-upload"
                />
                <label htmlFor="purchase-document-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, JPG, PNG, TXT, XLS (max 10MB each)
                  </p>
                </label>
              </div>
              
              {/* Uploaded Documents List */}
              {uploadedDocuments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                  <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                    {uploadedDocuments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDocument(index)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ETA Compliance Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">ETA Compliance Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This purchase order includes a valid ETA number for Egyptian Tax Authority compliance. All pharmaceutical purchases must be properly documented.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPurchaseOrderFormOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={createPurchaseOrder}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailsOrder ? `${detailsOrder.poNumber} - Detailed Breakdown` : 'Purchase Order Details'}
            </DialogTitle>
          </DialogHeader>
          {detailsOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                  <p className="font-semibold">{detailsOrder.supplier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="font-semibold">{new Date(detailsOrder.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(detailsOrder.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-green-600">{parseFloat(detailsOrder.totalAmount || 0).toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">{(detailsOrder as any).paymentMethod || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
                  <p className="font-semibold">{(detailsOrder as any).paymentTerms || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transportation Type</p>
                  <p className="font-semibold">{(detailsOrder as any).transportationType || 'Standard Delivery'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transportation Cost</p>
                  <p className="font-semibold text-green-600">{parseFloat((detailsOrder as any).transportationCost || 0).toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</p>
                </div>
                {(detailsOrder as any).paymentDueDate && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Payment Due Date</p>
                    <p className="font-semibold text-red-600 text-lg">
                      {new Date((detailsOrder as any).paymentDueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Transportation Information Section */}
              {((detailsOrder as any).transportationType || (detailsOrder as any).transportationCost || (detailsOrder as any).transportationNotes) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-3">Transportation Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-blue-700">Type</p>
                          <p className="font-semibold text-blue-800">{(detailsOrder as any).transportationType || 'Standard Delivery'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-700">Cost</p>
                          <p className="font-semibold text-blue-800">{parseFloat((detailsOrder as any).transportationCost || 0).toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</p>
                        </div>
                      </div>
                      {(detailsOrder as any).transportationNotes && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-blue-700">Notes</p>
                          <p className="text-sm text-blue-600 mt-1 bg-white p-2 rounded border">{(detailsOrder as any).transportationNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Items Breakdown</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Product</th>
                        <th className="p-3 text-right text-sm font-medium">Quantity</th>
                        <th className="p-3 text-right text-sm font-medium">Unit Price</th>
                        <th className="p-3 text-right text-sm font-medium">Subtotal</th>
                        <th className="p-3 text-right text-sm font-medium">Discount</th>
                        <th className="p-3 text-right text-sm font-medium">Final Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(detailsOrder as any).items?.map((item: any, index: number) => {
                        const quantity = parseFloat(item.quantity || 0);
                        const unitPrice = parseFloat(item.unitPrice || 0);
                        const subtotal = quantity * unitPrice;
                        const finalTotal = parseFloat(item.total || 0);
                        const discount = subtotal - finalTotal;
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium">{item.productName}</div>
                            </td>
                            <td className="p-3 text-right">{quantity}</td>
                            <td className="p-3 text-right">{unitPrice.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                            <td className="p-3 text-right">{subtotal.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                            <td className="p-3 text-right text-red-600">
                              {discount > 0 ? `-${discount.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}` : '-'}
                            </td>
                            <td className="p-3 text-right font-semibold">{finalTotal.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      {(() => {
                        const items = (detailsOrder as any).items || [];
                        const itemsSubtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.total || 0), 0);
                        const totalAmount = parseFloat(detailsOrder.totalAmount || 0);
                        const vatAmount = totalAmount - itemsSubtotal;
                        const vatPercentage = itemsSubtotal > 0 ? ((vatAmount / itemsSubtotal) * 100) : 0;
                        
                        return (
                          <>
                            <tr>
                              <td className="p-3 font-medium" colSpan={5}>Items Subtotal</td>
                              <td className="p-3 text-right font-medium">{itemsSubtotal.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-medium" colSpan={5}>VAT ({vatPercentage.toFixed(1)}%)</td>
                              <td className="p-3 text-right font-medium">{vatAmount.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                            </tr>
                            {((detailsOrder as any).transportationCost && parseFloat((detailsOrder as any).transportationCost) > 0) && (
                              <tr>
                                <td className="p-3 font-medium" colSpan={5}>Transportation Cost</td>
                                <td className="p-3 text-right font-medium">{parseFloat((detailsOrder as any).transportationCost || 0).toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                              </tr>
                            )}
                            <tr className="border-t-2">
                              <td className="p-3 font-bold" colSpan={5}>Grand Total</td>
                              <td className="p-3 text-right font-bold text-green-600">{totalAmount.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Document Upload Section */}
              <div>
                <Label>Supporting Documents</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
                    onChange={handleDocumentUpload}
                    className="hidden"
                    id="details-document-upload"
                  />
                  <label htmlFor="details-document-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, JPG, PNG, TXT, XLS (max 10MB each)
                    </p>
                  </label>
                </div>
                
                {/* Uploaded Documents List */}
                {(uploadedDocuments.length > 0 || ((detailsOrder as any).documents && (detailsOrder as any).documents.length > 0)) && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Documents:</h4>
                    <div className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                      {/* Show existing documents from order */}
                      {(detailsOrder as any).documents && (detailsOrder as any).documents.map((doc: any, index: number) => (
                        <div key={`existing-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                            <span className="text-xs text-gray-500">({doc.size})</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              toast({
                                title: "Download Started",
                                description: `Downloading ${doc.name}`,
                              });
                            }}
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {/* Show newly uploaded documents */}
                      {uploadedDocuments.map((file, index) => (
                        <div key={`new-${index}`} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDocument(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show message when no documents */}
                {uploadedDocuments.length === 0 && !((detailsOrder as any).documents && (detailsOrder as any).documents.length > 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No documents uploaded yet</p>
                    <p className="text-sm">Upload receipts, delivery notes, or invoices</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}