import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Check, ChevronsUpDown, Loader2, Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  uom: string;
}

interface PurchaseOrderItem {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PurchaseOrderFormValues {
  supplierId: number;
  date: Date;
  items: PurchaseOrderItem[];
  status: 'draft' | 'sent' | 'received' | 'cancelled';
}

interface PurchaseOrderFormProps {
  onSuccess: () => void;
  initialData?: any;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  onSuccess,
  initialData,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;
  
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );
  
  const [items, setItems] = useState<PurchaseOrderItem[]>(
    initialData?.items || []
  );
  
  const [currentItem, setCurrentItem] = useState<{
    productId: number;
    quantity: number;
    unitPrice?: number;
  }>({
    productId: 0,
    quantity: 1,
  });
  
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    uom: 'unit',
    category_id: 1,
    image: '',
    status: 'active',
    reorder_level: 10,
    location: '',
    shelf: '',
    type: 'raw'
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PurchaseOrderFormValues>({
    defaultValues: {
      supplierId: initialData?.supplierId || 0,
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      items: initialData?.items || [],
      status: initialData?.status || 'draft',
    },
    // Add validation for the supplierId field
    validate: {
      supplierId: (value) => value > 0 || "Supplier is required"
    }
  });

  const { data: suppliers, isLoading: isSuppliersLoading } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const { data: products, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/products', data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Success',
        description: 'Product has been created',
      });
      setShowProductDialog(false);
      setCurrentItem({
        ...currentItem,
        productId: data.id,
        unitPrice: data.price
      });
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to create product',
        variant: 'destructive',
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/purchases', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      toast({
        title: 'Success',
        description: 'Purchase order has been created',
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create purchase order',
        variant: 'destructive',
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/purchases/${initialData.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      toast({
        title: 'Success',
        description: 'Purchase order has been updated',
      });
      onSuccess();
    },
    onError: (error) => {
      console.error('Error updating purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update purchase order',
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    setValue('date', selectedDate);
  }, [selectedDate, setValue]);

  useEffect(() => {
    setValue('items', items);
  }, [items, setValue]);

  const handleAddItem = () => {
    if (currentItem.productId === 0) {
      toast({
        title: 'Required',
        description: 'Please select a product',
        variant: 'destructive',
      });
      return;
    }

    if (currentItem.quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Quantity must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    const selectedProduct = products?.find(p => p.id === currentItem.productId);
    if (!selectedProduct) return;

    const existingItemIndex = items.findIndex(item => item.productId === currentItem.productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += currentItem.quantity;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: PurchaseOrderItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: currentItem.quantity,
        unitPrice: selectedProduct.price,
        total: selectedProduct.price * currentItem.quantity,
      };
      setItems([...items, newItem]);
    }

    // Reset current item
    setCurrentItem({
      productId: 0,
      quantity: 1,
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };
  
  const handleCreateProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast({
        title: 'Required fields',
        description: 'Please fill out the product name and price',
        variant: 'destructive',
      });
      return;
    }
    
    createProductMutation.mutate(newProduct);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const onSubmit = (data: PurchaseOrderFormValues) => {
    if (items.length === 0) {
      toast({
        title: 'Required',
        description: 'Please add at least one item',
        variant: 'destructive',
      });
      return;
    }
    
    // Generate a PO number based on date and supplier ID
    const dateStr = format(new Date(), 'yyyyMMdd');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const poNumber = `PO-${dateStr}-${randomNum}`;
    
    // Format the data as the backend API expects
    const orderData = {
      poNumber,
      supplierId: data.supplierId,
      userId: 1, // Default user ID - in a real system this would come from auth context
      orderDate: format(data.date, 'yyyy-MM-dd'),
      expectedDeliveryDate: null,
      status: data.status,
      totalAmount: calculateTotal(),
      notes: '',
    };
    
    // Format the purchase order data as expected by the backend
    const formattedData = {
      order: orderData,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    if (isEditMode) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const isLoading = isSuppliersLoading || isProductsLoading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Select
              value={watch('supplierId')?.toString() || ''}
              onValueChange={(value) => setValue('supplierId', parseInt(value))}
            >
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplierId && (
              <p className="text-sm text-red-500">Supplier is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Items</h3>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-1/2">
              <Label htmlFor="product">Product</Label>
              
              <div className="relative">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {currentItem.productId 
                        ? products?.find(product => product.id === currentItem.productId)?.name || "Select product" 
                        : "Select or add product"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search for a product..." />
                      <CommandEmpty>
                        <div className="p-2 text-sm text-gray-500">
                          No products found.
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => setShowProductDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add New
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {products?.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.id.toString()}
                            onSelect={(value) => {
                              setCurrentItem({
                                ...currentItem,
                                productId: parseInt(value),
                                unitPrice: product.price
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currentItem.productId === product.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="flex-1">{product.name}</span>
                            <span className="text-sm text-gray-500">${product.price?.toFixed(2)}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setShowProductDialog(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add New Product
                        </CommandItem>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="w-full sm:w-1/4">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 0})}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddItem}
              className="w-full sm:w-auto"
              disabled={!currentItem.productId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {items.length > 0 ? (
            <div className="border rounded-md">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-6 py-4 text-right font-medium">
                      Total:
                    </td>
                    <td className="px-6 py-4 font-medium">
                      ${calculateTotal().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border rounded-md">
              No items added yet. Add items to the purchase order.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={watch('status')} 
            onValueChange={(value: 'draft' | 'sent' | 'received' | 'cancelled') => setValue('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Update' : 'Create'} Purchase Order
        </Button>
      </div>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new product to your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure</Label>
                <Select
                  value={newProduct.uom}
                  onValueChange={(value) => setNewProduct({...newProduct, uom: value})}
                >
                  <SelectTrigger id="uom">
                    <SelectValue placeholder="Select UoM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unit</SelectItem>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="mg">Milligram (mg)</SelectItem>
                    <SelectItem value="l">Liter (L)</SelectItem>
                    <SelectItem value="ml">Milliliter (mL)</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Product Type</Label>
                <Select
                  value={newProduct.type}
                  onValueChange={(value) => setNewProduct({...newProduct, type: value})}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">Raw Material</SelectItem>
                    <SelectItem value="semi-raw">Semi-Raw Material</SelectItem>
                    <SelectItem value="finished">Finished Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                placeholder="Enter product description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateProduct}
              disabled={createProductMutation.isPending}
            >
              {createProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default PurchaseOrderForm;