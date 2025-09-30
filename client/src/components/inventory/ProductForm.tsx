import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define the form schema with the expiry date field
const productFormSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  drugName: z.string().min(3, { message: 'Drug name must be at least 3 characters' }),
  categoryId: z.coerce.number().positive({ message: 'Please select a category' }),
  sku: z.string().min(1, { message: 'SKU is required' }),
  gs1Code: z.string().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().int().nonnegative({ message: 'Quantity must be a non-negative integer' }),
  unitOfMeasure: z.string().min(1, { message: 'Please select a unit of measure' }),
  grade: z.array(z.string()).default(['P']),
  lowStockThreshold: z.coerce.number().int().nonnegative({ message: 'Low stock threshold must be a non-negative integer' }),
  reorderLevel: z.coerce.number().int().nonnegative().optional(),
  maxStockLevel: z.coerce.number().int().nonnegative().optional(),
  criticalLevel: z.coerce.number().int().nonnegative().optional(),
  alertFrequency: z.string().optional(),
  costPrice: z.coerce.number().positive({ message: 'Cost price must be greater than 0' }),
  sellingPrice: z.coerce.number().positive({ message: 'Selling price must be greater than 0' }),
  location: z.string().optional(),
  shelf: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.string().default('active'),
  productType: z.string().default('finished'),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  onSuccess?: () => void;
  productId?: number; // For editing an existing product
  initialData?: any; // For populating form with existing product data
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface Warehouse {
  id: number;
  name: string;
  address: string;
  code: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess, productId, initialData }) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch warehouses from API instead of hardcoded data
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery<Warehouse[]>({
    queryKey: ['/api/warehouses'],
  });

  // Fetch categories for select options
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Define default values, populating from initialData if provided
  const defaultValues: Partial<ProductFormValues> = {
    name: initialData?.name || '',
    drugName: initialData?.drugName || '',
    categoryId: initialData?.categoryId || 0,
    sku: initialData?.sku || '',
    gs1Code: initialData?.gs1Code || '',
    description: initialData?.description || '',
    quantity: initialData?.quantity || 0,
    unitOfMeasure: initialData?.unitOfMeasure || 'PCS',
    grade: initialData?.grade ? (Array.isArray(initialData.grade) ? initialData.grade : initialData.grade.split(',')) : ['P'],
    lowStockThreshold: initialData?.lowStockThreshold || 10,
    reorderLevel: initialData?.reorderLevel || 25,
    maxStockLevel: initialData?.maxStockLevel || 250,
    criticalLevel: initialData?.criticalLevel || 5,
    alertFrequency: initialData?.alertFrequency || 'daily',
    costPrice: initialData?.costPrice || 0,
    sellingPrice: initialData?.sellingPrice || 0,
    location: initialData?.location || '',
    shelf: initialData?.shelf || '',
    expiryDate: initialData?.expiryDate || '',
    status: initialData?.status || 'active',
    productType: initialData?.productType || 'finished',
  };

  // Initialize the form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      // Create a new FormData instance for file uploads if needed
      return apiRequest('POST', '/api/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      // Invalidate inventory alert cards for real-time dashboard updates
      queryClient.invalidateQueries({ queryKey: ['expiring-products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      console.log('Product created successfully - invalidated all inventory caches for real-time updates');
      toast({
        title: 'Success',
        description: 'Product has been added successfully.',
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add product: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async (data: ProductFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      console.log('🔥 FRONTEND MUTATION: Sending PATCH to /api/products/' + id + ' with data:', updateData);
      return apiRequest('PATCH', `/api/products/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      // Invalidate inventory alert cards for real-time dashboard updates
      queryClient.invalidateQueries({ queryKey: ['expiring-products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      console.log('Product updated successfully - invalidated all inventory caches for real-time updates');
      toast({
        title: 'Success',
        description: 'Product has been updated successfully.',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update product: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    console.log('🔥 FRONTEND: Form submit data:', JSON.stringify(data, null, 2));
    
    // Create a clean object with only the fields needed for API submission using the specified format
    const formattedData = {
      name: data.name,
      drugName: data.drugName,
      categoryId: Number(data.categoryId),
      sku: data.sku,
      gs1Code: data.gs1Code || '',
      description: data.description || '',
      quantity: parseFloat(data.quantity.toString()),
      lowStockThreshold: parseInt(data.lowStockThreshold.toString()),
      costPrice: parseFloat(data.costPrice.toString()),
      sellingPrice: parseFloat(data.sellingPrice.toString()),
      unitOfMeasure: data.unitOfMeasure,
      grade: Array.isArray(data.grade) ? data.grade.join(',') : (data.grade || 'P'),
      location: data.location || '',
      shelf: data.shelf || '',
      status: data.status || 'active',
      productType: data.productType || 'finished',
      // Handle expiry date - either a date or 'no-expiry'
      ...(data.expiryDate ? { 
        expiryDate: data.expiryDate === 'no-expiry' 
          ? null 
          : new Date(data.expiryDate).toISOString().split('T')[0]
      } : {})
    };
    
    console.log('🔥 FRONTEND: Formatted data for API:', JSON.stringify(formattedData, null, 2));
    
    if (initialData?.id) {
      // If we have an ID, we're updating an existing product
      console.log('🔥 FRONTEND: Calling UPDATE mutation for product ID:', initialData.id);
      updateProduct.mutate({ 
        ...formattedData, 
        id: initialData.id 
      } as any);
    } else {
      // Otherwise we're creating a new product
      console.log('🔥 FRONTEND: Calling CREATE mutation');
      createProduct.mutate(formattedData as any);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('productName')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter product name" 
                    {...field} 
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="drugName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('chemicalName')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter chemical name" 
                    {...field} 
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('category')}</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  value={field.value ? field.value.toString() : "0"}
                >
                  <FormControl>
                    <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : (
                      categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grade</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {[
                      { value: 'P', label: 'Pharmaceutical (P)' },
                      { value: 'F', label: 'Food (F)' },
                      { value: 'T', label: 'Technical (T)' }
                    ].map((grade) => (
                      <div key={grade.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`grade-${grade.value}`}
                          checked={field.value?.includes(grade.value) || false}
                          onCheckedChange={(checked) => {
                            const currentGrades = field.value || [];
                            if (checked) {
                              field.onChange([...currentGrades, grade.value]);
                            } else {
                              field.onChange(currentGrades.filter((g: string) => g !== grade.value));
                            }
                          }}
                        />
                        <label
                          htmlFor={`grade-${grade.value}`}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          {grade.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('batchNo')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter SKU (optional)" 
                    {...field} 
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="gs1Code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={`flex items-center gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                {t('gs1Code')}
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                  ETA Compatible
                </span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter GS1 Code for ETA compliance (optional)" 
                  {...field}
                  value={field.value || ''}
                  className={`font-mono ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Product description..." 
                  {...field} 
                  value={field.value || ''}
                  className={isRTL ? 'text-right' : 'text-left'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('quantity')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    step="1"
                    {...field} 
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('unitOfMeasure')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="L">Liters (L)</SelectItem>
                    <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                    <SelectItem value="T">Tons (T)</SelectItem>
                    <SelectItem value="KG">Kilograms (KG)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="mg">Milligrams (mg)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lowStockThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('lowStockThreshold')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter threshold (e.g. 10)" 
                    min="1"
                    step="1"
                    {...field}
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('costPrice')} ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01" 
                    min="0"
                    {...field} 
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('sellingPrice')} ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01" 
                    min="0"
                    {...field} 
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('warehouse')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingWarehouses ? (
                      <SelectItem value="loading" disabled>Loading warehouses...</SelectItem>
                    ) : (
                      warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.name}>
                          {warehouse.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="shelf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('shelfNumber')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="S-101, Rack-3, etc." 
                    {...field} 
                    value={field.value || ''}
                    className={isRTL ? 'text-right' : 'text-left'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => {
            const [noExpiry, setNoExpiry] = useState(field.value === 'no-expiry' || (!field.value && initialData?.expiryDate === 'no-expiry'));
            
            return (
              <FormItem className="flex flex-col">
                <FormLabel>Expiry Date</FormLabel>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="no-expiry"
                      checked={noExpiry}
                      onChange={(e) => {
                        setNoExpiry(e.target.checked);
                        if (e.target.checked) {
                          field.onChange('no-expiry');
                        } else {
                          field.onChange('');
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="no-expiry" className="text-sm text-gray-700">
                      No expiry date
                    </label>
                  </div>
                  
                  {!noExpiry && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value && field.value !== 'no-expiry' ? (
                              format(new Date(field.value), "dd/MM/yy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value && field.value !== 'no-expiry' ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : '')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('status')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">In Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="near">Near Expiry</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('productType')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="raw">Raw Material</SelectItem>
                    <SelectItem value="semi-raw">Semi-Raw Material</SelectItem>
                    <SelectItem value="finished">Finished Product</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className={`flex ${isRTL ? 'justify-start space-x-reverse' : 'justify-end'} space-x-2 pt-4`}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              form.reset();
              if (onSuccess) onSuccess();
            }}
          >
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={createProduct.isPending || updateProduct.isPending}
          >
            {createProduct.isPending || updateProduct.isPending 
              ? t('saving') 
              : initialData?.id 
                ? t('updateProduct') 
                : t('saveProduct')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;