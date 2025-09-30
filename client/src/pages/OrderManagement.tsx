import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Loader2, 
  Save, 
  Eye, 
  FileText, 
  Edit,
  Trash2,
  Plus,
  PlusCircle,
  X,
  Search,
  Download,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

// Utility function to format currency
const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
  }).format(numAmount || 0);
};
import { useQuery } from '@tanstack/react-query';
import CustomerSelector from '@/components/CustomerSelector';

const OrderManagement = () => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'create' | 'refining'>('create');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Separate states for refining customer selection
  const [refiningCustomerSearchTerm, setRefiningCustomerSearchTerm] = useState('');
  const [refiningCustomerPopoverOpen, setRefiningCustomerPopoverOpen] = useState(false);
  const [refiningSelectedCustomer, setRefiningSelectedCustomer] = useState<any>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const [isGeneratingOrders, setIsGeneratingOrders] = useState(false);
  const [hasGeneratedInitialOrders, setHasGeneratedInitialOrders] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Production order states
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [materialToAdd, setMaterialToAdd] = useState<any>(null);
  const [materialQuantity, setMaterialQuantity] = useState<number | ''>('');
  const [materialUnitPrice, setMaterialUnitPrice] = useState<string>('');
  const [finalProductDescription, setFinalProductDescription] = useState('');
  
  // Search states for dropdowns
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [packagingSearchTerm, setPackagingSearchTerm] = useState('');
  const [materialPopoverOpen, setMaterialPopoverOpen] = useState(false);
  const [packagingPopoverOpen, setPackagingPopoverOpen] = useState(false);
  
  // Refining section search states
  const [refiningMaterialSearchTerm, setRefiningMaterialSearchTerm] = useState('');
  const [refiningPackagingSearchTerm, setRefiningPackagingSearchTerm] = useState('');
  const [refiningMaterialPopoverOpen, setRefiningMaterialPopoverOpen] = useState(false);
  const [refiningPackagingPopoverOpen, setRefiningPackagingPopoverOpen] = useState(false);
  const [stockItemSearchTerm, setStockItemSearchTerm] = useState('');
  const [stockItemPopoverOpen, setStockItemPopoverOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<any>(null);
  const [productionOrderSearchTerm, setProductionOrderSearchTerm] = useState('');
  const [productionOrderPopoverOpen, setProductionOrderPopoverOpen] = useState(false);
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<any>(null);

  // Packaging states
  const [packagingItems, setPackagingItems] = useState<any[]>([]);
  const [packagingToAdd, setPackagingToAdd] = useState<any>(null);
  const [packagingQuantity, setPackagingQuantity] = useState<number | ''>('');
  const [packagingUnitPrice, setPackagingUnitPrice] = useState<string>('');
  const [taxPercentage, setTaxPercentage] = useState<number>(14);
  const [subtotalPrice, setSubtotalPrice] = useState<string>('0.00');
  const [totalPrice, setTotalPrice] = useState<string>('0.00');
  const [transportationCost, setTransportationCost] = useState<string>('0.00');
  const [transportationNotes, setTransportationNotes] = useState<string>('');

  // Additional cost states for production orders
  const [laborCost, setLaborCost] = useState<string>('0.00');
  const [equipmentCost, setEquipmentCost] = useState<string>('0.00');
  const [qualityControlCost, setQualityControlCost] = useState<string>('0.00');
  const [storageCost, setStorageCost] = useState<string>('0.00');

  // Refining order states
  const [refiningBatchNumber, setRefiningBatchNumber] = useState('');
  const [sourceType, setSourceType] = useState<string>('production');
  const [sourceProductionOrder, setSourceProductionOrder] = useState<string>('');
  const [sourceStockItem, setSourceStockItem] = useState<string>('');
  const [refiningSteps, setRefiningSteps] = useState<string[]>([]);
  const [newRefiningStep, setNewRefiningStep] = useState<string>('');
  const [expectedOutput, setExpectedOutput] = useState<string>('');
  const [refiningTaxPercentage, setRefiningTaxPercentage] = useState<number>(14);
  const [refiningSubtotal, setRefiningSubtotal] = useState<string>('0.00');
  const [refiningCost, setRefiningCost] = useState<string>('0.00');
  const [refiningTransportationCost, setRefiningTransportationCost] = useState<string>('0.00');
  const [refiningTransportationNotes, setRefiningTransportationNotes] = useState<string>('');

  // Additional cost states for refining orders
  const [refiningLaborCost, setRefiningLaborCost] = useState<string>('0.00');
  const [refiningEquipmentCost, setRefiningEquipmentCost] = useState<string>('0.00');
  const [refiningQualityControlCost, setRefiningQualityControlCost] = useState<string>('0.00');
  const [refiningStorageCost, setRefiningStorageCost] = useState<string>('0.00');
  const [refiningProcessingCost, setRefiningProcessingCost] = useState<string>('0.00');

  // Refining raw materials states
  const [refiningRawMaterials, setRefiningRawMaterials] = useState<any[]>([]);
  const [refiningMaterialToAdd, setRefiningMaterialToAdd] = useState<any>(null);
  const [refiningMaterialQuantity, setRefiningMaterialQuantity] = useState<number | ''>('');
  const [refiningMaterialUnitPrice, setRefiningMaterialUnitPrice] = useState<string>('');

  // Calculate subtotal and total price (with tax) when raw materials, packaging items, tax percentage, or transportation cost change
  useEffect(() => {
    // Calculate materials cost
    const materialsCost = rawMaterials.reduce((sum, material) => {
      const cost = material.quantity * parseFloat(material.unitPrice || '0');
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    // Calculate packaging cost
    const packagingCost = packagingItems.reduce((sum, item) => {
      const cost = item.quantity * parseFloat(item.unitPrice || '0');
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    // Add all additional costs
    const transportCost = parseFloat(transportationCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    const equipment = parseFloat(equipmentCost) || 0;
    const qualityControl = parseFloat(qualityControlCost) || 0;
    const storage = parseFloat(storageCost) || 0;

    // Calculate the total subtotal
    const subtotal = materialsCost + packagingCost + transportCost + labor + equipment + qualityControl + storage;
    

    
    setSubtotalPrice(subtotal.toFixed(2));

    // Calculate total with tax
    const taxAmount = subtotal * (taxPercentage / 100);
    const total = subtotal + taxAmount;
    setTotalPrice(total.toFixed(2));
  }, [rawMaterials, packagingItems, transportationCost, laborCost, equipmentCost, qualityControlCost, storageCost, taxPercentage]);

  // Calculate refining cost with tax and all additional costs
  useEffect(() => {
    // Calculate refining materials cost
    const materialsCost = refiningRawMaterials.reduce((sum, material) => {
      return sum + (material.quantity * parseFloat(material.unitPrice));
    }, 0);

    const baseSubtotal = parseFloat(refiningSubtotal) || 0;
    const transportCost = parseFloat(refiningTransportationCost) || 0;
    const labor = parseFloat(refiningLaborCost) || 0;
    const equipment = parseFloat(refiningEquipmentCost) || 0;
    const qualityControl = parseFloat(refiningQualityControlCost) || 0;
    const storage = parseFloat(refiningStorageCost) || 0;
    const processing = parseFloat(refiningProcessingCost) || 0;

    // Calculate the total subtotal including all costs
    const totalSubtotal = baseSubtotal + materialsCost + transportCost + labor + equipment + qualityControl + storage + processing;

    const taxAmount = totalSubtotal * (refiningTaxPercentage / 100);
    const total = totalSubtotal + taxAmount;
    setRefiningCost(total.toFixed(2));
  }, [refiningSubtotal, refiningTransportationCost, refiningLaborCost, refiningEquipmentCost, refiningQualityControlCost, refiningStorageCost, refiningProcessingCost, refiningTaxPercentage, refiningRawMaterials]);

  // Fetch production orders from dedicated endpoint
  const { data: productionOrders = [], isLoading: isLoadingProductionOrders, refetch: refetchProductionOrders } = useQuery({
    queryKey: ['/api/orders/production-history'],
    queryFn: async () => {
      console.log('🔥 FRONTEND: Fetching production orders from dedicated endpoint');
      const response = await fetch('/api/orders/production-history');
      if (!response.ok) {
        throw new Error('Failed to fetch production orders');
      }
      const data = await response.json();
      console.log(`🔥 FRONTEND: Received ${data.length} production orders from dedicated endpoint`);
      return data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Fetch refining orders from dedicated endpoint
  const { data: refiningOrders = [], isLoading: isLoadingRefiningOrders, refetch: refetchRefiningOrders } = useQuery({
    queryKey: ['/api/orders/refining-history'],
    queryFn: async () => {
      console.log('🔥 FRONTEND: Fetching refining orders from dedicated endpoint');
      const response = await fetch('/api/orders/refining-history');
      if (!response.ok) {
        throw new Error('Failed to fetch refining orders');
      }
      const data = await response.json();
      console.log(`🔥 FRONTEND: Received ${data.length} refining orders from dedicated endpoint`);
      return data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Combined loading state for compatibility
  const isLoadingOrders = isLoadingProductionOrders || isLoadingRefiningOrders;

  // Fetch customers
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/v1/customers'],
    queryFn: async () => {
      const response = await fetch('/api/v1/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return response.json();
    }
  });

  // Fetch raw materials
  const { data: rawMaterialsData, isLoading: isLoadingRawMaterials } = useQuery({
    queryKey: ['/api/products/raw-materials'],
    queryFn: async () => {
      const response = await fetch('/api/products/raw-materials');
      if (!response.ok) {
        throw new Error('Failed to fetch raw materials');
      }
      return response.json();
    }
  });

  // Fetch semi-finished products
  const { data: semiFinishedProducts, isLoading: isLoadingSemiFinished } = useQuery({
    queryKey: ['/api/products/semi-finished'],
    queryFn: async () => {
      const response = await fetch('/api/products/semi-finished');
      if (!response.ok) {
        throw new Error('Failed to fetch semi-finished products');
      }
      return response.json();
    }
  });

  // Fetch all inventory items for stock selection
  const { data: inventoryItems, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items');
      }
      return response.json();
    }
  });

  // Fetch packaging materials - ONLY items with category ID 1 (Packaging)
  const { data: packagingMaterials, isLoading: isLoadingPackaging } = useQuery({
    queryKey: ['/api/products/packaging'],
    queryFn: async () => {
      // Fetch products filtered by packaging category ID
      const response = await fetch('/api/products?categoryId=1');
      if (!response.ok) {
        throw new Error('Failed to fetch packaging materials');
      }
      return await response.json();
    }
  });

  // Generate batch number on component mount
  useEffect(() => {
    generateBatchNumber('production');
  }, []);

  // Auto-generate 5 sample production orders on component mount
  useEffect(() => {
    const generateInitialOrders = async () => {
      if (!hasGeneratedInitialOrders) {
        console.log('Generating 5 sample production orders...');
        try {
          const response = await fetch('/api/orders/generate-sample', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ count: 5 }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Sample orders generated successfully:', data);
            setHasGeneratedInitialOrders(true);
            refetchProductionOrders();
            refetchRefiningOrders();
          } else {
            console.error('Failed to generate sample orders');
          }
        } catch (error) {
          console.error('Error generating sample orders:', error);
        }
      }
    };

    // Small delay to ensure all components are loaded
    const timer = setTimeout(generateInitialOrders, 1000);
    return () => clearTimeout(timer);
  }, [hasGeneratedInitialOrders, refetchProductionOrders, refetchRefiningOrders]);

  // Filter customers based on search term and enrich with order history
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    
    return customers.filter((customer: any) => {
      const term = customerSearchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(term) ||
        customer.company?.toLowerCase().includes(term) ||
        customer.sector?.toLowerCase().includes(term)
      );
    }).map((customer: any) => {
      // Find recent orders for this customer from both production and refining orders
      const allCustomerOrders = [...(productionOrders || []), ...(refiningOrders || [])];
      const customerOrders = allCustomerOrders.filter((order: any) => 
        order.customerName === customer.name || 
        order.customerId === customer.id
      );
      
      // Get the most recent order
      const recentOrder = customerOrders.sort((a: any, b: any) => 
        new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()
      )[0];
      
      return {
        ...customer,
        orderCount: customerOrders.length,
        lastOrderDate: recentOrder?.createdAt || recentOrder?.orderDate,
        lastOrderProduct: recentOrder?.finalProduct || recentOrder?.targetProduct,
        lastOrderValue: recentOrder?.totalCost || recentOrder?.totalAmount
      };
    });
  }, [customers, customerSearchTerm, productionOrders, refiningOrders]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'create' | 'refining');

    // Generate appropriate batch number when switching tabs
    if (value === 'create' && !batchNumber) {
      generateBatchNumber('production');
    } else if (value === 'refining' && !refiningBatchNumber) {
      generateBatchNumber('refining');
    }
  };

  const generateBatchNumber = async (type: string) => {
    try {
      // Get the current date in YYMMDD format
      const today = new Date();
      const dateStr = format(today, 'yyMMdd');

      // Get random numbers to create a unique batch number (3 digits)
      const randomNum = Math.floor(100 + Math.random() * 900);

      // Generate batch numbers with new format
      if (type === 'production') {
        // Format: BATCH-100-YYMMDD
        const batchNumber = `BATCH-${randomNum}-${dateStr}`;
        setBatchNumber(batchNumber);
      } else {
        // Format: REF-100-YYMMDD
        const refBatchNumber = `REF-${randomNum}-${dateStr}`;
        setRefiningBatchNumber(refBatchNumber);
      }
    } catch (error) {
      console.error('Error generating batch number:', error);

      // Fallback to simple format
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      if (type === 'production') {
        setBatchNumber(`BATCH-${randomNum}`);
      } else {
        setRefiningBatchNumber(`REF-${randomNum}`);
      }
    }
  };

  const handleAddMaterial = () => {
    if (materialToAdd && Number(materialQuantity) > 0) {
      const newMaterial = {
        id: materialToAdd.id,
        name: materialToAdd.name,
        quantity: materialQuantity,
        unitOfMeasure: materialToAdd.unitOfMeasure || 'kg',
        unitPrice: materialUnitPrice || '0.00'
      };

      setRawMaterials([...rawMaterials, newMaterial]);
      setMaterialToAdd(null);
      setMaterialQuantity('');
      setMaterialUnitPrice('');
    }
  };

  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = rawMaterials.filter((_, i) => i !== index);
    setRawMaterials(updatedMaterials);
  };

  const handleAddPackaging = () => {
    if (packagingToAdd && Number(packagingQuantity) > 0) {
      const newPackagingItem = {
        id: packagingToAdd.id,
        name: packagingToAdd.name,
        quantity: packagingQuantity,
        unitOfMeasure: packagingToAdd.unitOfMeasure || 'units',
        unitPrice: packagingUnitPrice || '0.00'
      };

      setPackagingItems([...packagingItems, newPackagingItem]);
      setPackagingToAdd(null);
      setPackagingQuantity('');
      setPackagingUnitPrice('');
    }
  };

  const handleRemovePackaging = (index: number) => {
    const updatedPackaging = packagingItems.filter((_, i) => i !== index);
    setPackagingItems(updatedPackaging);
  };

  const handleAddRefiningStep = () => {
    if (newRefiningStep.trim()) {
      setRefiningSteps([...refiningSteps, newRefiningStep.trim()]);
      setNewRefiningStep('');
    }
  };

  const handleRemoveRefiningStep = (index: number) => {
    const updatedSteps = refiningSteps.filter((_, i) => i !== index);
    setRefiningSteps(updatedSteps);
  };

  const handleAddRefiningMaterial = () => {
    if (refiningMaterialToAdd && Number(refiningMaterialQuantity) > 0) {
      const newMaterial = {
        id: refiningMaterialToAdd.id,
        name: refiningMaterialToAdd.name,
        quantity: refiningMaterialQuantity,
        unitOfMeasure: refiningMaterialToAdd.unitOfMeasure || 'kg',
        unitPrice: refiningMaterialUnitPrice
      };

      setRefiningRawMaterials([...refiningRawMaterials, newMaterial]);
      setRefiningMaterialToAdd(null);
      setRefiningMaterialQuantity('');
      setRefiningMaterialUnitPrice('0.00');
    }
  };

  const handleRemoveRefiningMaterial = (index: number) => {
    const updatedMaterials = refiningRawMaterials.filter((_, i) => i !== index);
    setRefiningRawMaterials(updatedMaterials);
  };

  const handleCreateOrder = async () => {
    setIsLoading(true);
    try {
      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }

      const orderData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        batchNumber: batchNumber,
        orderType: 'production',
        finalProduct: finalProductDescription,
        materials: JSON.stringify(rawMaterials),
        packaging: JSON.stringify(packagingItems),
        rawMaterials: JSON.stringify(rawMaterials),
        packagingMaterials: JSON.stringify(packagingItems),
        subtotal: subtotalPrice,
        taxPercentage: taxPercentage,
        taxAmount: (parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2),
        totalCost: totalPrice,
        transportationCost: transportationCost,
        transportationNotes: transportationNotes,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('🔥 CREATING ORDER with data:', orderData);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      console.log('🔥 ORDER RESPONSE:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Order creation failed:', response.status, errorText);
        throw new Error(`Failed to create order: ${response.status} ${errorText}`);
      }

      toast({
        title: "Success",
        description: "Production order created successfully",
      });

      // Reset form
      setSelectedCustomer(null);
      setRawMaterials([]);
      setPackagingItems([]);
      setFinalProductDescription('');
      setTransportationCost('0.00');
      setTransportationNotes('');
      generateBatchNumber('production');

      // Refetch production orders
      refetchProductionOrders();

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRefiningOrder = async () => {
    try {
      if (!refiningSelectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }

      // Calculate comprehensive subtotal including all components using same format as production orders
      const rawMaterialsCost = refiningRawMaterials.reduce((sum, material) => 
        sum + (material.quantity * parseFloat(material.unitPrice || '0')), 0);
      
      const packagingCost = packagingItems.reduce((sum, item) => 
        sum + ((item.quantity || 0) * parseFloat(item.unitPrice || '0')), 0);
      
      const additionalCosts = (parseFloat(refiningLaborCost) || 0) + 
        (parseFloat(refiningEquipmentCost) || 0) + 
        (parseFloat(refiningQualityControlCost) || 0) + 
        (parseFloat(refiningStorageCost) || 0) + 
        (parseFloat(refiningProcessingCost) || 0);

      const comprehensiveSubtotal = rawMaterialsCost + packagingCost + additionalCosts;

      // Calculate tax amount based on subtotal
      const taxAmount = comprehensiveSubtotal * (refiningTaxPercentage / 100);
      const finalTotalCost = comprehensiveSubtotal + taxAmount + (parseFloat(refiningTransportationCost) || 0);

      // Use same data structure as production orders for consistency
      const refiningOrderData = {
        customerId: refiningSelectedCustomer.id,
        customerName: refiningSelectedCustomer.name,
        batchNumber: refiningBatchNumber,
        orderType: 'refining',
        finalProduct: expectedOutput, // Use same field name as production orders
        materials: JSON.stringify(refiningRawMaterials),
        packaging: JSON.stringify(packagingItems),
        rawMaterials: JSON.stringify(refiningRawMaterials),
        packagingMaterials: JSON.stringify(packagingItems),
        subtotal: comprehensiveSubtotal.toFixed(2),
        taxPercentage: refiningTaxPercentage,
        taxAmount: taxAmount.toFixed(2),
        totalCost: finalTotalCost.toFixed(2),
        transportationCost: refiningTransportationCost || '0.00',
        transportationNotes: refiningTransportationNotes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        // Refining-specific fields
        refiningSteps: JSON.stringify(refiningSteps),
        sourceType: sourceType,
        sourceId: sourceType === 'production' ? sourceProductionOrder : sourceStockItem,
        laborCost: refiningLaborCost || '0.00',
        equipmentCost: refiningEquipmentCost || '0.00',
        qualityControlCost: refiningQualityControlCost || '0.00',
        storageCost: refiningStorageCost || '0.00',
        processingCost: refiningProcessingCost || '0.00'
      };

      console.log('🔥 CREATING REFINING ORDER with data:', refiningOrderData);
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refiningOrderData),
      });
      console.log('🔥 REFINING ORDER RESPONSE:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Refining order creation failed:', response.status, errorText);
        throw new Error(`Failed to create refining order: ${response.status} ${errorText}`);
      }

      toast({
        title: "Success",
        description: "Refining order created successfully",
      });

      // Reset form
      setRefiningSelectedCustomer(null);
      setRefiningSteps([]);
      setRefiningRawMaterials([]);
      setPackagingItems([]);
      setExpectedOutput('');
      setRefiningSubtotal('');
      setRefiningLaborCost('');
      setRefiningEquipmentCost('');
      setRefiningQualityControlCost('');
      setRefiningStorageCost('');
      setRefiningProcessingCost('');
      setRefiningTransportationCost('');
      setRefiningTransportationNotes('');
      generateBatchNumber('refining');

      // Refetch refining orders
      refetchRefiningOrders();

    } catch (error) {
      console.error('Error creating refining order:', error);
      toast({
        title: "Error",
        description: "Failed to create refining order",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleGenerateSampleOrders = async () => {
    setIsGeneratingOrders(true);
    try {
      const response = await fetch('/api/orders/generate-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Sample Orders Generated",
          description: "5 sample pharmaceutical orders have been created successfully.",
        });
        refetchProductionOrders();
        refetchRefiningOrders();
      } else {
        throw new Error('Failed to generate sample orders');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sample orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingOrders(false);
    }
  };

  const confirmDeleteOrder = (orderId: number) => {
    setOrderToDelete(orderId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      const response = await fetch(`/api/orders/${orderToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast({
        title: "Success",
        description: "Order deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      refetchProductionOrders();
      refetchRefiningOrders();

    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = (orderId: number) => {
    // Navigate to invoice creation with order data
    toast({
      title: "Info",
      description: "Invoice creation functionality will be implemented",
    });
  };

  const exportProductionOrdersByWarehouse = async (warehouseType: string) => {
    try {
      // Filter orders based on warehouse type
      const filteredOrders = productionOrders;

      if (filteredOrders.length === 0) {
        toast({
          title: "No Data",
          description: `No production orders found`,
          variant: "destructive"
        });
        return;
      }

      // Define CSV headers
      const headers = [
        'Batch Number', 'Customer', 'Final Product', 'Raw Materials', 
        'Packaging', 'Subtotal ($)', 'Tax Amount ($)', 'Date Created', 
        'Location', 'Status'
      ];

      // Map orders to CSV rows
      const rows = filteredOrders.map((order: any) => [
        order.batchNumber || 'Unknown',
        order.customerName || 'Unknown',
        order.finalProduct || 'N/A',
        formatMaterialsForCSV(order.materials),
        formatMaterialsForCSV(order.packaging),
        parseFloat(order.totalCost || 0).toFixed(2),
        parseFloat(order.taxAmount || 0).toFixed(2),
        order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'Unknown',
        order.location || 'Not specified',
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
      link.setAttribute('download', `production-orders-${warehouseType.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredOrders.length} orders from ${warehouseType}`
      });
    } catch (error) {
      console.error('Error exporting production orders by warehouse:', error);
      toast({
        title: "Export Failed",
        description: `Error exporting orders from ${warehouseType}`,
        variant: "destructive"
      });
    }
  };

  const exportRefiningOrdersByWarehouse = async (warehouseType: string) => {
    try {
      // Filter orders based on warehouse type
      const filteredOrders = refiningOrders;

      if (filteredOrders.length === 0) {
        toast({
          title: "No Data",
          description: `No refining orders found`,
          variant: "destructive"
        });
        return;
      }

      // Define CSV headers
      const headers = [
        'Batch Number', 'Customer', 'Source Type', 'Refining Steps', 
        'Expected Output', 'Subtotal ($)', 'Tax Amount ($)', 'Date Created', 
        'Location', 'Status'
      ];

      // Map orders to CSV rows
      const rows = filteredOrders.map((order: any) => [
        order.batchNumber || 'Unknown',
        order.customerName || 'Unknown',
        order.sourceType || 'N/A',
        formatMaterialsForCSV(order.refiningSteps),
        order.expectedOutput || 'N/A',
        parseFloat(order.totalCost || 0).toFixed(2),
        parseFloat(order.taxAmount || 0).toFixed(2),
        order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'Unknown',
        order.location || 'Not specified',
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
      link.setAttribute('download', `refining-orders-${warehouseType.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredOrders.length} orders from ${warehouseType}`
      });
    } catch (error) {
      console.error('Error exporting refining orders by warehouse:', error);
      toast({
        title: "Export Failed",
        description: `Error exporting orders from ${warehouseType}`,
        variant: "destructive"
      });
    }
  };

  // Helper function to format materials array for CSV
  const formatMaterialsForCSV = (materials: any) => {
    if (!materials) return 'None';

    try {
      // If materials is a string, parse it as JSON
      const materialsList = typeof materials === 'string' 
        ? JSON.parse(materials) 
        : materials;

      if (!Array.isArray(materialsList)) return 'None';

      return materialsList.map(m => 
        `${m.name || 'Unknown'} (${m.quantity || 0} ${m.unitOfMeasure || ''})`
      ).join('; ');
    } catch (error) {
      console.error('Error formatting materials for CSV:', error);
      return 'Error parsing materials';
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">{t('orderManagement')}</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">{t('productionOrders')}</TabsTrigger>
          <TabsTrigger value="refining">{t('refiningOrders')}</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Creation Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{t('createProductionOrder')}</h2>

                  {/* Customer Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label>{t('customer')}</Label>
                      <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={customerPopoverOpen}
                            className="w-full justify-between"
                          >
                            {selectedCustomer ? selectedCustomer.name : t('selectCustomer')}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder={t('searchCustomers')} 
                              value={customerSearchTerm}
                              onValueChange={setCustomerSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>{t('noCustomerFound')}</CommandEmpty>
                              <CommandGroup>
                                {filteredCustomers.map((customer: any) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={customer.name}
                                    onSelect={() => {
                                      setSelectedCustomer(customer);
                                      setCustomerPopoverOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{customer.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {customer.company} • {customer.sector}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {selectedCustomer && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="font-medium">{selectedCustomer.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.sector}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t('batchNumber')}</Label>
                        <Input 
                          value={batchNumber} 
                          onChange={(e) => setBatchNumber(e.target.value)}
                          placeholder={t('autoGenerated')}
                        />
                      </div>
                      <div>
                        <Label>{t('finalProduct')}</Label>
                        <Input 
                          value={finalProductDescription}
                          onChange={(e) => setFinalProductDescription(e.target.value)}
                          placeholder={t('describeFinalProduct')}
                        />
                      </div>
                    </div>

                    {/* Raw Materials Section */}
                    <div>
                      <Label className="text-base font-semibold">{t('rawMaterials')}</Label>

                      {/* Add Material Form */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <Popover open={materialPopoverOpen} onOpenChange={setMaterialPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={materialPopoverOpen}
                              className="justify-between"
                            >
                              {materialToAdd ? materialToAdd.name : t('selectMaterial')}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <Command>
                              <CommandInput 
                                placeholder={`${t('searchMaterials')}...`} 
                                value={materialSearchTerm}
                                onValueChange={setMaterialSearchTerm}
                              />
                              <CommandList>
                                <CommandEmpty>{t('noMaterialsFound')}</CommandEmpty>
                                <CommandGroup>
                                  {rawMaterialsData
                                    ?.filter((material: any) =>
                                      (material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
                                      (material.drugName && material.drugName.toLowerCase().includes(materialSearchTerm.toLowerCase())) ||
                                      (material.sku && material.sku.toLowerCase().includes(materialSearchTerm.toLowerCase()))) &&
                                      material.currentStock > 0
                                    )
                                    ?.map((material: any) => (
                                      <CommandItem
                                        key={material.id}
                                        value={material.name}
                                        onSelect={() => {
                                          setMaterialToAdd(material);
                                          setMaterialPopoverOpen(false);
                                          setMaterialSearchTerm('');
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{material.name}</span>
                                          <div className="text-xs text-muted-foreground">
                                            {material.drugName && `${material.drugName} • `}
                                            {material.sku && `SKU: ${material.sku} • `}
                                            {material.currentStock > 0 && `Stock: ${material.currentStock} ${material.unitOfMeasure}`}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder={t('quantity')}
                            min="1"
                            value={materialQuantity === '0' ? '' : materialQuantity}
                            onChange={(e) => setMaterialQuantity(e.target.value === '' || e.target.value === '0' ? '' : Math.max(1, parseInt(e.target.value) || 1).toString())}
                          />
                          {materialToAdd && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                              {materialToAdd.unitOfMeasure || 'units'}
                            </span>
                          )}
                        </div>

                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder={t('unitPrice')}
                          min="0.01"
                          value={materialUnitPrice === '0' || materialUnitPrice === '0.00' ? '' : materialUnitPrice}
                          onChange={(e) => setMaterialUnitPrice(e.target.value === '' || e.target.value === '0' || e.target.value === '0.00' ? '' : e.target.value)}
                        />

                        <Button onClick={handleAddMaterial} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Materials List */}
                      {rawMaterials.length > 0 && (
                        <div className="space-y-2">
                          {rawMaterials.map((material, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-medium">{material.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {material.quantity} {material.unitOfMeasure} × {formatCurrency(material.unitPrice)}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveMaterial(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Packaging Section */}
                    <div>
                      <Label className="text-base font-semibold">Packaging</Label>

                      {/* Add Packaging Form */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <Popover open={packagingPopoverOpen} onOpenChange={setPackagingPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={packagingPopoverOpen}
                              className="justify-between"
                            >
                              {packagingToAdd ? packagingToAdd.name : 'Select packaging'}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search packaging..." 
                                value={packagingSearchTerm}
                                onValueChange={setPackagingSearchTerm}
                              />
                              <CommandList>
                                <CommandEmpty>No packaging found.</CommandEmpty>
                                <CommandGroup>
                                  {packagingMaterials
                                    ?.filter((item: any) =>
                                      item.name.toLowerCase().includes(packagingSearchTerm.toLowerCase()) ||
                                      (item.drugName && item.drugName.toLowerCase().includes(packagingSearchTerm.toLowerCase())) ||
                                      (item.sku && item.sku.toLowerCase().includes(packagingSearchTerm.toLowerCase()))
                                    )
                                    ?.map((item: any) => (
                                      <CommandItem
                                        key={item.id}
                                        value={item.name}
                                        onSelect={() => {
                                          setPackagingToAdd(item);
                                          setPackagingPopoverOpen(false);
                                          setPackagingSearchTerm('');
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{item.name}</span>
                                          <div className="text-xs text-muted-foreground">
                                            {item.drugName && `${item.drugName} • `}
                                            {item.sku && `SKU: ${item.sku} • `}
                                            {item.quantity > 0 && `Stock: ${item.quantity} ${item.unitOfMeasure || 'units'}`}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="Qty"
                            min="1"
                            value={packagingQuantity === '0' ? '' : packagingQuantity}
                            onChange={(e) => setPackagingQuantity(e.target.value === '' || e.target.value === '0' ? '' : Math.max(1, parseInt(e.target.value) || 1).toString())}
                          />
                          {packagingToAdd && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                              {packagingToAdd.unitOfMeasure || 'units'}
                            </span>
                          )}
                        </div>

                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Unit Price"
                          min="0.01"
                          value={packagingUnitPrice === '0' || packagingUnitPrice === '0.00' ? '' : packagingUnitPrice}
                          onChange={(e) => setPackagingUnitPrice(e.target.value === '' || e.target.value === '0' || e.target.value === '0.00' ? '' : e.target.value)}
                        />

                        <Button onClick={handleAddPackaging} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Packaging List */}
                      {packagingItems.length > 0 && (
                        <div className="space-y-2">
                          {packagingItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {item.quantity} {item.unitOfMeasure} × ${item.unitPrice}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemovePackaging(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Additional Costs */}
                    <div>
                      <Label className="text-base font-semibold">{t('additionalCosts')}</Label>

                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label>{t('transportationCost')}</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={transportationCost}
                            onChange={(e) => setTransportationCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>{t('laborCost')}</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={laborCost}
                            onChange={(e) => setLaborCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>{t('equipmentCost')}</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={equipmentCost}
                            onChange={(e) => setEquipmentCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>{t('overheadCost')}</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={qualityControlCost}
                            onChange={(e) => setQualityControlCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>{t('overheadCost')}</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={storageCost}
                            onChange={(e) => setStorageCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Tax Percentage</Label>
                          <Input 
                            type="number" 
                            value={taxPercentage}
                            onChange={(e) => setTaxPercentage(parseInt(e.target.value) || 14)}
                            placeholder="14"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Transportation Notes</Label>
                      <Textarea 
                        value={transportationNotes}
                        onChange={(e) => setTransportationNotes(e.target.value)}
                        placeholder="Any special transportation requirements..."
                      />
                    </div>

                    
<Button 
  onClick={handleCreateOrder} 
  className="w-full"
  type="button"
  disabled={!selectedCustomer || isLoading}
>
  <Save className="mr-2 h-4 w-4" />
  {isLoading ? 'Creating...' : t('createProductionOrder')}
</Button>

                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotalPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transportation Cost:</span>
                      <span>{formatCurrency(transportationCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({taxPercentage}%):</span>
                      <span>{formatCurrency((parseFloat(subtotalPrice) * (taxPercentage / 100)).toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Production Orders History */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Production Orders History</h3>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Export by Warehouse</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => exportProductionOrdersByWarehouse('Warehouse 1')}>
                      Warehouse 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportProductionOrdersByWarehouse('Warehouse 2')}>
                      Warehouse 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportProductionOrdersByWarehouse('Central Storage')}>
                      Central Storage
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Final Product</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : productionOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          No production orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      productionOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{order.finalProduct || 'N/A'}</TableCell>
                          <TableCell>${order.totalCost}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`inline-flex items-center whitespace-nowrap font-medium text-xs px-2 py-1 rounded-full border ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                order.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-300' :
                                order.status === 'failed' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                              }`}
                            >
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace('-', ' ') || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCreateInvoice(order.id)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => confirmDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refining" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Refining Order Creation Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Create Refining Order</h2>

                  <div className="space-y-4">
                    {/* Customer Selection */}
                    <div>
                      <Label>Customer</Label>
                      <Popover open={refiningCustomerPopoverOpen} onOpenChange={setRefiningCustomerPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={refiningCustomerPopoverOpen}
                            className="w-full justify-between"
                          >
                            {refiningSelectedCustomer ? refiningSelectedCustomer.name : "Select customer..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search customers..." 
                              value={refiningCustomerSearchTerm}
                              onValueChange={setRefiningCustomerSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>No customer found.</CommandEmpty>
                              <CommandGroup>
                                {customers
                                  ?.filter((customer: any) => {
                                    const term = refiningCustomerSearchTerm.toLowerCase();
                                    return (
                                      customer.name?.toLowerCase().includes(term) ||
                                      customer.company?.toLowerCase().includes(term) ||
                                      customer.sector?.toLowerCase().includes(term)
                                    );
                                  })
                                  ?.map((customer: any) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={customer.name}
                                      onSelect={() => {
                                        setRefiningSelectedCustomer(customer);
                                        setRefiningCustomerPopoverOpen(false);
                                        setRefiningCustomerSearchTerm('');
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{customer.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {customer.company} • {customer.sector}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {refiningSelectedCustomer && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="font-medium">{refiningSelectedCustomer.name}</p>
                          <p className="text-sm text-muted-foreground">{refiningSelectedCustomer.company}</p>
                          <p className="text-sm text-muted-foreground">{refiningSelectedCustomer.sector}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Batch Number</Label>
                      <Input 
                        value={refiningBatchNumber} 
                        onChange={(e) => setRefiningBatchNumber(e.target.value)}
                        placeholder="Auto-generated"
                      />
                    </div>

                    {/* Source Selection */}
                    <div>
                      <Label>Source Material</Label>
                      <RadioGroup value={sourceType} onValueChange={setSourceType}>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="production" id="production" />
                            <Label htmlFor="production">From Production Order</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="stock" id="stock" />
                            <Label htmlFor="stock">From Stock Item</Label>
                          </div>
                        </div>
                      </RadioGroup>

                      <div className="mt-3">
                      {sourceType === 'production' ? (
                        <Popover open={productionOrderPopoverOpen} onOpenChange={setProductionOrderPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={productionOrderPopoverOpen}
                              className="w-full justify-between"
                            >
                              {selectedProductionOrder ? `${selectedProductionOrder.batchNumber} - ${selectedProductionOrder.finalProduct}` : "Select production order..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search production orders..." 
                                value={productionOrderSearchTerm}
                                onValueChange={setProductionOrderSearchTerm}
                              />
                              <CommandList>
                                <CommandEmpty>No production order found.</CommandEmpty>
                                <CommandGroup>
                                  {productionOrders
                                    ?.filter((order: any) =>
                                      order.batchNumber.toLowerCase().includes(productionOrderSearchTerm.toLowerCase()) ||
                                      order.finalProduct.toLowerCase().includes(productionOrderSearchTerm.toLowerCase()) ||
                                      order.customerName.toLowerCase().includes(productionOrderSearchTerm.toLowerCase()) ||
                                      order.orderNumber.toLowerCase().includes(productionOrderSearchTerm.toLowerCase())
                                    )
                                    ?.map((order: any) => (
                                      <CommandItem
                                        key={order.id}
                                        value={order.batchNumber}
                                        onSelect={() => {
                                          setSelectedProductionOrder(order);
                                          setSourceProductionOrder(order.id.toString());
                                          setProductionOrderPopoverOpen(false);
                                          setProductionOrderSearchTerm('');
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{order.batchNumber} - {order.finalProduct}</span>
                                          <div className="text-xs text-muted-foreground">
                                            Customer: {order.customerName} • Status: {order.status} • Cost: {order.totalCost} EGP
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Popover open={stockItemPopoverOpen} onOpenChange={setStockItemPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={stockItemPopoverOpen}
                              className="w-full justify-between"
                            >
                              {selectedStockItem ? selectedStockItem.name : "Select stock item..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search inventory..." 
                                value={stockItemSearchTerm}
                                onValueChange={setStockItemSearchTerm}
                              />
                              <CommandList>
                                <CommandEmpty>No inventory item found.</CommandEmpty>
                                <CommandGroup>
                                  {inventoryItems
                                    ?.filter((item: any) =>
                                      item.name.toLowerCase().includes(stockItemSearchTerm.toLowerCase()) ||
                                      (item.drugName && item.drugName.toLowerCase().includes(stockItemSearchTerm.toLowerCase())) ||
                                      (item.sku && item.sku.toLowerCase().includes(stockItemSearchTerm.toLowerCase()))
                                    )
                                    ?.map((item: any) => (
                                      <CommandItem
                                        key={item.id}
                                        value={item.name}
                                        onSelect={() => {
                                          setSelectedStockItem(item);
                                          setSourceStockItem(item.id.toString());
                                          setStockItemPopoverOpen(false);
                                          setStockItemSearchTerm('');
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{item.name}</span>
                                          <div className="text-xs text-muted-foreground">
                                            {item.drugName && `${item.drugName} • `}
                                            {item.sku && `SKU: ${item.sku} • `}
                                            Stock: {item.currentStock || 0} {item.unitOfMeasure || 'units'}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                      </div>
                    </div>

                    {/* Raw Materials Section */}
                    <div>
                      <Label className="text-base font-semibold">Raw Materials</Label>

                      {/* Add Material Form */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <Popover open={refiningMaterialPopoverOpen} onOpenChange={setRefiningMaterialPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={refiningMaterialPopoverOpen}
                              className="justify-between"
                            >
                              {refiningMaterialToAdd ? refiningMaterialToAdd.name : 'Select material'}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search materials..." 
                                value={refiningMaterialSearchTerm}
                                onValueChange={setRefiningMaterialSearchTerm}
                              />
                              <CommandList>
                                <CommandEmpty>No material found.</CommandEmpty>
                                <CommandGroup>
                                  {rawMaterialsData
                                    ?.filter((material: any) =>
                                      (material.name.toLowerCase().includes(refiningMaterialSearchTerm.toLowerCase()) ||
                                      (material.drugName && material.drugName.toLowerCase().includes(refiningMaterialSearchTerm.toLowerCase())) ||
                                      (material.sku && material.sku.toLowerCase().includes(refiningMaterialSearchTerm.toLowerCase()))) &&
                                      material.currentStock > 0
                                    )
                                    ?.map((material: any) => (
                                      <CommandItem
                                        key={material.id}
                                        value={material.name}
                                        onSelect={() => {
                                          setRefiningMaterialToAdd(material);
                                          setRefiningMaterialPopoverOpen(false);
                                          setRefiningMaterialSearchTerm('');
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{material.name}</span>
                                          <div className="text-xs text-muted-foreground">
                                            {material.drugName && `${material.drugName} • `}
                                            {material.sku && `SKU: ${material.sku} • `}
                                            {material.currentStock > 0 && `Stock: ${material.currentStock} ${material.unitOfMeasure}`}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <Input 
                          type="number" 
                          placeholder="Qty"
                          min="1"
                          value={refiningMaterialQuantity === '0' ? '' : refiningMaterialQuantity}
                          onChange={(e) => setRefiningMaterialQuantity(e.target.value === '' || e.target.value === '0' ? '' : Math.max(1, parseInt(e.target.value) || 1).toString())}
                        />

                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Unit Price"
                          min="0.01"
                          value={refiningMaterialUnitPrice === '0' || refiningMaterialUnitPrice === '0.00' ? '' : refiningMaterialUnitPrice}
                          onChange={(e) => setRefiningMaterialUnitPrice(e.target.value === '' || e.target.value === '0' || e.target.value === '0.00' ? '' : e.target.value)}
                        />

                        <Button onClick={handleAddRefiningMaterial} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Materials List */}
                      {refiningRawMaterials.filter(material => material.quantity > 0 && parseFloat(material.unitPrice || '0') > 0).length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {refiningRawMaterials
                            .filter(material => material.quantity > 0 && parseFloat(material.unitPrice || '0') > 0)
                            .map((material, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex-1">
                                <span className="font-medium text-sm">{material.name}</span>
                                <div className="text-xs text-muted-foreground">
                                  {material.quantity} {material.unitOfMeasure} × ${material.unitPrice}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveRefiningMaterial(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Packaging Section */}
                    <div>
                      <Label className="text-base font-semibold">Packaging</Label>

                      {/* Add Packaging Form */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <Popover open={refiningPackagingPopoverOpen} onOpenChange={setRefiningPackagingPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={refiningPackagingPopoverOpen}
                              className="justify-between"
                            >
                              {packagingToAdd ? packagingToAdd.name : 'Select packaging'}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search packaging..." 
                                value={refiningPackagingSearchTerm}
                                onValueChange={setRefiningPackagingSearchTerm}
                              />
                              <CommandList>
                                <CommandEmpty>No packaging found.</CommandEmpty>
                                <CommandGroup>
                                  {inventoryItems
                                    ?.filter((item: any) =>
                                      (item.name.toLowerCase().includes(refiningPackagingSearchTerm.toLowerCase()) ||
                                      (item.drugName && item.drugName.toLowerCase().includes(refiningPackagingSearchTerm.toLowerCase())) ||
                                      (item.sku && item.sku.toLowerCase().includes(refiningPackagingSearchTerm.toLowerCase()))) &&
                                      (item.quantity > 0)
                                    )
                                    ?.map((item: any) => (
                                      <CommandItem
                                        key={item.id}
                                        value={item.name}
                                        onSelect={() => {
                                          setPackagingToAdd(item);
                                          setRefiningPackagingPopoverOpen(false);
                                          setRefiningPackagingSearchTerm('');
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium">{item.name}</span>
                                          <div className="text-xs text-muted-foreground">
                                            {item.drugName && `${item.drugName} • `}
                                            {item.sku && `SKU: ${item.sku} • `}
                                            {item.quantity > 0 && `Stock: ${item.quantity} ${item.unitOfMeasure || 'units'}`}
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="Qty"
                            min="1"
                            value={packagingQuantity === '0' ? '' : packagingQuantity}
                            onChange={(e) => setPackagingQuantity(e.target.value === '' || e.target.value === '0' ? '' : Math.max(1, parseInt(e.target.value) || 1).toString())}
                          />
                          {packagingToAdd && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                              {packagingToAdd.unitOfMeasure || 'units'}
                            </span>
                          )}
                        </div>

                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="Unit Price"
                          min="0.01"
                          value={packagingUnitPrice === '0' || packagingUnitPrice === '0.00' ? '' : packagingUnitPrice}
                          onChange={(e) => setPackagingUnitPrice(e.target.value === '' || e.target.value === '0' || e.target.value === '0.00' ? '' : e.target.value)}
                        />

                        <Button onClick={handleAddPackaging} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Packaging List */}
                      {packagingItems.filter(item => (item.quantity || 0) > 0 && parseFloat(item.unitPrice || '0') > 0).length > 0 && (
                        <div className="space-y-2">
                          {packagingItems
                            .filter(item => (item.quantity || 0) > 0 && parseFloat(item.unitPrice || '0') > 0)
                            .map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {item.quantity} {item.unitOfMeasure} × ${item.unitPrice}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemovePackaging(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Refining Steps */}
                    <div>
                      <Label className="text-base font-semibold">Refining Steps</Label>

                      <div className="flex gap-2 mb-3">
                        <Input 
                          value={newRefiningStep}
                          onChange={(e) => setNewRefiningStep(e.target.value)}
                          placeholder="Add refining step..."
                          onKeyPress={(e) => e.key === 'Enter' && handleAddRefiningStep()}
                        />
                        <Button onClick={handleAddRefiningStep} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {refiningSteps.length > 0 && (
                        <div className="space-y-2">
                          {refiningSteps.map((step, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="font-medium">{step}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveRefiningStep(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Expected Output</Label>
                      <Textarea 
                        value={expectedOutput}
                        onChange={(e) => setExpectedOutput(e.target.value)}
                        placeholder="Describe the expected output..."
                      />
                    </div>

                    {/* Additional Costs */}
                    <div>
                      <Label className="text-base font-semibold">Additional Costs</Label>

                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label>Base Cost</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={refiningSubtotal}
                            onChange={(e) => setRefiningSubtotal(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Transportation Cost</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={refiningTransportationCost}
                            onChange={(e) => setRefiningTransportationCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Labor Cost</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={refiningLaborCost}
                            onChange={(e) => setRefiningLaborCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Equipment Cost</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={refiningEquipmentCost}
                            onChange={(e) => setRefiningEquipmentCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Quality Control Cost</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={refiningQualityControlCost}
                            onChange={(e) => setRefiningQualityControlCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Storage Cost</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={refiningStorageCost}
                            onChange={(e) => setRefiningStorageCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Processing Cost</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={refiningProcessingCost}
                            onChange={(e) => setRefiningProcessingCost(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label>Tax Percentage</Label>
                          <Input 
                            type="number" 
                            value={refiningTaxPercentage}
                            onChange={(e) => setRefiningTaxPercentage(parseInt(e.target.value) || 14)}
                            placeholder="14"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Transportation Notes</Label>
                      <Textarea 
                        value={refiningTransportationNotes}
                        onChange={(e) => setRefiningTransportationNotes(e.target.value)}
                        placeholder="Any special transportation requirements..."
                      />
                    </div>

                    <Button onClick={handleCreateRefiningOrder} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Create Refining Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Refining Order Summary */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Refining Order Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency((
                        refiningRawMaterials.reduce((sum, material) => sum + (material.quantity * parseFloat(material.unitPrice || '0')), 0) +
                        packagingItems.reduce((sum, item) => sum + ((item.quantity || 0) * parseFloat(item.unitPrice || '0')), 0) +
                        (parseFloat(refiningSubtotal) || 0) +
                        (parseFloat(refiningLaborCost) || 0) +
                        (parseFloat(refiningEquipmentCost) || 0) +
                        (parseFloat(refiningQualityControlCost) || 0) +
                        (parseFloat(refiningStorageCost) || 0) +
                        (parseFloat(refiningProcessingCost) || 0)
                      ).toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transportation Cost:</span>
                      <span>{formatCurrency(refiningTransportationCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({refiningTaxPercentage}%):</span>
                      <span>{formatCurrency(((
                        refiningRawMaterials.reduce((sum, material) => sum + (material.quantity * parseFloat(material.unitPrice || '0')), 0) +
                        packagingItems.reduce((sum, item) => sum + ((item.quantity || 0) * parseFloat(item.unitPrice || '0')), 0) +
                        (parseFloat(refiningSubtotal) || 0) +
                        (parseFloat(refiningTransportationCost) || 0) +
                        (parseFloat(refiningLaborCost) || 0) +
                        (parseFloat(refiningEquipmentCost) || 0) +
                        (parseFloat(refiningQualityControlCost) || 0) +
                        (parseFloat(refiningStorageCost) || 0) +
                        (parseFloat(refiningProcessingCost) || 0)
                      ) * (refiningTaxPercentage / 100)).toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(refiningCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Refining Orders History */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Refining Orders History</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Export by Warehouse</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => exportRefiningOrdersByWarehouse('Warehouse 1')}>
                      Warehouse 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRefiningOrdersByWarehouse('Warehouse 2')}>
                      Warehouse 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRefiningOrdersByWarehouse('Central Storage')}>
                      Central Storage
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Source Type</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : refiningOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          No refining orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      refiningOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.batchNumber}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell className="capitalize">{order.sourceType || 'N/A'}</TableCell>
                          <TableCell>${order.totalCost}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`inline-flex items-center whitespace-nowrap font-medium text-xs px-2 py-1 rounded-full border ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                order.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-300' :
                                order.status === 'failed' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                              }`}
                            >
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1).replace('-', ' ') || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCreateInvoice(order.id)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => confirmDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder?.batchNumber} - {selectedOrder?.orderType === 'production' ? 'Production Order' : 'Refining Order'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                <p className="font-medium">{selectedOrder?.customerName || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder?.company || 'N/A'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <Badge 
                  variant="outline" 
                  className={`inline-flex items-center whitespace-nowrap font-medium text-xs px-2 py-1 rounded-full border ${
                    selectedOrder?.status === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                    selectedOrder?.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    selectedOrder?.status === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    selectedOrder?.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-300' :
                    selectedOrder?.status === 'failed' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                >
                  {selectedOrder?.status?.charAt(0).toUpperCase() + selectedOrder?.status?.slice(1).replace('-', ' ') || 'Pending'}
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                <p>{selectedOrder?.createdAt ? format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy') : 'N/A'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Location</h3>
                <p>{selectedOrder?.location || 'Not specified'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Priority Level</h3>
                <p className="capitalize">{selectedOrder?.priorityLevel || 'Normal'}</p>
              </div>
            </div>

            {selectedOrder?.orderType === 'production' ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Final Product</h3>
                  <p>{selectedOrder?.finalProduct || 'N/A'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Raw Materials</h3>
                  {selectedOrder?.rawMaterials && selectedOrder.rawMaterials.length > 0 ? (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(typeof selectedOrder.rawMaterials === 'string' 
                            ? JSON.parse(selectedOrder.rawMaterials)
                            : selectedOrder.rawMaterials
                          ).map((material: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{material.name}</TableCell>
                              <TableCell>{material.quantity} {material.unitOfMeasure}</TableCell>
                              <TableCell>EGP {material.unitPrice}</TableCell>
                              <TableCell>EGP {(parseFloat(material.quantity) * parseFloat(material.unitPrice)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No raw materials specified</p>
                  )}
                </div>

                {selectedOrder?.packagingMaterials && selectedOrder.packagingMaterials.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Packaging Materials</h3>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(typeof selectedOrder.packagingMaterials === 'string' 
                            ? JSON.parse(selectedOrder.packagingMaterials)
                            : selectedOrder.packagingMaterials
                          ).map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.quantity} {item.unitOfMeasure}</TableCell>
                              <TableCell>EGP {item.unitPrice}</TableCell>
                              <TableCell>EGP {(parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Source Type</h3>
                  <p className="capitalize">{selectedOrder?.sourceType || 'N/A'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Source ID</h3>
                  <p>{selectedOrder?.sourceId || 'N/A'}</p>
                </div>

                {selectedOrder?.refiningSteps && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Refining Steps</h3>
                    <div className="space-y-1">
                      {(typeof selectedOrder.refiningSteps === 'string' 
                        ? JSON.parse(selectedOrder.refiningSteps)
                        : selectedOrder.refiningSteps
                        ).map((step: any, index: number) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm">
                          {index + 1}. {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Expected Output</h3>
                  <p>{selectedOrder?.expectedOutput || 'N/A'}</p>
                </div>
              </>
            )}

            {selectedOrder?.transportationCost && parseFloat(selectedOrder.transportationCost) > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Transportation</h3>
                <p>Cost: ${selectedOrder.transportationCost}</p>
                {selectedOrder.transportationNotes && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.transportationNotes}</p>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Subtotal</h3>
                <p className="font-semibold">${selectedOrder?.subtotal || '0.00'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tax ({selectedOrder?.taxPercentage || 14}%)</h3>
                <p className="font-semibold">${selectedOrder?.taxAmount || '0.00'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Cost</h3>
                <p className="text-lg font-bold text-primary">${selectedOrder?.totalCost || '0.00'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;