import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { usePagination } from '@/contexts/PaginationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash, 
  Trash2,
  Search, 
  Filter, 
  MoreHorizontal, 
  AlertCircle,
  AlertTriangle,
  Calendar,
  Pencil,
  Tag,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Database,
  Package,
  Archive,
  DollarSign,
  Shield,
  Clock,
  FileText,
  ArrowRightLeft,
  Settings,
  X,
  FolderOpen
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductForm from '@/components/inventory/ProductForm';
import { useCSV } from '@/contexts/CSVContext';
import { CSVExport } from '@/components/csv/CSVExport';
import { CSVImport } from '@/components/csv/CSVImport';

interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  drugName: string;
  categoryId: number;
  category: string;
  sku: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  location?: string;
  shelf?: string;
  expiryDate: string;
  status: string;
  productType?: 'raw' | 'semi-raw' | 'finished';
  grade?: string; // Added grade field for P, F, T classification
  createdAt: string;
}

const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('inventory');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Highlight functionality for navigation from dashboard
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  
  // Get URL search parameters for highlighting and warehouse filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight');
    const productName = urlParams.get('product');
    const warehouseParam = urlParams.get('warehouse');
    
    // Handle warehouse parameter - if specified, use it; otherwise default to "All Warehouses" (0)
    if (warehouseParam) {
      setSelectedWarehouse(parseInt(warehouseParam));
      console.log(`🔥 WAREHOUSE FILTER: Setting warehouse to ${warehouseParam}`);
    } else {
      // When navigating from dashboard alerts without warehouse param, show ALL stock
      setSelectedWarehouse(0);
      console.log('🔄 SHOWING ALL WAREHOUSES: Complete stock visibility across all locations');
    }
    
    if (highlightId) {
      const productId = parseInt(highlightId);
      setHighlightedProductId(productId);
      
      // If product name is provided, set it as search term to filter
      if (productName) {
        setSearchTerm(decodeURIComponent(productName));
      }
      
      // Show toast notification
      if (productName) {
        toast({
          title: "Product Located",
          description: `Found ${decodeURIComponent(productName)} in inventory`,
          duration: 3000,
        });
      }
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedProductId(null);
      }, 3000);
      
      // Scroll to the highlighted product after a short delay
      setTimeout(() => {
        const element = document.getElementById(`product-${highlightId}`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 500);
    }
  }, [window.location.search, toast]);
  
  // Fetch warehouses from API
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery<any[]>({
    queryKey: ['/api/warehouses'],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState(0); // Default to "All Warehouses" for complete stock visibility
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [warehouseToEdit, setWarehouseToEdit] = useState<any>(null);
  
  // Categories dialog state
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // State for product management
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string[]>([]);
  
  // State for product history dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null);
  
  // State for warehouse transfer dialog
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferQuantity, setTransferQuantity] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('');
  
  // State for inventory settings dialog
  const [isInventorySettingsOpen, setIsInventorySettingsOpen] = useState(false);
  const [inventorySettings, setInventorySettings] = useState({
    unitsOfMeasure: ['L', 'PCS', 'T', 'KG', 'g', 'mg'],
    productTypes: ['Raw Material', 'Semi-Raw Material', 'Finished Product'],
    statusOptions: ['Active', 'Inactive', 'Discontinued', 'Out of Stock'],
    locationTypes: ['Warehouse', 'Storage Room', 'Cold Storage', 'Quarantine']
  });

  // Update inventory settings with translations once component mounts
  useEffect(() => {
    setInventorySettings({
      unitsOfMeasure: ['L', 'PCS', 'T', 'KG', 'g', 'mg'],
      productTypes: [t('rawMaterial'), t('semiRawMaterial'), t('finishedProduct')],
      statusOptions: [t('active'), t('inactive'), t('discontinued'), t('outOfStock')],
      locationTypes: [t('warehouse'), t('storageRoom'), t('coldStorage'), t('quarantine')]
    });
  }, [t]);
  const [newOption, setNewOption] = useState({ type: '', value: '' });
  
  // CSV Integration
  const { setCSVData, setCSVOptions, clearCSV } = useCSV<Product>();
  
  // Handle CSV import
  const handleImportProducts = async (data: Record<string, string>[], warehouse?: string) => {
    if (!data || data.length === 0) {
      return;
    }
    
    toast({
      title: t('importingProducts'),
      description: `${t('processing')} ${data.length} ${t('products')}...`
    });
    
    console.log('Products to import:', data);
    
    try {
      // Use authenticated API request for secure import
      console.log('Sending JSON import request to:', '/api/bulk/import-json');
      console.log('Data to import:', data.length, 'records');
      
      const result = await apiRequest('POST', '/api/bulk/import-json', {
        type: 'products',
        data: data,
        warehouse: warehouse // Pass the selected warehouse
      });
      
      console.log('Import result:', result);
      
      // Refresh the products list
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: t('importComplete'),
        description: `${t('successfullyImported')} ${result.imported || data.length} ${t('products')}.`
      });
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Error',
        description: 'Failed to import products. Please check the file format and try again.',
        variant: 'destructive'
      });
    }
  };

  // State for category management
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  
  // State for product selection
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  
  // Real activity data for selected product
  const { data: productActivity = [], isLoading: isLoadingActivity } = useQuery({
    queryKey: ['/api/products', selectedProductHistory?.id, 'activity'],
    queryFn: async () => {
      if (!selectedProductHistory?.id) return [];
      
      try {
        const response = await fetch(`${window.location.origin}/api/products/${selectedProductHistory.id}/activity`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`✅ FRONTEND: Fetched ${data.length} real activity entries for product ${selectedProductHistory.name}`);
        return data;
      } catch (error) {
        console.error('Error fetching product activity:', error);
        return [];
      }
    },
    enabled: !!selectedProductHistory?.id,
    refetchOnWindowFocus: false,
  });

  // Fetch products and categories with warehouse filtering
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products', selectedWarehouse],
    queryFn: async () => {
      try {
        // For "All Stock" (selectedWarehouse === 0), don't include warehouse parameter
        // For specific warehouses, include the warehouse parameter
        const warehouseParam = selectedWarehouse === 0 ? '' : `?warehouse=${selectedWarehouse}`;
        const endpoint = `/api/products${warehouseParam}`;
        console.log(`🔥 API ENDPOINT: Fetching from ${endpoint} (${selectedWarehouse === 0 ? 'all stock' : `warehouse ${selectedWarehouse}`})`);
        
        const response = await fetch(`${window.location.origin}${endpoint}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`🔥 FRONTEND: Fetched ${Array.isArray(data) ? data.length : 0} products from ${selectedWarehouse === 0 ? 'all stock' : `warehouse ${selectedWarehouse}`}`);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true, // Refetch when tab gains focus
    refetchOnMount: true, // Always refetch when component mounts
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });
  
  // Set up CSV options when component loads
  useEffect(() => {
    if (products && products.length > 0) {
      setCSVOptions({
        filename: 'inventory-products.csv',
        customHeaders: {
          id: 'ID',
          name: 'Product Name',
          drugName: 'Drug Name',
          category: 'Category',
          sku: 'SKU',
          quantity: 'Quantity',
          unitOfMeasure: 'UoM',
          costPrice: 'Cost Price',
          sellingPrice: 'Selling Price',
          location: 'Location',
          shelf: 'Shelf',
          expiryDate: 'Expiry Date',
          status: 'Status',
          productType: 'Product Type'
        },
        exportButtonText: 'Export Inventory',
        importButtonText: 'Import Products',
        onImport: handleImportProducts,
        showWarehouseDropdown: true,
        warehouseLocations: ['Main Warehouse', 'Temperature-Controlled Storage', 'Finished Products Warehouse', 'Raw Materials Warehouse', 'Medical Supplies Warehouse'],
        onWarehouseFilter: (location: string | null) => {
          if (!location) return products;
          return products.filter(product => product.location === location);
        }
      });
      setCSVData(products);
    }
  }, [products.length]); // Only depend on the length to avoid infinite loops

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: { name: string; description: string }) => {
      return apiRequest('POST', '/api/categories', newCategory);
    },
    onSuccess: () => {
      toast({
        title: "Category Added",
        description: "Category has been added successfully.",
      });
      setCategoryName('');
      setCategoryDescription('');
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add category.",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: { id: number; name: string; description: string | null }) => {
      const response = await apiRequest('PATCH', `/api/categories/${category.id}`, {
        name: category.name,
        description: category.description
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Updated",
        description: "Category has been updated successfully.",
      });
      setEditDialogOpen(false);
      setCategoryToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update category.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to delete category. It may be in use by products.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  // Filter products (warehouse filtering now handled by API)
  const filteredProducts = useMemo(() => {
    console.log('Products received for filtering:', {
      productsLength: products?.length || 0,
      searchTerm,
      statusFilter,
      categoryFilter,
      gradeFilter,
      selectedWarehouse,
      sampleProduct: products?.[0]
    });
    
    if (!products || products.length === 0) {
      console.log('No products available for filtering');
      return [];
    }
    
    const filtered = products.filter(product => {
      const matchesSearch = !searchTerm || (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.drugName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || product.categoryId?.toString() === categoryFilter;
      
      // Grade filtering logic - if no grades selected, show all products
      const matchesGrade = gradeFilter.length === 0 || (
        product.grade && 
        gradeFilter.some(selectedGrade => {
          const productGrades = product.grade.split(',').map(g => g.trim());
          return productGrades.includes(selectedGrade);
        })
      );
      
      // Add shelf numbers if needed (warehouse-specific location is now set by API)
      if (!product.shelf) {
        // Create a shelf number based on the product ID to ensure consistency
        const shelfNumber = product.id % 20 + 1;
        product.shelf = shelfNumber < 10 ? `Shelf 0${shelfNumber}` : `Shelf ${shelfNumber}`;
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesGrade;
    });
    
    console.log(`Filtered ${filtered.length} products from ${products.length} total`);
    return filtered;
  }, [products, searchTerm, statusFilter, categoryFilter, gradeFilter]);

  // Pagination calculations
  const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage);
  const paginatedProducts = filteredProducts?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) || [];
  
  // Update CSV data when filtered products change
  useEffect(() => {
    if (filteredProducts && filteredProducts.length > 0) {
      setCSVData(filteredProducts);
    } else if (products && products.length > 0) {
      setCSVData(products);
    } else {
      clearCSV();
    }
  }, [filteredProducts, products, searchTerm, statusFilter, categoryFilter, gradeFilter]);

  // Handle category form submission
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim() === '') return;

    addCategoryMutation.mutate({
      name: categoryName,
      description: categoryDescription,
    });
  };

  // Category edit handlers
  const openEditDialog = (category: Category) => {
    setCategoryToEdit(category);
    setEditDialogOpen(true);
  };

  const handleUpdateCategory = () => {
    if (categoryToEdit) {
      updateCategoryMutation.mutate(categoryToEdit);
    }
  };

  // Delete category dialog
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  // Helper functions for product display
  const getStatusBadge = (status: string) => {
    // Return fixed styling for NEAR status
    if (status === 'near' || status === 'near-expiry') {
      return (
        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-200 text-orange-800">
          NEAR
        </div>
      );
    }
    
    const statusVariants: Record<string, string> = {
      'active': 'success',
      'in-stock': 'success',
      'low-stock': 'warning',
      'out_of_stock': 'danger',
      'expired': 'danger',
    };
    
    const statusDisplay: Record<string, string> = {
      'active': 'In Stock',
      'in-stock': 'In Stock',
      'low-stock': 'Low Stock',
      'out_of_stock': 'Out of Stock',
      'expired': 'Expired',
    };
    
    return (
      <Badge variant={statusVariants[status] as any || 'default'}>
        {statusDisplay[status] || status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </Badge>
    );
  };

  // Calculate if a product is expired or near expiry
  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'near-expiry', days: daysUntilExpiry };
    }
    return null;
  };
  
  // Inventory settings handlers
  const addNewOption = () => {
    if (!newOption.value.trim()) return;
    
    setInventorySettings(prev => {
      const updated = { ...prev };
      switch (newOption.type) {
        case 'unitOfMeasure':
          if (!updated.unitsOfMeasure.includes(newOption.value)) {
            updated.unitsOfMeasure.push(newOption.value);
          }
          break;
        case 'productType':
          if (!updated.productTypes.includes(newOption.value)) {
            updated.productTypes.push(newOption.value);
          }
          break;
        case 'statusOption':
          if (!updated.statusOptions.includes(newOption.value)) {
            updated.statusOptions.push(newOption.value);
          }
          break;
        case 'locationType':
          if (!updated.locationTypes.includes(newOption.value)) {
            updated.locationTypes.push(newOption.value);
          }
          break;
      }
      return updated;
    });
    
    setNewOption({ type: '', value: '' });
    toast({
      title: 'Option Added',
      description: `${newOption.value} has been added successfully.`
    });
  };

  const removeOption = (type: string, value: string) => {
    setInventorySettings(prev => {
      const updated = { ...prev };
      switch (type) {
        case 'unitOfMeasure':
          updated.unitsOfMeasure = updated.unitsOfMeasure.filter(item => item !== value);
          break;
        case 'productType':
          updated.productTypes = updated.productTypes.filter(item => item !== value);
          break;
        case 'statusOption':
          updated.statusOptions = updated.statusOptions.filter(item => item !== value);
          break;
        case 'locationType':
          updated.locationTypes = updated.locationTypes.filter(item => item !== value);
          break;
      }
      return updated;
    });
    
    toast({
      title: 'Option Removed',
      description: `${value} has been removed successfully.`
    });
  };

  // Product action handlers
  const handleCreateLabel = (product: Product) => {
    // Store the selected product in localStorage so the Label Generator can access it
    localStorage.setItem('selectedProductForLabel', JSON.stringify({
      id: product.id,
      name: product.name,
      drugName: product.drugName,
      sku: product.sku,
      description: product.description,
      category: product.category,
      unitOfMeasure: product.unitOfMeasure
    }));
    
    toast({
      title: "Opening Label Generator",
      description: `Creating label for ${product.name}`,
    });
    
    // Navigate to the Label Generator page
    setLocation('/label');
  };
  
  const handleEditProduct = (product: Product) => {
    // Set the product to edit and open the dialog
    setProductToEdit(product);
    setIsProductFormOpen(true);
    
    toast({
      title: "Edit Product",
      description: `Editing ${product.name}`,
    });
  };
  
  const handleShowHistory = (product: Product) => {
    setSelectedProductHistory(product);
    setIsHistoryDialogOpen(true);
    
    toast({
      title: "Product History",
      description: `Viewing history for ${product.name}`,
    });
  };
  
  const handleDeleteProduct = (product: Product) => {
    // In a real implementation, this would open a confirmation dialog
    toast({
      title: "Delete Product",
      description: `Are you sure you want to delete ${product.name}?`,
      variant: "destructive",
    });
  };

  return (
    <div className={isRTL ? 'rtl' : 'ltr'} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('inventoryManagement')}</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {activeTab === 'inventory' && (
            <>
              {/* Import/Export Buttons */}
              <div className="flex gap-2 mr-2">
                <CSVImport 
                  onImport={handleImportProducts}
                  buttonText={t('importCsv')}
                  variant="outline"
                  size="sm"
                  showWarehouseDialog={true}
                  warehouseLocations={warehouses?.map(w => w.name) || []}
                />
                <CSVExport 
                  data={filteredProducts} 
                  filename="inventory-products.csv"
                  buttonText={t('exportCsv')}
                  variant="outline"
                  size="sm"
                />
                {selectedProducts.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const selectedProductItems = filteredProducts.filter(p => selectedProducts.includes(p.id));
                      toast({
                        title: t('createLabels'),
                        description: `${t('createLabels')} ${selectedProducts.length} selected items`,
                      });
                      // Navigate to label page
                      window.location.href = '/label';
                    }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {t('createLabels')} ({selectedProducts.length})
                  </Button>
                )}
              </div>
            </>
          )}
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCategoriesDialogOpen(true)}
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <FolderOpen className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('categories')}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsInventorySettingsOpen(true)}
              title={t('inventorySettings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={() => {
              setProductToEdit(null);
              setIsProductFormOpen(true);
            }}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('addItem')}
            </Button>
          </div>
        </div>
      </div>
      {/* Warehouse Selector */}
      {activeTab === 'inventory' && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('warehouseSelector')}</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsWarehouseDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addWarehouse')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const warehouse = warehouses.find(w => w.id === selectedWarehouse);
                      setWarehouseToEdit(warehouse);
                      setIsWarehouseDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {t('editWarehouse')}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <Button 
                  variant={selectedWarehouse === 0 ? "default" : "outline"}
                  className={`whitespace-nowrap flex items-center gap-1.5 ${
                    selectedWarehouse === 0 
                      ? "bg-green-600 text-white hover:bg-green-700" 
                      : "bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
                  }`}
                  onClick={() => setSelectedWarehouse(0)}
                >
                  <Database className="h-4 w-4" />
                  {t('allStock')}
                </Button>
                {warehouses.map((warehouse) => (
                  <Button 
                    key={warehouse.id}
                    variant={selectedWarehouse === warehouse.id ? "default" : "outline"}
                    className="whitespace-nowrap"
                    onClick={() => setSelectedWarehouse(warehouse.id)}
                  >
                    {warehouse.name}
                  </Button>
                ))}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsWarehouseDialogOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {selectedWarehouse === 0 ? (
                  <span>{t('viewingInventory')} <span className="font-medium">{t('allWarehouses')}</span></span>
                ) : (
                  <>
                    {t('viewingInventoryFor')} <span className="font-medium">{warehouses.find(w => w.id === selectedWarehouse)?.name}</span> 
                    {" - "}{warehouses.find(w => w.id === selectedWarehouse)?.location}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Inventory Content */}
      <div className="w-full">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={t('searchInventory')}
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  modal={false}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-auto z-50" side="bottom" sideOffset={5} avoidCollisions={true}>
                    <SelectItem value="all">{t('allStatuses')}</SelectItem>
                    <SelectItem value="active">{t('inStock')}</SelectItem>
                    <SelectItem value="out_of_stock">{t('outOfStock')}</SelectItem>
                    <SelectItem value="expired">{t('expired')}</SelectItem>
                    <SelectItem value="near">{t('nearExpiry')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  modal={false}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('filterByCategory')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-auto z-50" side="bottom" sideOffset={5} avoidCollisions={true}>
                    <SelectItem value="all">{t('allCategories')}</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Grade Filter Dropdown */}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`justify-between h-10 ${gradeFilter.length > 0 ? 'text-blue-600 border-blue-200' : ''}`}
                    >
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        {gradeFilter.length === 0 
                          ? 'Filter by Grade'
                          : gradeFilter.length === 1 
                            ? `Grade: ${gradeFilter[0]}`
                            : `${gradeFilter.length} Grades Selected`
                        }
                      </div>
                      {gradeFilter.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-600">
                          {gradeFilter.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 max-h-80 overflow-auto z-50" 
                    side="bottom"
                    sideOffset={5}
                    avoidCollisions={true}
                  >
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Grade Filter</span>
                        {gradeFilter.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setGradeFilter([])}
                            className="h-6 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {[
                          { value: 'P', label: 'Pharmaceutical', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                          { value: 'F', label: 'Food', color: 'bg-green-50 text-green-700 border-green-200' },
                          { value: 'T', label: 'Technical', color: 'bg-orange-50 text-orange-700 border-orange-200' }
                        ].map((grade) => (
                          <div key={grade.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`grade-${grade.value}`}
                              checked={gradeFilter.includes(grade.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setGradeFilter(prev => [...prev, grade.value]);
                                } else {
                                  setGradeFilter(prev => prev.filter(g => g !== grade.value));
                                }
                              }}
                            />
                            <label
                              htmlFor={`grade-${grade.value}`}
                              className="flex items-center cursor-pointer text-sm w-full"
                            >
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium border mr-2 ${grade.color}`}>
                                ({grade.value})
                              </span>
                              {grade.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className={isRTL ? 'rtl' : 'ltr'}>
            <CardContent className="p-0">
              {isLoadingProducts ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 mb-1">{t('noProductsFound')}</h3>
                  <p className="text-slate-500 mb-4">
                    {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || gradeFilter.length > 0
                      ? t('tryAdjustingFilters')
                      : t('addFirstProduct')}
                  </p>
                  {!(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || gradeFilter.length > 0) && (
                    <Button onClick={() => {
                      setProductToEdit(null);
                      setIsProductFormOpen(true);
                    }}>
                      <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('addProduct')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>
                          <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}>
                            <Checkbox 
                              id="select-all" 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts(filteredProducts.map(p => p.id));
                                } else {
                                  setSelectedProducts([]);
                                }
                              }}
                              checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                            />
                            <label htmlFor="select-all" className={`${isRTL ? 'mr-2' : 'ml-2'} cursor-pointer`}>{t('all')}</label>
                          </div>
                        </th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('product')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('category')}</th>
                        <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('batchNo')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('gs1Code')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('type')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>Grade</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('quantity')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('location')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('shelf')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('price')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('expiryDate')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'} font-medium text-slate-500`}>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => {
                        const expiryStatus = getExpiryStatus(product.expiryDate);
                        
                        // Get row className with highlight effect
                        const getRowClassName = () => {
                          const baseClasses = "border-b border-slate-100 hover:bg-slate-50 transition-all duration-300";
                          
                          if (highlightedProductId === product.id) {
                            return `${baseClasses} bg-red-100 border-2 border-red-300 highlight-product shadow-lg`;
                          }
                          
                          // Add subtle background colors based on status
                          if (product.quantity === 0) {
                            return `${baseClasses} bg-red-50 border-l-4 border-red-500`;
                          } else if (product.quantity <= (product.lowStockThreshold || 10)) {
                            return `${baseClasses} bg-orange-50 border-l-4 border-orange-500`;
                          } else if (expiryStatus?.status === 'Expired') {
                            return `${baseClasses} bg-red-50 border-l-4 border-red-400`;
                          } else if (expiryStatus?.status === 'Expiring Soon') {
                            return `${baseClasses} bg-yellow-50 border-l-4 border-yellow-400`;
                          }
                          
                          return baseClasses;
                        };
                        
                        return (
                          <tr 
                            key={product.id} 
                            id={`product-${product.id}`}
                            className={getRowClassName()}
                          >
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              <Checkbox 
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedProducts(prev => [...prev, product.id]);
                                  } else {
                                    setSelectedProducts(prev => prev.filter(id => id !== product.id));
                                  }
                                }}
                              />
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {product.name}
                                  {highlightedProductId === product.id && (
                                    <span className="text-red-600 animate-bounce">📍</span>
                                  )}
                                </div>
                                <div className="text-slate-500 text-xs">{product.drugName}</div>
                              </div>
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.category}
                            </td>
                            <td className={`px-6 py-3 font-mono text-xs whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                              {`BATCH-${product.sku?.slice(-4) || '0000'}-${new Date().getFullYear().toString().slice(-2)}`}
                            </td>
                            <td className={`px-4 py-3 font-mono text-xs text-blue-600 whitespace-nowrap ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.gs1Code || `GS1-${product.sku?.slice(-6) || '000000'}`}
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.productType ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                  product.productType === 'raw' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : product.productType === 'semi-raw'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {product.productType === 'semi-raw' ? t('semiRaw') : product.productType.charAt(0).toUpperCase() + product.productType.slice(1)}
                                </span>
                              ) : '-'}
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.grade ? (
                                <div className="flex flex-wrap gap-1">
                                  {product.grade.split(',').map((grade) => (
                                    <span 
                                      key={grade}
                                      className={`px-1.5 py-0.5 rounded text-xs font-medium border ${
                                        grade.trim() === 'P' 
                                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                                          : grade.trim() === 'F'
                                          ? 'bg-green-50 text-green-700 border-green-200'
                                          : 'bg-orange-50 text-orange-700 border-orange-200'
                                      }`}
                                    >
                                      ({grade.trim()})
                                    </span>
                                  ))}
                                </div>
                              ) : '-'}
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.quantity} {product.unitOfMeasure}</span>
                                {highlightedProductId === product.id && (product.quantity === 0 || product.quantity <= (product.lowStockThreshold || 10)) && (
                                  <span className="text-red-600 text-xs animate-pulse">⚠️</span>
                                )}
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-slate-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                              <div className="flex flex-col">
                                <span className="font-medium text-xs text-blue-600">
                                  {product.location || 'No Location'}
                                </span>
                                {selectedWarehouse !== 0 && (
                                  <span className="text-xs text-slate-500">
                                    {warehouses.find(w => w.id === selectedWarehouse)?.location}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`px-4 py-3 text-slate-600 text-xs ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.shelf || '-'}
                            </td>
                            <td className={`px-4 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                              {formatCurrency(product.sellingPrice)}
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {product.expiryDate ? (
                                <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}>
                                  <span className={expiryStatus?.status === 'expired' ? 'text-red-500' : 
                                                 expiryStatus?.status === 'near-expiry' ? 'text-orange-700' : ''}>
                                    {formatDate(product.expiryDate)}
                                  </span>
                                  {expiryStatus && (
                                    <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-xs ${expiryStatus.status === 'expired' ? 'text-red-500' : 
                                                 expiryStatus.status === 'near-expiry' ? 'text-orange-700' : ''}`}>
                                      {expiryStatus.status === 'expired' ? 
                                        `(Expired ${expiryStatus.days} days ago)` : 
                                        `(Expires in ${expiryStatus.days} days)`}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                                  <DropdownMenuItem onClick={() => handleCreateLabel(product)}>
                                    <Tag className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('createLabel')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleShowHistory(product)}>
                                    <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('showHistory')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                    <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteProduct(product)}
                                  >
                                    <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                    {t('delete')}
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
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className={`flex items-center justify-center mt-6 p-4 bg-white rounded-lg border shadow-sm ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                    >
                      {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      {t('previous')}
                    </Button>
                    
                    <div className="flex items-center gap-1 mx-4">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 p-0 ${
                              pageNum === currentPage 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : "hover:bg-blue-50"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="px-2 text-muted-foreground">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8 p-0 hover:bg-blue-50"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                    >
                      {t('next')}
                      {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    
                    <div className={`text-sm text-muted-foreground ${isRTL ? 'mr-4' : 'ml-4'}`}>
                      {t('page')} {currentPage} {t('of')} {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Categories Management Dialog */}
      <Dialog open={isCategoriesDialogOpen} onOpenChange={setIsCategoriesDialogOpen}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>{t('categories')}</DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              {t('Manage product categories used in inventory and sales')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Categories Table */}
            <div className="border rounded-lg">
              {isLoadingCategories ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : categories?.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 mb-1">{t('No categories found')}</h3>
                  <p className="text-slate-500 mb-4">{t('Add your first category below')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('Name')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-medium text-slate-500`}>{t('Description')}</th>
                        <th className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'} font-medium text-slate-500`}>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories?.map((category: Category) => (
                        <tr key={category.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className={`px-4 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{category.name}</td>
                          <td className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>{category.description || '-'}</td>
                          <td className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
                            <div className={`flex ${isRTL ? 'justify-start space-x-reverse' : 'justify-end'} space-x-2`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => openEditDialog(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openDeleteDialog(category)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add New Category Form */}
            <div className="border-t pt-4">
              <form onSubmit={handleAddCategory}>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <Input
                        placeholder={t('Category Name')}
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        required
                        className={isRTL ? 'text-right' : 'text-left'}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Textarea
                        placeholder={t('Description (optional)')}
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                        className={`h-10 py-2 ${isRTL ? 'text-right' : 'text-left'}`}
                      />
                    </div>
                  </div>
                  <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                    <Button 
                      type="submit" 
                      disabled={addCategoryMutation.isPending || categoryName.trim() === ''}
                    >
                      <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {addCategoryMutation.isPending ? t('Adding...') : t('Add Category')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>{t('Confirm Deletion')}</DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              {t('Are you sure you want to delete the category')} "{categoryToDelete?.name}"? 
              {t('This action cannot be undone')}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={`${isRTL ? 'space-x-reverse' : ''}`}>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteCategoryMutation.isPending}
            >
              {t('Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? t('Deleting...') : t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('editCategory')}</DialogTitle>
            <DialogDescription>
              {t('makeCategoryChanges')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              <div>
                <label htmlFor="edit-category-name" className="text-sm font-medium">
                  Category Name
                </label>
                <Input
                  id="edit-category-name"
                  value={categoryToEdit?.name || ''}
                  onChange={(e) => setCategoryToEdit(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                  className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
              <div>
                <label htmlFor="edit-category-description" className="text-sm font-medium">
                  Description (optional)
                </label>
                <Textarea
                  id="edit-category-description"
                  value={categoryToEdit?.description || ''}
                  onChange={(e) => setCategoryToEdit(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                  className={`mt-1 ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
            </div>
          </div>
          <DialogFooter className={`${isRTL ? 'space-x-reverse' : ''}`}>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updateCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending || !categoryToEdit?.name}
            >
              {updateCategoryMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Product Form Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={(open) => {
        setIsProductFormOpen(open);
        if (!open) setProductToEdit(null);
      }}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {productToEdit ? t('editProductInfo') : t('addNewProduct')}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  {productToEdit 
                    ? t('updateProductDetails') 
                    : t('registerNewProduct')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <ProductForm 
            initialData={productToEdit} 
            onSuccess={() => {
              setIsProductFormOpen(false);
              setProductToEdit(null);
            }} 
          />
        </DialogContent>
      </Dialog>
      {/* Product History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={(open) => {
        setIsHistoryDialogOpen(open);
        if (!open) setSelectedProductHistory(null);
      }}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">{t('productHistory')}</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  {selectedProductHistory ? `${t('comprehensiveHistory')} ${selectedProductHistory.name}` : t('loadingProductDetails')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedProductHistory && (
            <div className="space-y-6">
              {/* Product Information Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className={`text-lg font-semibold text-blue-900 mb-4 flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <Package className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('productInformation')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-blue-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('productName')}</label>
                    <div className={`text-lg font-bold text-blue-900 bg-white p-3 rounded border border-blue-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedProductHistory.name}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-blue-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('skuCode')}</label>
                    <div className={`text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 font-mono ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedProductHistory.sku}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-blue-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('chemicalName')}</label>
                    <div className={`text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedProductHistory.drugName}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-blue-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('status')}</label>
                    <div className={`bg-white p-3 rounded border border-blue-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedProductHistory.status === 'Active' ? 'bg-green-100 text-green-800' :
                        selectedProductHistory.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedProductHistory.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-blue-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('category')}</label>
                    <div className={`text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedProductHistory.category}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-blue-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('manufacturer')}</label>
                    <div className={`text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      Global Pharma Solutions
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory Details Section */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className={`text-lg font-semibold text-green-900 mb-4 flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <Archive className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('inventoryDetails')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('currentQuantity')}</label>
                    <div className={`text-2xl font-bold text-green-900 bg-white p-3 rounded border border-green-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {selectedProductHistory.quantity} {selectedProductHistory.unitOfMeasure}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('warehouseLocation')}</label>
                    <div className={`text-sm text-green-800 bg-white p-3 rounded border border-green-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {warehouses.find(w => w.id === selectedWarehouse)?.name || t('mainWarehouse')}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('reorderLevel')}</label>
                    <div className={`text-sm text-green-800 bg-white p-3 rounded border border-green-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      25 {selectedProductHistory.unitOfMeasure}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('stockValue')}</label>
                    <div className={`text-sm text-green-800 bg-white p-3 rounded border border-green-200 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatCurrency(selectedProductHistory.quantity * selectedProductHistory.costPrice)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('lastStockMovement')}</label>
                    <div className={`text-sm text-green-800 bg-white p-3 rounded border border-green-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      +50 {t('unitsReceived')} {formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('averageMonthlyUsage')}</label>
                    <div className={`text-sm text-green-800 bg-white p-3 rounded border border-green-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      45 {selectedProductHistory.unitOfMeasure}/{t('month')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Information Section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className={`text-lg font-semibold text-purple-900 mb-4 flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <DollarSign className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('pricingInformation')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-purple-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('costPrice')}</label>
                    <div className={`text-lg font-bold text-purple-900 bg-white p-3 rounded border border-purple-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatCurrency(selectedProductHistory.costPrice)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-purple-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('sellingPrice')}</label>
                    <div className={`text-lg font-bold text-purple-900 bg-white p-3 rounded border border-purple-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatCurrency(selectedProductHistory.sellingPrice)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-purple-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('profitMargin')}</label>
                    <div className={`text-sm text-purple-800 bg-white p-3 rounded border border-purple-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {((selectedProductHistory.sellingPrice - selectedProductHistory.costPrice) / selectedProductHistory.costPrice * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-purple-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('profitPerUnit')}</label>
                    <div className={`text-sm font-bold text-purple-800 bg-white p-3 rounded border border-purple-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatCurrency(selectedProductHistory.sellingPrice - selectedProductHistory.costPrice)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-purple-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('lastPriceUpdate')}</label>
                    <div className={`text-sm text-purple-800 bg-white p-3 rounded border border-purple-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString())}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-purple-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('priceTrend')}</label>
                    <div className={`bg-white p-3 rounded border border-purple-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ↗ {t('increasing')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Quality Section */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className={`text-lg font-semibold text-orange-900 mb-4 flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <Shield className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('complianceQuality')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-orange-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('expiryDate')}</label>
                    <div className={`text-sm font-bold bg-white p-3 rounded border border-orange-200 ${isRTL ? 'text-right' : 'text-left'} ${
                      new Date(selectedProductHistory.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
                        ? 'text-red-600' : 'text-orange-800'
                    }`}>
                      {formatDate(selectedProductHistory.expiryDate)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-orange-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('batchNumber')}</label>
                    <div className={`text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 font-mono ${isRTL ? 'text-right' : 'text-left'}`}>
                      BATCH-{selectedProductHistory.id}2025
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-orange-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('qualityStatus')}</label>
                    <div className={`bg-white p-3 rounded border border-orange-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ {t('approved')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-orange-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('lastQualityCheck')}</label>
                    <div className={`text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {formatDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className={`text-sm font-medium text-orange-700 ${isRTL ? 'text-right' : 'text-left'}`}>{t('regulatoryStatus')}</label>
                    <div className={`text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('edaApproved')} #EDA{selectedProductHistory.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline Section - Real Data */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <Clock className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('activityTimeline')}
                </h3>
                
                {isLoadingActivity ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className={`flex items-start border-l-4 border-gray-300 pl-4 pb-4 ${isRTL ? 'border-r-4 border-l-0 pr-4 pl-0' : ''}`}>
                          <div className={`w-12 h-12 rounded-full bg-gray-200 ${isRTL ? 'ml-4' : 'mr-4'}`}></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No recent activity found for this product.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productActivity.map((activity: any, index: number) => {
                      const getActivityIcon = (type: string, icon?: string) => {
                        switch (icon || type) {
                          case 'edit':
                            return <Pencil className="h-6 w-6 text-blue-600" />;
                          case 'package':
                            return <Package className="h-6 w-6 text-green-600" />;
                          case 'shopping-cart':
                            return <ArrowRightLeft className="h-6 w-6 text-red-600" />;
                          case 'truck':
                            return <Package className="h-6 w-6 text-green-600" />;
                          case 'settings':
                            return <Settings className="h-6 w-6 text-orange-600" />;
                          case 'plus':
                            return <Plus className="h-6 w-6 text-purple-600" />;
                          default:
                            return <FileText className="h-6 w-6 text-gray-600" />;
                        }
                      };

                      const getBorderColor = (type: string, icon?: string) => {
                        switch (icon || type) {
                          case 'edit':
                          case 'update':
                            return 'border-blue-500';
                          case 'package':
                          case 'purchase':
                            return 'border-green-500';
                          case 'shopping-cart':
                          case 'sale':
                            return 'border-red-500';
                          case 'truck':
                            return 'border-green-500';
                          case 'settings':
                          case 'adjustment':
                            return 'border-orange-500';
                          case 'plus':
                          case 'create':
                            return 'border-purple-500';
                          default:
                            return 'border-gray-500';
                        }
                      };

                      const getBgColor = (type: string, icon?: string) => {
                        switch (icon || type) {
                          case 'edit':
                          case 'update':
                            return 'bg-blue-100';
                          case 'package':
                          case 'purchase':
                            return 'bg-green-100';
                          case 'shopping-cart':
                          case 'sale':
                            return 'bg-red-100';
                          case 'truck':
                            return 'bg-green-100';
                          case 'settings':
                          case 'adjustment':
                            return 'bg-orange-100';
                          case 'plus':
                          case 'create':
                            return 'bg-purple-100';
                          default:
                            return 'bg-gray-100';
                        }
                      };

                      return (
                        <div key={index} className={`flex items-start border-l-4 ${getBorderColor(activity.type, activity.icon)} pl-4 pb-4 ${isRTL ? 'border-r-4 border-l-0 pr-4 pl-0' : ''}`}>
                          <div className={`w-12 h-12 rounded-full ${getBgColor(activity.type, activity.icon)} flex items-center justify-center flex-shrink-0 ${isRTL ? 'ml-4' : 'mr-4'}`}>
                            {getActivityIcon(activity.type, activity.icon)}
                          </div>
                          <div className="flex-1">
                            <div className={`flex justify-between items-start mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <p className={`font-medium text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                                {activity.title}
                              </p>
                              <span className={`text-xs text-gray-500 ${isRTL ? 'text-left' : 'text-right'}`}>
                                {formatDate(activity.date)}
                              </span>
                            </div>
                            <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {activity.description}
                            </p>
                            {activity.reference && (
                              <p className={`text-xs text-blue-600 mt-1 font-mono ${isRTL ? 'text-right' : 'text-left'}`}>
                                Ref: {activity.reference}
                              </p>
                            )}
                            {activity.notes && (
                              <p className={`text-xs text-gray-500 mt-1 italic ${isRTL ? 'text-right' : 'text-left'}`}>
                                Note: {activity.notes}
                              </p>
                            )}
                            <p className={`text-xs text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                              by {activity.user}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className={`gap-3 pt-6 border-t ${isRTL ? 'space-x-reverse flex-row-reverse' : ''}`}>
            <Button
              variant="outline"
              onClick={() => setIsHistoryDialogOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              {t('close')}
            </Button>
            <Button 
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('exportReport')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsTransferDialogOpen(true)}
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <ArrowRightLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('transferToWarehouse')}
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('editProduct')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Warehouse Dialog */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
        <DialogContent className={`sm:max-w-[500px] ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
              {warehouseToEdit ? t('editWarehouse') : t('addNewWarehouse')}
            </DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              {warehouseToEdit ? t('updateWarehouseDetails') : t('enterWarehouseDetails')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className={`grid grid-cols-4 items-center gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`font-medium ${isRTL ? 'text-left' : 'text-right'}`}>
                {t('name')}
              </div>
              <Input
                id="warehouse-name"
                value={warehouseToEdit ? warehouseToEdit.name : ''}
                placeholder={t('warehouseNamePlaceholder')}
                className={`col-span-3 ${isRTL ? 'text-right' : 'text-left'}`}
                onChange={(e) => {
                  if (warehouseToEdit) {
                    setWarehouseToEdit({...warehouseToEdit, name: e.target.value});
                  } else {
                    setWarehouseToEdit({id: Date.now(), name: e.target.value, location: ''});
                  }
                }}
              />
            </div>
            <div className={`grid grid-cols-4 items-center gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`font-medium ${isRTL ? 'text-left' : 'text-right'}`}>
                {t('location')}
              </div>
              <Input
                id="warehouse-location"
                value={warehouseToEdit ? warehouseToEdit.location : ''}
                placeholder={t('warehouseLocationPlaceholder')}
                className={`col-span-3 ${isRTL ? 'text-right' : 'text-left'}`}
                onChange={(e) => {
                  if (warehouseToEdit) {
                    setWarehouseToEdit({...warehouseToEdit, location: e.target.value});
                  }
                }}
              />
            </div>
          </div>
          
          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button variant="outline" onClick={() => {
              setWarehouseToEdit(null);
              setIsWarehouseDialogOpen(false);
            }}>
              {t('cancel')}
            </Button>
            <Button onClick={async () => {
              if (warehouseToEdit) {
                try {
                  if (warehouseToEdit.id) {
                    // Edit existing warehouse
                    const response = await apiRequest('PUT', `/api/warehouses/${warehouseToEdit.id}`, {
                      name: warehouseToEdit.name,
                      code: warehouseToEdit.code,
                      address: warehouseToEdit.address || warehouseToEdit.location,
                    });
                    
                    if (response.ok) {
                      toast({
                        title: t('warehouseUpdated'),
                        description: t('warehouseUpdatedSuccess')
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
                    }
                  } else {
                    // Add new warehouse
                    const response = await apiRequest('POST', '/api/warehouses', {
                      name: warehouseToEdit.name,
                      address: warehouseToEdit.location || warehouseToEdit.address || ''
                    });
                    
                    if (response.ok) {
                      const newWarehouse = await response.json();
                      setSelectedWarehouse(newWarehouse.id);
                      toast({
                        title: t('warehouseAdded'),
                        description: t('warehouseAddedSuccess')
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/warehouses'] });
                    }
                  }
                } catch (error) {
                  console.error('Error saving warehouse:', error);
                  toast({
                    title: t('error'),
                    description: t('failedToSaveWarehouse') || 'Failed to save warehouse',
                    variant: 'destructive'
                  });
                }
                setWarehouseToEdit(null);
                setIsWarehouseDialogOpen(false);
              }
            }}
            disabled={!warehouseToEdit || !warehouseToEdit.name}
            >
              {warehouseToEdit && warehouseToEdit.id ? t('saveChanges') : t('addWarehouse')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Warehouse Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className={`sm:max-w-[500px] ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
              <ArrowRightLeft className="h-5 w-5 text-green-600" />
              {t('transferProductToWarehouse')}
            </DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              {t('transferStockDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {selectedProductHistory && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className={`font-semibold text-blue-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('productDetails')}
                </h4>
                <div className={`space-y-1 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p><span className="font-medium">{t('product')}:</span> {selectedProductHistory.name}</p>
                  <p><span className="font-medium">{t('currentStock')}:</span> {selectedProductHistory.currentStock} {selectedProductHistory.unitOfMeasure}</p>
                  <p><span className="font-medium">{t('currentWarehouse')}:</span> {warehouses.find(w => w.id === selectedWarehouse)?.name || t('unknown')}</p>
                </div>
              </div>
            )}
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="target-warehouse" className={isRTL ? 'text-right' : 'text-left'}>
                  {t('targetWarehouse')}
                </Label>
                <Select value={targetWarehouse} onValueChange={setTargetWarehouse}>
                  <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                    <SelectValue placeholder={t('selectTargetWarehouse')} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter(w => w.id !== selectedWarehouse)
                      .map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name} - {warehouse.location}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transfer-quantity" className={isRTL ? 'text-right' : 'text-left'}>
                  {t('transferQuantity')}
                </Label>
                <Input
                  id="transfer-quantity"
                  type="number"
                  placeholder={t('enterQuantityToTransfer')}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  max={selectedProductHistory?.currentStock || 0}
                  min="1"
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <p className={`text-xs text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('maximum')}: {selectedProductHistory?.currentStock || 0} {selectedProductHistory?.unitOfMeasure}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transfer-notes" className={isRTL ? 'text-right' : 'text-left'}>
                  {t('transferNotesOptional')}
                </Label>
                <Textarea
                  id="transfer-notes"
                  placeholder={t('addTransferNotes')}
                  rows={3}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsTransferDialogOpen(false);
                setTransferQuantity('');
                setTargetWarehouse('');
              }}
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={() => {
                if (targetWarehouse && transferQuantity && selectedProductHistory) {
                  const targetWarehouseName = warehouses.find(w => w.id.toString() === targetWarehouse)?.name;
                  const currentWarehouseName = warehouses.find(w => w.id === selectedWarehouse)?.name;
                  
                  toast({
                    title: t('transferInitiated'),
                    description: `${t('transferringProduct')} ${transferQuantity} ${selectedProductHistory.unitOfMeasure} ${t('of')} ${selectedProductHistory.name} ${t('from')} ${currentWarehouseName} ${t('to')} ${targetWarehouseName}`
                  });
                  
                  setIsTransferDialogOpen(false);
                  setTransferQuantity('');
                  setTargetWarehouse('');
                }
              }}
              disabled={!targetWarehouse || !transferQuantity || Number(transferQuantity) <= 0 || Number(transferQuantity) > (selectedProductHistory?.currentStock || 0)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowRightLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('confirmTransfer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory Settings Dialog */}
      <Dialog open={isInventorySettingsOpen} onOpenChange={setIsInventorySettingsOpen}>
        <DialogContent className={`sm:max-w-[600px] max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>{t('configureInventoryOptions')}</DialogTitle>
            <DialogDescription className={isRTL ? 'text-right' : 'text-left'}>
              {t('manageDropdownOptions')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Units of Measure */}
            <div>
              <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('unitsOfMeasure')}</h4>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {inventorySettings.unitsOfMeasure.map((unit, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {unit}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeOption('unitOfMeasure', unit)}
                    />
                  </Badge>
                ))}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Input
                  placeholder={t('newUnitPlaceholder')}
                  value={newOption.type === 'unitOfMeasure' ? newOption.value : ''}
                  onChange={(e) => setNewOption({ type: 'unitOfMeasure', value: e.target.value })}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <Button onClick={addNewOption} disabled={newOption.type !== 'unitOfMeasure' || !newOption.value.trim()}>
                  {t('add')}
                </Button>
              </div>
            </div>

            {/* Item Types */}
            <div>
              <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('itemTypes')}</h4>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {inventorySettings.productTypes.map((type, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {type}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeOption('productType', type)}
                    />
                  </Badge>
                ))}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Input
                  placeholder={t('newItemTypePlaceholder')}
                  value={newOption.type === 'productType' ? newOption.value : ''}
                  onChange={(e) => setNewOption({ type: 'productType', value: e.target.value })}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <Button onClick={addNewOption} disabled={newOption.type !== 'productType' || !newOption.value.trim()}>
                  {t('add')}
                </Button>
              </div>
            </div>

            {/* Status Options */}
            <div>
              <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('statusOptions')}</h4>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {inventorySettings.statusOptions.map((status, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {status}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeOption('statusOption', status)}
                    />
                  </Badge>
                ))}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Input
                  placeholder={t('newStatusPlaceholder')}
                  value={newOption.type === 'statusOption' ? newOption.value : ''}
                  onChange={(e) => setNewOption({ type: 'statusOption', value: e.target.value })}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <Button onClick={addNewOption} disabled={newOption.type !== 'statusOption' || !newOption.value.trim()}>
                  {t('add')}
                </Button>
              </div>
            </div>

            {/* Location Types */}
            <div>
              <h4 className={`font-medium mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('locationTypes')}</h4>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {inventorySettings.locationTypes.map((location, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {location}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeOption('locationType', location)}
                    />
                  </Badge>
                ))}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Input
                  placeholder={t('newLocationPlaceholder')}
                  value={newOption.type === 'locationType' ? newOption.value : ''}
                  onChange={(e) => setNewOption({ type: 'locationType', value: e.target.value })}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
                <Button onClick={addNewOption} disabled={newOption.type !== 'locationType' || !newOption.value.trim()}>
                  {t('add')}
                </Button>
              </div>
            </div>

            {/* Categories Management */}
            <div>
              <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h4 className={`font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('categories')}</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCategoriesDialogOpen(true)}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <FolderOpen className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('manageCategories')}
                </Button>
              </div>
              <div className={`flex flex-wrap gap-2 mb-3 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {categories?.slice(0, 5).map((category) => (
                  <Badge key={category.id} variant="secondary" className="flex items-center gap-1">
                    {category.name}
                  </Badge>
                ))}
                {categories && categories.length > 5 && (
                  <Badge variant="outline" className="text-gray-500">
                    +{categories.length - 5} {t('more')}
                  </Badge>
                )}
              </div>
              <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('categoriesDescription')}
              </p>
            </div>
          </div>
          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button type="button" onClick={() => setIsInventorySettingsOpen(false)}>
              {t('done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;