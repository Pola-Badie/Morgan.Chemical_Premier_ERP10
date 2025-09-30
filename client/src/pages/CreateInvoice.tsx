import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronsUpDown, Loader2, Plus, Trash, X, Printer, RefreshCw, RotateCcw, Save, FileText, Calendar, User, Package, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { PrintableInvoice } from '@/components/PrintableInvoice';
import { useFinancialPreferences } from '@/hooks/use-financial-preferences';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Form validation schema
const invoiceFormSchema = z.object({
  customer: z.object({
    id: z.number().optional(),
    name: z.string().min(1, 'Customer name is required'),
    company: z.string().optional().or(z.literal('')),
    position: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    sector: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    taxNumber: z.string().optional().or(z.literal('')),
  }),
  items: z.array(z.object({
    productId: z.number().min(1, 'Product is required'),
    productName: z.string(),
    category: z.string().optional(),
    batchNo: z.string().optional(),
    gs1Code: z.string().optional(),
    type: z.string().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    total: z.number().min(0),
  })).min(1, 'At least one item is required'),
  subtotal: z.number(),
  discountType: z.enum(['none', 'percentage', 'amount']).default('none'),
  discountValue: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number(),
  vatRate: z.number().min(0).max(100),
  vatAmount: z.number(),
  grandTotal: z.number(),
  paymentStatus: z.enum(['paid', 'unpaid', 'partial']),
  paymentMethod: z.enum(['cash', 'visa', 'cheque', 'bank_transfer']).optional(),
  paymentProofFile: z.any().optional(),
  paymentTerms: z.string().default('0'),
  amountPaid: z.number().min(0),
  paperInvoiceNumber: z.string().optional(),
  approvalNumber: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// Interface for our invoice drafts
interface InvoiceDraft {
  id: string;
  name: string;
  data: InvoiceFormValues;
  lastUpdated: string;
}

// Dynamic default form values based on system preferences
const getDefaultFormValues = (financialPrefs: any): InvoiceFormValues => ({
  customer: {
    id: undefined,
    name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    sector: '',
    address: '',
    taxNumber: '',
  },
  items: [
    {
      productId: 0,
      productName: '',
      category: '',
      batchNo: '',
      gs1Code: '',
      type: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ],
  subtotal: 0,
  discountType: 'none',
  discountValue: 0,
  discountAmount: 0,
  taxRate: financialPrefs.taxRate || 14,
  taxAmount: 0,
  vatRate: financialPrefs.vatRate || 14,
  vatAmount: 0,
  grandTotal: 0,
  paymentStatus: 'unpaid',
  paymentMethod: undefined,
  paymentProofFile: undefined,
  paymentTerms: '0',
  amountPaid: 0,
  paperInvoiceNumber: '',
  approvalNumber: '',
  notes: '',
});

const CreateInvoice = () => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const { toast } = useToast();
  const { preferences: financialPrefs, formatCurrency } = useFinancialPreferences();
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openProductPopovers, setOpenProductPopovers] = useState<{[key: number]: boolean}>({});
  const [showQuotationSelector, setShowQuotationSelector] = useState(false);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>();
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);

  
  // Multi-invoice state
  // Store last active invoice ID in localStorage too
  const getInitialActiveInvoiceId = () => {
    const savedActiveId = localStorage.getItem('activeInvoiceId');
    return savedActiveId || "draft-1";
  };
  
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(getInitialActiveInvoiceId);
  
  // Update localStorage when active invoice changes
  const updateActiveInvoiceId = (newId: string) => {
    setActiveInvoiceId(newId);
    localStorage.setItem('activeInvoiceId', newId);
  };
  
  const [invoiceDrafts, setInvoiceDrafts] = useState<InvoiceDraft[]>(() => {
    try {
      const savedDrafts = localStorage.getItem('invoiceDrafts');
      if (savedDrafts) {
        const parsed = JSON.parse(savedDrafts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Don't change activeInvoiceId here - it's already set from localStorage
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading invoice drafts:', e);
    }
    
    // Default to one invoice draft if nothing valid is saved
    return [{
      id: 'draft-1',
      name: 'Invoice 1',
      data: getDefaultFormValues(financialPrefs),
      lastUpdated: new Date().toISOString()
    }];
  });

  // Function to save drafts to localStorage
  const saveDrafts = (drafts: InvoiceDraft[]) => {
    localStorage.setItem('invoiceDrafts', JSON.stringify(drafts));
  };
  
  // Reset all invoices to start with a single "Invoice 1" draft
  const resetAllInvoices = () => {
    // Create a fresh Invoice 1
    const newDraft: InvoiceDraft = {
      id: 'draft-1',
      name: 'Invoice 1',
      data: getDefaultFormValues(financialPrefs),
      lastUpdated: new Date().toISOString()
    };
    
    // Set our invoices array to just this one draft
    setInvoiceDrafts([newDraft]);
    
    // Save to localStorage
    saveDrafts([newDraft]);
    
    // Set the active invoice to this one
    updateActiveInvoiceId('draft-1');
    
    // Reset the form with default values
    form.reset(getDefaultFormValues(financialPrefs));
    
    toast({
      title: "Invoices reset",
      description: "All invoice drafts have been cleared. Starting fresh with Invoice 1.",
    });
  };

  // Get the currently active draft
  const getCurrentDraft = () => {
    return invoiceDrafts.find(draft => draft.id === activeInvoiceId);
  };
  
  // Refresh only product and customer data, not invoice drafts
  const refreshInvoiceData = () => {
    // Refresh customers and products data without affecting invoiceDrafts state
    queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    
    // Don't reset the activeInvoiceId or invoice drafts
    toast({
      title: "Data refreshed",
      description: "Customer and product data has been refreshed. Your invoice drafts remain unchanged.",
    });
  };

  // Set up the form with stable default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: getDefaultFormValues(financialPrefs),
  });

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control: form.control,
  });

  // Watch form values for calculations
  const watchItems = form.watch('items');
  const watchTaxRate = form.watch('taxRate');
  const watchDiscountType = form.watch('discountType');
  const watchDiscountValue = form.watch('discountValue');
  const watchPaymentStatus = form.watch('paymentStatus');

  // Fetch all customers data
  const { data: allCustomers = [], isLoading: isLoadingCustomers, error: customersError } = useQuery<any[]>({
    queryKey: ['/api/v1/customers'],
    queryFn: async () => {
      try {
        console.log('🔥 INVOICE: Fetching customers from API...');
        const response = await fetch(`${window.location.origin}/api/v1/customers`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`🔥 INVOICE: Fetched ${Array.isArray(data) ? data.length : 0} customers:`, data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('🔥 INVOICE ERROR: Failed to fetch customers:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    refetchOnMount: true, // Always fetch on mount
  });

  // Filter customers based on search term
  const customers = allCustomers.filter(customer => 
    customerSearchTerm.length === 0 || 
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.includes(customerSearchTerm) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Debug logging for customers
  useEffect(() => {
    console.log('🔥 INVOICE: Customer state changed:', {
      allCustomersCount: allCustomers.length,
      filteredCustomersCount: customers.length,
      isLoadingCustomers,
      customersError,
      customerSearchTerm
    });
  }, [allCustomers, customers, isLoadingCustomers, customersError, customerSearchTerm]);

  // Fetch all products directly from inventory (no warehouse filtering)
  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      try {
        console.log('🔥 API ENDPOINT: Fetching from /api/products (all stock)');
        const res = await fetch('/api/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log(`🔥 FRONTEND: Fetched ${data.length} products from all stock`);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch categories to map category names
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch quotations from quotations history
  const { data: quotations = [] } = useQuery<any[]>({
    queryKey: ['/api/quotations', '', 'all', 'all', 'all'],
    queryFn: async () => {
      try {
        console.log('API GET request to /api/quotations?query=&status=all&type=all&date=all:', null);
        const res = await fetch('/api/quotations?query=&status=all&type=all&date=all', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ QUOTATIONS SUCCESS: Received', data.length, 'quotations:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching quotations:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Fetch orders from order history
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders/production-history'],
    queryFn: async () => {
      try {
        console.log('API GET request to /api/orders/production-history:', null);
        const res = await fetch('/api/orders/production-history', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ ORDERS SUCCESS: Received', data.length, 'orders:', data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching order history:', error);
        return [];
      }
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Filter products based on search term only
  const products = productSearchTerm.length > 0 
    ? allProducts.filter(product => 
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.drugName?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
    : allProducts;
  
  // Debug logging
  console.log(`🔥 FRONTEND: Product filtering - ${allProducts.length} total products, ${products.length} filtered products`);

  // Calculate totals automatically when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.items && Array.isArray(value.items)) {
        let hasChanges = false;
        const updates: any = {};

        // Calculate line totals
        value.items.forEach((item, index) => {
          if (item && typeof item.quantity === 'number' && typeof item.unitPrice === 'number') {
            const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));
            if (Math.abs(lineTotal - (item.total || 0)) > 0.01) {
              updates[`items.${index}.total`] = lineTotal;
              hasChanges = true;
            }
          }
        });

        // Calculate subtotal
        const subtotal = Number(value.items.reduce((sum, item) => {
          return sum + (item?.total || 0);
        }, 0).toFixed(2));
        
        if (Math.abs(subtotal - (value.subtotal || 0)) > 0.01) {
          updates.subtotal = subtotal;
          hasChanges = true;
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (value.discountType === 'percentage' && value.discountValue) {
          discountAmount = Number(((subtotal * value.discountValue) / 100).toFixed(2));
        } else if (value.discountType === 'amount' && value.discountValue) {
          discountAmount = Number(value.discountValue);
        }
        
        if (Math.abs(discountAmount - (value.discountAmount || 0)) > 0.01) {
          updates.discountAmount = discountAmount;
          hasChanges = true;
        }

        // Calculate tax amount
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = value.taxRate ? Number(((taxableAmount * value.taxRate) / 100).toFixed(2)) : 0;
        
        if (Math.abs(taxAmount - (value.taxAmount || 0)) > 0.01) {
          updates.taxAmount = taxAmount;
          hasChanges = true;
        }

        // Calculate VAT amount
        const vatAmount = value.vatRate ? Number(((taxableAmount * value.vatRate) / 100).toFixed(2)) : 0;
        
        if (Math.abs(vatAmount - (value.vatAmount || 0)) > 0.01) {
          updates.vatAmount = vatAmount;
          hasChanges = true;
        }

        // Calculate grand total (including both tax and VAT)
        const grandTotal = Number((taxableAmount + taxAmount + vatAmount).toFixed(2));
        
        if (Math.abs(grandTotal - (value.grandTotal || 0)) > 0.01) {
          updates.grandTotal = grandTotal;
          hasChanges = true;
        }

        // Apply all updates at once to prevent multiple re-renders
        if (hasChanges) {
          Object.entries(updates).forEach(([path, value]) => {
            form.setValue(path as any, value, { shouldValidate: false });
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Mutation for creating a customer
  const createCustomerMutation = useMutation({
    mutationFn: async (newCustomer: any) => {
      try {
        const response = await apiRequest('POST', '/api/customers', newCustomer);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        if (!text) throw new Error('Empty response');
        return JSON.parse(text);
      } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Customer created',
        description: `Successfully created customer: ${data.name}`,
      });
      form.setValue('customer', {
        id: data.id,
        name: data.name,
        company: data.company || '',
        position: data.position || '',
        email: data.email || '',
        phone: data.phone || '',
        sector: data.sector || '',
        address: data.address || '',
      });
      setIsCreatingCustomer(false);
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    },
    onError: (error) => {
      console.error('Customer creation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create customer. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Create invoice function with direct fetch call (same approach as procurement)
  const createInvoice = async () => {
    // Clear any previous invoice data
    setCreatedInvoiceData(null);
    const formData = form.getValues();
    await onSubmit(formData);
  };

  // Update form when active invoice changes
  useEffect(() => {
    const activeDraft = getCurrentDraft();
    if (activeDraft) {
      form.reset(activeDraft.data);
      // Sync selectedCustomerId with form data
      setSelectedCustomerId(activeDraft.data.customer.id);
    }
  }, [activeInvoiceId, form]);

  // Save draft periodically (separated from calculations to prevent loops)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentFormData = form.getValues();
      setInvoiceDrafts(prev => {
        const activeDraft = prev.find(draft => draft.id === activeInvoiceId);
        if (activeDraft && JSON.stringify(activeDraft.data) !== JSON.stringify(currentFormData)) {
          const updated = prev.map(draft => 
            draft.id === activeInvoiceId 
              ? { 
                  ...draft, 
                  data: currentFormData,
                  lastUpdated: new Date().toISOString() 
                }
              : draft
          );
          saveDrafts(updated);
          return updated;
        }
        return prev;
      });
    }, 2000); // Further increased delay and only save if data actually changed
    
    return () => clearTimeout(timer);
  }, [watchItems, watchTaxRate, watchDiscountType, watchDiscountValue, activeInvoiceId, form]);

  // Update amount paid based on payment status
  useEffect(() => {
    const grandTotal = form.getValues('grandTotal') || 0;
    
    if (watchPaymentStatus === 'paid' && grandTotal > 0) {
      const currentAmountPaid = form.getValues('amountPaid') || 0;
      if (Math.abs(grandTotal - currentAmountPaid) > 0.01) {
        form.setValue('amountPaid', grandTotal, { shouldValidate: false });
      }
    } else if (watchPaymentStatus === 'unpaid') {
      const currentAmountPaid = form.getValues('amountPaid') || 0;
      if (currentAmountPaid !== 0) {
        form.setValue('amountPaid', 0, { shouldValidate: false });
      }
    }
    // If partial, leave the amount as is for user to specify
  }, [watchPaymentStatus]);

  // Add new product row
  const addProductRow = () => {
    append({
      productId: 0,
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    });
  };

  // Add a new invoice draft
  const addNewDraft = () => {
    if (invoiceDrafts.length >= 4) {
      toast({
        title: "Maximum invoices reached",
        description: "You can only work on up to 4 invoices at a time.",
        variant: "destructive"
      });
      return;
    }
    
    const newId = `draft-${Date.now()}`;
    const newDraft: InvoiceDraft = {
      id: newId,
      name: `Invoice ${invoiceDrafts.length + 1}`,
      data: getDefaultFormValues(financialPrefs),
      lastUpdated: new Date().toISOString()
    };
    
    setInvoiceDrafts(prev => {
      const updated = [...prev, newDraft];
      saveDrafts(updated);
      return updated;
    });
    
    updateActiveInvoiceId(newId);
  };
  
  // Remove an invoice draft
  const removeDraft = (draftId: string) => {
    if (invoiceDrafts.length <= 1) {
      toast({
        title: "Cannot remove draft",
        description: "You need at least one invoice draft.",
        variant: "destructive"
      });
      return;
    }
    
    setInvoiceDrafts(prev => {
      const updated = prev.filter(draft => draft.id !== draftId);
      saveDrafts(updated);
      
      // If removing the active draft, switch to another one
      if (activeInvoiceId === draftId) {
        updateActiveInvoiceId(updated[0].id);
      }
      
      return updated;
    });
  };

  // Handle product selection
  const handleProductSelection = (productId: number, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      // Find category name by ID
      const category = categories.find(c => c.id === product.categoryId);
      const categoryName = category ? category.name : `Category ${product.categoryId}`;
      
      form.setValue(`items.${index}.productId`, product.id);
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.category`, categoryName);
      form.setValue(`items.${index}.batchNo`, product.sku || '');
      form.setValue(`items.${index}.gs1Code`, product.barcode || '');
      form.setValue(`items.${index}.type`, product.productType || '');
      form.setValue(`items.${index}.unitPrice`, parseFloat(product.sellingPrice));
      
      // Close this product's popover
      setOpenProductPopovers(prev => ({
        ...prev,
        [index]: false
      }));
      
      // Reset the search term
      setProductSearchTerm('');
    }
  };

  // Handle customer selection
  const handleCustomerSelection = (customer: any) => {
    // Update local state first to avoid re-renders
    setSelectedCustomerId(customer.id);
    
    form.setValue('customer', {
      id: customer.id,
      name: customer.name,
      company: customer.company || '',
      position: customer.position || '',
      email: customer.email || '',
      phone: customer.phone || '',
      sector: customer.sector || '',
      address: customer.address || '',
      taxNumber: customer.taxNumber || '',
    });
    
    // Close the dropdown
    setCustomerDropdownOpen(false);
    setCustomerSearchTerm('');
  };

  // Handle customer creation
  const handleCustomerCreation = (data: any) => {
    createCustomerMutation.mutate({
      name: data.customer.name,
      company: data.customer.company,
      position: data.customer.position,
      email: data.customer.email,
      phone: data.customer.phone,
      sector: data.customer.sector,
      address: data.customer.address,
      taxNumber: data.customer.taxNumber,
    });
  };

  // Handle quotation selection and import items
  const handleQuotationSelection = (quotation: any) => {
    console.log('🔥 QUOTATION CONVERSION: Converting quotation to invoice:', quotation);
    
    // Resolve customer information
    const customerId = quotation.customerId ?? quotation.customer_id ?? quotation.customer?.id;
    const customerName = quotation.customerName ?? quotation.customer?.name ?? quotation.customer_name;
    
    if (customerId || customerName) {
      // Try to find full customer details from allCustomers
      let resolvedCustomer = null;
      
      if (customerId && allCustomers?.length > 0) {
        resolvedCustomer = allCustomers.find(c => c.id === customerId);
      }
      
      if (!resolvedCustomer && customerName && allCustomers?.length > 0) {
        resolvedCustomer = allCustomers.find(c => 
          c.name?.toLowerCase() === customerName.toLowerCase() ||
          c.company?.toLowerCase() === customerName.toLowerCase()
        );
      }
      
      // Build customer object with full details or fallback values
      const customerData = {
        id: resolvedCustomer?.id || customerId || 0,
        name: resolvedCustomer?.name || customerName || '',
        company: resolvedCustomer?.company || quotation.customer?.company || customerName || '',
        position: resolvedCustomer?.position || quotation.customer?.position || '',
        email: resolvedCustomer?.email || quotation.customer?.email || '',
        phone: resolvedCustomer?.phone || quotation.customer?.phone || '',
        sector: resolvedCustomer?.sector || quotation.customer?.sector || '',
        address: resolvedCustomer?.address || quotation.customer?.address || '',
        taxNumber: resolvedCustomer?.taxNumber || quotation.customer?.taxNumber || '',
      };
      
      console.log('🔥 QUOTATION CONVERSION: Setting customer data:', customerData);
      form.setValue('customer', customerData);
      setSelectedCustomerId(customerData.id);
    }

    // Convert quotation items to invoice items
    const unresolvedItems: string[] = [];
    const mappedItems: any[] = [];
    
    if (quotation.items && quotation.items.length > 0) {
      quotation.items.forEach((item: any) => {
        // Resolve actual product ID - this is critical!
        let productId = item.productId ?? item.product_id ?? item.id;
        
        // If no direct productId, try to match by name/sku from products
        if (!productId && (item.productName || item.name) && allProducts?.length > 0) {
          const productName = item.productName || item.name;
          const matchedProduct = allProducts.find(p => 
            p.name === productName || 
            p.sku === productName ||
            p.barcode === productName
          );
          if (matchedProduct) {
            productId = matchedProduct.id;
          }
        }
        
        if (!productId) {
          unresolvedItems.push(item.productName || item.name || 'Unknown Item');
          return; // Skip items without valid product ID
        }
        
        // Build invoice item with proper field mapping
        const invoiceItem = {
          productId: parseInt(productId),
          productName: item.productName || item.name || item.product?.name || '',
          category: item.category || item.categoryName || item.specifications || '',
          batchNo: item.batchNo || item.batch_no || '',
          gs1Code: item.gs1Code || item.gs1_code || '',
          type: item.type || quotation.type || '',
          quantity: Number(item.quantity ?? item.qty ?? 1),
          unitPrice: Number(item.unitPrice ?? item.price ?? item.unit_price ?? 0),
          total: 0, // Will be auto-calculated
        };
        
        // Calculate total
        invoiceItem.total = Math.round((invoiceItem.quantity * invoiceItem.unitPrice) * 100) / 100;
        
        mappedItems.push(invoiceItem);
      });
      
      console.log('🔥 QUOTATION CONVERSION: Mapped items:', mappedItems);
      
      // Replace entire items array in one operation
      form.setValue('items', mappedItems, { shouldValidate: true });
    }

    // Copy over discount/tax settings if present
    if (quotation.discountType && quotation.discountValue) {
      form.setValue('discountType', quotation.discountType);
      form.setValue('discountValue', Number(quotation.discountValue));
    }
    
    if (quotation.taxRate) {
      form.setValue('taxRate', Number(quotation.taxRate));
    }

    setShowQuotationSelector(false);
    
    // Show success with warnings if needed
    let description = `Items from quotation ${quotation.quotationNumber} have been imported`;
    if (unresolvedItems.length > 0) {
      description += `. Warning: ${unresolvedItems.length} items could not be mapped: ${unresolvedItems.join(', ')}`;
    }
    
    toast({
      title: "Quotation Imported",
      description,
      variant: unresolvedItems.length > 0 ? "destructive" : "default"
    });
  };

  const handleOrderSelection = (order: any) => {
    // Set customer from order
    if (order.customerName) {
      form.setValue('customer', {
        id: order.id,
        name: order.customerName,
        company: order.customerCompany || order.customerName,
        position: '',
        email: '',
        phone: '',
        sector: '',
        address: '',
      });
    }

    // Clear existing items
    fields.forEach((_, index) => {
      if (index > 0) remove(index);
    });

    // Create invoice items from order materials data
    // Remove the default empty item first
    remove(0);
    
    // Add materials from the order as invoice items
    if (order.materials && order.materials.length > 0) {
      // Use the first material as the primary invoice item
      const firstMaterial = order.materials[0];
      append({
        productId: firstMaterial.id || 0,
        productName: firstMaterial.name || '',
        category: 'Pharmaceutical',
        batchNo: order.batchNumber || '',
        gs1Code: '',
        type: order.type || 'manufacturing',
        quantity: firstMaterial.quantity || 1,
        unitPrice: firstMaterial.unitPrice || order.revenue || order.totalCost || 0,
        total: (firstMaterial.quantity || 1) * (firstMaterial.unitPrice || order.revenue || order.totalCost || 0),
        unitOfMeasure: firstMaterial.unitOfMeasure || 'Pcs',
      });
      
      // Add additional materials as separate line items
      for (let i = 1; i < order.materials.length; i++) {
        const material = order.materials[i];
        append({
          productId: material.id || 0,
          productName: material.name || '',
          category: 'Pharmaceutical',
          batchNo: order.batchNumber || '',
          gs1Code: '',
          type: order.type || 'manufacturing',
          quantity: material.quantity || 1,
          unitPrice: material.unitPrice || 0,
          total: (material.quantity || 1) * (material.unitPrice || 0),
          unitOfMeasure: material.unitOfMeasure || 'Pcs',
        });
      }
    } else {
      // Fallback for orders without materials data
      append({
        productId: 0, // Set to 0 since we don't have a valid product ID
        productName: order.targetProduct || `Order ${order.orderNumber}`,
        category: 'Pharmaceutical',
        batchNo: order.batchNumber || '',
        gs1Code: '',
        type: order.type || 'manufacturing',
        quantity: 1,
        unitPrice: order.revenue || order.totalCost || 0,
        total: order.revenue || order.totalCost || 0,
        unitOfMeasure: 'Pcs',
      });
    }

    setShowOrderSelector(false);
    
    toast({
      title: "Order Imported",
      description: `Order ${order.orderNumber} has been imported to invoice`,
    });
  };

  // Handle form submission using direct fetch (same approach as procurement)
  const onSubmit = async (data: InvoiceFormValues) => {
    console.log('Form submission started', data);
    setIsSubmitting(true);
    
    // Validate required fields
    if (!data.customer.id && !data.customer.name) {
      toast({
        title: 'Error',
        description: 'Please select or create a customer',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    
    if (!data.items || data.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item to the invoice',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }
    
    // Validate items
    for (const item of data.items) {
      if (!item.productId || item.productId === 0) {
        toast({
          title: 'Error',
          description: 'Please select a product for all items',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid quantity for all items',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
    }
    
    const invoiceData = {
      customer: data.customer.id 
        ? { id: data.customer.id } 
        : { 
            name: data.customer.name,
            company: data.customer.company,
            position: data.customer.position,
            email: data.customer.email,
            phone: data.customer.phone,
            sector: data.customer.sector,
            address: data.customer.address,
            taxNumber: data.customer.taxNumber,
          },
      items: data.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      grandTotal: data.grandTotal,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod,
      paymentTerms: data.paymentTerms,
      amountPaid: data.amountPaid,
      notes: data.notes,
    };
    
    console.log('Submitting invoice data:', invoiceData);
    
    try {
      // Create invoice via direct API call (same pattern as procurement)
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      });
      
      if (response.ok) {
        const newInvoice = await response.json();
        console.log('Invoice created successfully:', newInvoice);
        
        // Store the created invoice data including form data for preview
        const completeInvoiceData = {
          ...newInvoice,
          customer: data.customer,
          items: data.items.map(item => {
            const product = allProducts.find(p => p.id === item.productId);
            return {
              ...item,
              productName: product?.name || item.productName,
              category: product?.category || item.category,
              batchNo: product?.batchNo || item.batchNo,
            };
          }),
          subtotal: data.subtotal,
          taxRate: data.taxRate,
          taxAmount: data.taxAmount,
          discountAmount: data.discountAmount,
          grandTotal: data.grandTotal,
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod,
          paymentTerms: data.paymentTerms,
          amountPaid: data.amountPaid,
          notes: data.notes,
          paperInvoiceNumber: form.watch('paperInvoiceNumber'),
          approvalNumber: form.watch('approvalNumber'),
          date: new Date(),
        };
        
        setCreatedInvoiceData(completeInvoiceData);
        
        toast({
          title: 'Success',
          description: `Invoice #${newInvoice.invoiceNumber} created successfully`,
        });
        
        // Remove this draft after successful creation
        setInvoiceDrafts(prev => {
          const updated = prev.filter(draft => draft.id !== activeInvoiceId);
          
          // If no more drafts, create a new empty one
          if (updated.length === 0) {
            updated.push({
              id: 'draft-1',
              name: 'Invoice 1',
              data: getDefaultFormValues(financialPrefs),
              lastUpdated: new Date().toISOString()
            });
          }
          
          saveDrafts(updated);
          
          // Set active invoice to the first one
          updateActiveInvoiceId(updated[0].id);
          
          return updated;
        });
        
        // Reset form
        form.reset(getDefaultFormValues(financialPrefs));
        setShowInvoicePreview(true);
        
        // Trigger global cache invalidation
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/accounting'] });
        
      } else {
        const errorText = await response.text();
        console.error('Invoice creation failed:', errorText);
        toast({
          title: 'Error',
          description: `Failed to create invoice: ${errorText}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Invoice creation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mainTab, setMainTab] = useState("create");
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  
  // Print and PDF state
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [createdInvoiceData, setCreatedInvoiceData] = useState<any>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  // Load saved drafts from localStorage
  useEffect(() => {
    const loadSavedDrafts = () => {
      const drafts = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('invoice_draft_')) {
          try {
            const draft = JSON.parse(localStorage.getItem(key) || '{}');
            if (draft.status === 'draft') {
              drafts.push({
                id: key.replace('invoice_draft_', ''),
                key: key,
                ...draft
              });
            }
          } catch (e) {
            console.error('Error parsing draft:', e);
          }
        }
      }
      setSavedDrafts(drafts.sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
    };

    loadSavedDrafts();
    // Refresh drafts when tab changes
    const interval = setInterval(loadSavedDrafts, 1000);
    return () => clearInterval(interval);
  }, [mainTab]);

  const loadDraft = (draftKey: string) => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
      form.reset(draft);
      setMainTab("create");
      toast({
        title: "Draft Loaded",
        description: "Invoice draft has been loaded successfully",
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load draft",
        variant: "destructive",
      });
    }
  };

  const deleteDraft = (draftKey: string) => {
    localStorage.removeItem(draftKey);
    setSavedDrafts(prev => prev.filter((draft: any) => draft.key !== draftKey));
    toast({
      title: "Draft Deleted",
      description: "Invoice draft has been deleted",
    });
  };

  // Print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${getCurrentDraft()?.name || activeInvoiceId}`,
    onAfterPrint: () => {
      toast({
        title: "Invoice Printed",
        description: "Invoice has been sent to printer successfully",
      });
    }
  });

  // PDF generation functionality
  const generatePDF = async () => {
    if (!printRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = `Invoice-${getCurrentDraft()?.name || activeInvoiceId}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Generated",
        description: `Invoice PDF saved as ${fileName}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Preview invoice function
  const previewInvoice = () => {
    const formData = form.getValues();
    
    // Validate that we have minimum required data
    if (!formData.customer.name || formData.items.length === 0) {
      toast({
        title: "Preview Not Available",
        description: "Please add customer information and at least one item to preview the invoice.",
        variant: "destructive",
      });
      return;
    }
    
    setShowInvoicePreview(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('invoiceManagement')}</h1>
          <p className="text-muted-foreground">{t('createNewInvoicesAndManageDrafts')}</p>
        </div>
      </div>
      {/* Main Tab Navigation */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>{t('createInvoice')}</span>
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>{t('draftInvoices')} ({savedDrafts.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Create Invoice Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{t('createNewInvoice')}</h2>
              <p className="text-muted-foreground">{t('createInvoiceDescription')}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => window.history.back()} disabled={isSubmitting}>
                {t('cancel')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const currentData = form.getValues();
                  // Save current invoice data to local storage as draft
                  localStorage.setItem(`invoice_draft_${activeInvoiceId}`, JSON.stringify({
                    ...currentData,
                    savedAt: new Date().toISOString(),
                    status: 'draft'
                  }));
                  toast({
                    title: t('draftSaved'),
                    description: t('invoiceSavedAsDraft'),
                  });
                }}
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {t('saveAsDraft')}
              </Button>
              <Button 
                variant="outline" 
                onClick={previewInvoice}
                disabled={isSubmitting}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('previewInvoice')}
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('createInvoice')}
              </Button>
            </div>
          </div>
      
      {/* Invoice Drafts Tabs */}
      <div className="border rounded-md p-4 mb-6 bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">{t('invoicesInProgress')}</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllInvoices}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('resetToInvoice1')}
            </Button>
            {invoiceDrafts.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addNewDraft}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('newInvoice')}
              </Button>
            )}
          </div>
        </div>
        
        <Tabs value={activeInvoiceId} onValueChange={updateActiveInvoiceId}>
          <TabsList className="grid grid-cols-4 w-full">
            {invoiceDrafts.map(draft => (
              <TabsTrigger key={draft.id} value={draft.id} className="relative">
                <span>{draft.name}</span>
                {invoiceDrafts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 absolute -top-2 -right-2 rounded-full opacity-70 hover:opacity-100 bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDraft(draft.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeInvoiceId}>
            {/* Tab content is actually the entire form below */}
          </TabsContent>
        </Tabs>
        
        <div className="mt-2 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <p>{t('invoiceProgressAutoSaved')}</p>
          </div>
          <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-200">
            <span className="font-medium">{t('nextInvoiceNumber')}:</span> Auto-generated
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('customerInformation')}</CardTitle>
            <CardDescription>
              {t('selectOrCreateCustomer')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>{t('customer')}</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsCreatingCustomer(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('addCustomer')}
                    </Button>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Popover open={customerDropdownOpen} onOpenChange={setCustomerDropdownOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {form.watch('customer.company') || form.watch('customer.name') || t('selectCustomer')}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder={t('searchCustomer')} 
                              value={customerSearchTerm}
                              onValueChange={setCustomerSearchTerm}
                            />
                            <CommandList>
                              {isLoadingCustomers ? (
                                <div className="py-6 text-center text-sm">
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                  <p>{t('loadingCustomers') || 'Loading customers...'}</p>
                                </div>
                              ) : (
                                <>
                                  <CommandEmpty>
                                    {customerSearchTerm.length > 0 ? (
                                      <div className="py-6 text-center text-sm">
                                        <p>{t('noCustomersFoundFor')} "{customerSearchTerm}"</p>
                                        <Button 
                                          variant="outline" 
                                          className="mt-2"
                                          onClick={() => {
                                            setIsCreatingCustomer(true);
                                            setCustomerDropdownOpen(false);
                                          }}
                                        >
                                          <Plus className="mr-2 h-4 w-4" />
                                          {t('createNewCustomer')}
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="py-6 text-center text-sm">
                                        <p>{t('typeToSearchCustomers')}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {allCustomers.length} {t('customersAvailable') || 'customers available'}
                                        </p>
                                      </div>
                                    )}
                                  </CommandEmpty>
                                  <CommandGroup heading={`${t('customers')} (${customers.length})`}>
                                    {customers.map((customer) => (
                                      <CommandItem
                                        key={customer.id}
                                        value={customer.name}
                                        onSelect={() => handleCustomerSelection(customer)}
                                        className="flex items-center justify-between py-3"
                                      >
                                        <div className="flex items-center flex-1">
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              selectedCustomerId === customer.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium">{customer.company || customer.name}</span>
                                              {customer.company && customer.name && (
                                                <span className="text-xs text-muted-foreground">• {customer.name}</span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              {customer.phone && (
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                  {customer.phone}
                                                </span>
                                              )}
                                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                CUST-{String(customer.id).padStart(4, '0')}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  <CommandGroup>
                                    <CommandItem
                                      onSelect={() => {
                                        setIsCreatingCustomer(true);
                                        setCustomerDropdownOpen(false);
                                      }}
                                      className="text-blue-600"
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      {t('createNewCustomer')}
                                    </CommandItem>
                                  </CommandGroup>
                                </>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Paper Invoice Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="paperInvoiceNumber">{t('paperInvoiceNumber')}</Label>
                  <Input
                    id="paperInvoiceNumber"
                    placeholder={t('paperInvoiceNumberPlaceholder')}
                    {...form.register('paperInvoiceNumber')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('physicalInvoiceReference')}
                  </p>
                </div>

                {/* Approval Number Field */}
                <div className="space-y-2">
                  <Label htmlFor="approvalNumber">{t('approvalNumber')}</Label>
                  <Input
                    id="approvalNumber"
                    placeholder={t('approvalNumberPlaceholder')}
                    {...form.register('approvalNumber')}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('internalApprovalReference')}
                  </p>
                </div>

                {/* Customer Details Display */}
                {form.watch('customer.name') && !isCreatingCustomer && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {form.watch('customer.company') ? (
                          <div>
                            <h3 className="font-medium">{form.watch('customer.company')}</h3>
                            <p className="text-sm">{form.watch('customer.name')}</p>
                          </div>
                        ) : (
                          <h3 className="font-medium">{form.watch('customer.company') || form.watch('customer.name')}</h3>
                        )}
                        
                        {/* Customer Code and Mobile prominently displayed */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {form.watch('customer.id') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              {t('code')}: CUST-{String(form.watch('customer.id')).padStart(4, '0')}
                            </span>
                          )}
                          {form.watch('customer.phone') && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                              {t('mobile')}: {form.watch('customer.phone')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedCustomerId(undefined);
                          form.setValue('customer', {
                            id: undefined,
                            name: '',
                            company: '',
                            position: '',
                            email: '',
                            phone: '',
                            sector: '',
                            address: '',
                            taxNumber: '',
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Other customer details */}
                    <div className="space-y-1 pt-2 border-t">
                      {form.watch('customer.taxNumber') && (
                        <p className="text-sm text-muted-foreground">{t('etaNumber')}: {form.watch('customer.taxNumber')}</p>
                      )}
                      {form.watch('customer.sector') && (
                        <p className="text-sm text-muted-foreground">{t('sector')}: {form.watch('customer.sector')}</p>
                      )}
                      {form.watch('customer.email') && (
                        <p className="text-sm text-muted-foreground">{t('email')}: {form.watch('customer.email')}</p>
                      )}
                      {form.watch('customer.address') && (
                        <p className="text-sm text-muted-foreground">{t('address')}: {form.watch('customer.address')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Create New Customer Form */}
              {isCreatingCustomer && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{t('newCustomer')}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsCreatingCustomer(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="customerCompany">{t('companyName')}</Label>
                    <Input
                      id="customerCompany"
                      placeholder={t('companyNamePlaceholder')}
                      {...form.register('customer.company')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerName">{t('name')}</Label>
                    <Input
                      id="customerName"
                      placeholder={t('customerNamePlaceholder')}
                      {...form.register('customer.name')}
                    />
                    {form.formState.errors.customer?.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.customer.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerPosition">{t('position')}</Label>
                    <Input
                      id="customerPosition"
                      placeholder={t('jobTitlePositionPlaceholder')}
                      {...form.register('customer.position')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">{t('phone')}</Label>
                    <Input
                      id="customerPhone"
                      placeholder={t('phoneNumberPlaceholder')}
                      {...form.register('customer.phone')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerSector">{t('sector')}</Label>
                    <Input
                      id="customerSector"
                      placeholder={t('businessSectorPlaceholder')}
                      {...form.register('customer.sector')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerTaxNumber">{t('taxNumberEtaRegistration')}</Label>
                    <Input
                      id="customerTaxNumber"
                      placeholder={t('egyptianTaxAuthorityPlaceholder')}
                      {...form.register('customer.taxNumber')}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('requiredForEtaPortal')}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">{t('email')}</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      {...form.register('customer.email')}
                    />
                    {form.formState.errors.customer?.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.customer.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="customerAddress">{t('address')}</Label>
                    <Textarea
                      id="customerAddress"
                      placeholder={t('addressPlaceholder')}
                      {...form.register('customer.address')}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleCustomerCreation)}
                    disabled={createCustomerMutation.isPending}
                  >
                    {createCustomerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
{t('saveCustomer')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('invoiceItems')}</CardTitle>
            <CardDescription>
              {t('addProductsToInvoice')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between items-center mb-4`}>
              <div className={`flex ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} gap-3`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProductRow}
                >
                  <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('addItem')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuotationSelector(true)}
                >
                  <FileText className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('selectFromQuotations')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowOrderSelector(true)}
                >
                  <Package className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('selectFromOrderHistory')}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPrintPreview(true)}
              >
                <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {t('printPreview')}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">{t('product')}</TableHead>
                    <TableHead className="w-[120px]">{t('category')}</TableHead>
                    <TableHead className="w-[100px]">{t('batchNo')}</TableHead>
                    <TableHead className="w-[120px]">{t('gs1Code')}</TableHead>
                    <TableHead className="w-[80px]">{t('type')}</TableHead>
                    <TableHead className="w-[120px]">{t('grade')}</TableHead>
                    <TableHead className={`w-[100px] ${isRTL ? 'text-left' : 'text-right'}`}>{t('quantity')}</TableHead>
                    <TableHead className="w-[80px] text-center">UoM</TableHead>
                    <TableHead className={`w-[120px] ${isRTL ? 'text-left' : 'text-right'}`}>{t('unitPrice')}</TableHead>
                    <TableHead className={`w-[120px] ${isRTL ? 'text-left' : 'text-right'}`}>{t('total')}</TableHead>
                    <TableHead className="w-[60px]">{t('action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Popover 
                          open={openProductPopovers[index]} 
                          onOpenChange={(isOpen) => {
                            setOpenProductPopovers(prev => ({
                              ...prev,
                              [index]: isOpen
                            }));
                            // Clear search term when opening popover
                            if (isOpen) {
                              setProductSearchTerm('');
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={`w-full justify-between ${isRTL ? 'text-right' : 'text-left'}`}
                            >
                              <span className="truncate">
                                {form.watch(`items.${index}.productName`) || t('selectProduct')}
                              </span>
                              <ChevronsUpDown className={`${isRTL ? 'mr-2' : 'ml-2'} h-4 w-4 shrink-0 opacity-50`} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput 
                                placeholder={t('searchProducts')} 
                                value={productSearchTerm}
                                onValueChange={setProductSearchTerm}
                                className="h-9" 
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <p className="py-3 text-center text-sm">{t('noProductsFound')}</p>
                                </CommandEmpty>
                                <CommandGroup heading={t('products')}>
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      onSelect={() => handleProductSelection(product.id, index)}
                                      className="flex flex-col items-start py-2"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex-1">
                                          <div className="font-medium">{product.name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {categories.find(c => c.id === product.categoryId)?.name || t('noCategory')} • {product.sku || t('noSku')} • {product.barcode || t('noBarcode')}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-medium">
                                            {new Intl.NumberFormat('en-US', {
                                              style: 'currency',
                                              currency: financialPrefs.baseCurrency || 'USD'
                                            }).format(product.sellingPrice)}
                                          </div>
                                          <Check
                                            className={cn(
                                              "h-4 w-4 mt-1",
                                              field.productId === product.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{form.watch(`items.${index}.category`) || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{form.watch(`items.${index}.batchNo`) || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{form.watch(`items.${index}.gs1Code`) || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{form.watch(`items.${index}.type`) || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <select
                          value={form.watch(`items.${index}.grade`) || 'P'}
                          onChange={(e) => form.setValue(`items.${index}.grade`, e.target.value)}
                          className="w-16 h-8 px-2 text-sm font-bold text-center border border-gray-300 rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          <option value="P">(P)</option>
                          <option value="F">(F)</option>
                          <option value="T">(T)</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="1"
                          className="w-20 text-right ml-auto"
                          {...form.register(`items.${index}.quantity`, { 
                            valueAsNumber: true,
                            onChange: (e) => {
                              const value = parseInt(e.target.value);
                              if (value < 1) e.target.value = "1";
                            }
                          })}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          {form.watch(`items.${index}.unitOfMeasure`) || form.watch(`items.${index}.uom`) || 'Pcs'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 text-right ml-auto"
                          {...form.register(`items.${index}.unitPrice`, { 
                            valueAsNumber: true 
                          })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: financialPrefs.baseCurrency || 'USD'
                          }).format(form.watch(`items.${index}.total`) || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={false}
                          onClick={(e) => {
                            e.preventDefault();
                            console.log(`🗑️ DELETE: Attempting to remove item at index ${index}, current fields length: ${fields.length}`);
                            if (fields.length > 1) {
                              remove(index);
                              console.log(`🗑️ DELETE SUCCESS: Removed item at index ${index}`);
                              toast({
                                title: "Item removed",
                                description: "Product item has been removed from the invoice.",
                              });
                            } else {
                              // If only one item, reset it instead of removing
                              form.setValue(`items.${index}.productId`, 0);
                              form.setValue(`items.${index}.productName`, '');
                              form.setValue(`items.${index}.category`, '');
                              form.setValue(`items.${index}.batchNo`, '');
                              form.setValue(`items.${index}.gs1Code`, '');
                              form.setValue(`items.${index}.type`, '');
                              form.setValue(`items.${index}.quantity`, 1);
                              form.setValue(`items.${index}.unitPrice`, 0);
                              form.setValue(`items.${index}.total`, 0);
                              console.log(`🗑️ RESET: Reset the last remaining item at index ${index}`);
                              toast({
                                title: "Item cleared",
                                description: "The last item has been cleared. At least one item row is required.",
                              });
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {fields.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-4">
                        {t('noItemsAdded')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {fields.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProductRow}
                  className="mt-4"
                >
                  <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('addAnotherItem')}
                </Button>
              )}
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="font-medium">{t('paymentDetails')}</h3>
                <div>
                  <Label htmlFor="paymentStatus">{t('paymentStatus')}</Label>
                  <Select
                    value={form.watch('paymentStatus')}
                    onValueChange={(value) => form.setValue('paymentStatus', value as 'paid' | 'unpaid' | 'partial')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectPaymentStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">{t('paid')}</SelectItem>
                      <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                      <SelectItem value="partial">{t('partialPayment')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {form.watch('paymentStatus') !== 'unpaid' && (
                  <div>
                    <Label htmlFor="paymentMethod">{t('paymentMethod')}</Label>
                    <Select
                      value={form.watch('paymentMethod') || ''}
                      onValueChange={(value) => form.setValue('paymentMethod', value as any)}
                    >
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder={t('selectPaymentMethod')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t('cash')}</SelectItem>
                        <SelectItem value="visa">{t('visa')}</SelectItem>
                        <SelectItem value="cheque">{t('cheque')}</SelectItem>
                        <SelectItem value="bank_transfer">{t('bankTransfer')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {(form.watch('paymentMethod') === 'cheque' || form.watch('paymentMethod') === 'bank_transfer') && (
                  <div>
                    <Label htmlFor="paymentProof">
                      {t('uploadDocument').replace('{type}', form.watch('paymentMethod') === 'cheque' ? t('cheque') : t('bankTransfer'))}
                    </Label>
                    <Input
                      id="paymentProof"
                      type="file"
                      className="mt-1"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          form.setValue('paymentProofFile', e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="paymentTerms">{t('paymentTermsDays')}</Label>
                  <Select
                    value={form.watch('paymentTerms')}
                    onValueChange={(value) => form.setValue('paymentTerms', value)}
                  >
                    <SelectTrigger id="paymentTerms">
                      <SelectValue placeholder={t('selectPaymentTerms')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('dueImmediately')}</SelectItem>
                      <SelectItem value="7">{t('net7')}</SelectItem>
                      <SelectItem value="15">{t('net15')}</SelectItem>
                      <SelectItem value="30">{t('net30')}</SelectItem>
                      <SelectItem value="60">{t('net60')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {form.watch('paymentStatus') === 'partial' && (
                  <div>
                    <Label htmlFor="amountPaid">{t('amountPaid')}</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      min="0"
                      step="0.01"
                      {...form.register('amountPaid', { valueAsNumber: true })}
                    />
                  </div>
                )}
              </div>
              
              {/* Order Summary */}
              <div>
                <h3 className="font-medium mb-4">{t('orderSummary')}</h3>
                <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 text-sm py-2">
                    <span>{t('subtotal')}</span>
                    <span className={`${isRTL ? 'text-left' : 'text-right'} font-medium`}>{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: financialPrefs.baseCurrency || 'USD'
                    }).format(form.watch('subtotal') || 0)}</span>
                  </div>
                  
                  {/* Discount Section */}
                  <div className="grid grid-cols-2 gap-2 items-center border-b pb-2">
                    <Label htmlFor="discountType" className="text-sm">{t('discount')}</Label>
                    <div className={`flex ${isRTL ? 'justify-start space-x-reverse' : 'justify-end'} space-x-2`}>
                      <Select
                        value={form.watch('discountType')}
                        onValueChange={(value) => form.setValue('discountType', value as 'none' | 'percentage' | 'amount')}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder={t('type')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('none')}</SelectItem>
                          <SelectItem value="percentage">{t('percentage')}</SelectItem>
                          <SelectItem value="amount">{t('amount')}</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {form.watch('discountType') !== 'none' && (
                        <Input
                          type="number"
                          min="0"
                          step={form.watch('discountType') === 'percentage' ? '1' : '0.01'}
                          max={form.watch('discountType') === 'percentage' ? '100' : undefined}
                          className="w-20 text-right"
                          {...form.register('discountValue', { 
                            valueAsNumber: true,
                            onChange: (e) => {
                              if (form.watch('discountType') === 'percentage' && parseFloat(e.target.value) > 100) {
                                e.target.value = "100";
                              }
                            }
                          })}
                        />
                      )}
                    </div>
                  </div>
                  
                  {form.watch('discountType') !== 'none' && form.watch('discountAmount') > 0 && (
                    <div className="grid grid-cols-2 text-sm py-2">
                      <span>{t('discount')} {form.watch('discountType') === 'percentage' ? 
                        `(${form.watch('discountValue')}%)` : t('amount')}</span>
                      <span className={`${isRTL ? 'text-left' : 'text-right'} font-medium text-green-600`}>-{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: financialPrefs.baseCurrency || 'USD'
                      }).format(form.watch('discountAmount') || 0)}</span>
                    </div>
                  )}
                  
                  {/* Subtotal after discount shown only if discount applied */}
                  {form.watch('discountType') !== 'none' && form.watch('discountAmount') > 0 && (
                    <div className="grid grid-cols-2 text-sm py-2 border-b pb-2">
                      <span>{t('subtotalAfterDiscount')}</span>
                      <span className={`${isRTL ? 'text-left' : 'text-right'} font-medium`}>{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: financialPrefs.baseCurrency || 'USD'
                      }).format((form.watch('subtotal') || 0) - (form.watch('discountAmount') || 0))}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 items-center border-b pb-2">
                    <Label htmlFor="taxRate" className="text-sm">{t('taxRate')}</Label>
                    <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className={`w-20 ${isRTL ? 'text-left' : 'text-right'}`}
                        {...form.register('taxRate', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 text-sm py-2">
                    <span>{t('taxAmount')}</span>
                    <span className={`${isRTL ? 'text-left' : 'text-right'} font-medium`}>{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: financialPrefs.baseCurrency || 'USD'
                    }).format(form.watch('taxAmount') || 0)}</span>
                  </div>

                  {/* VAT Rate Input */}
                  <div className="grid grid-cols-2 gap-2 items-center border-b pb-2">
                    <Label htmlFor="vatRate" className="text-sm">{t('vatRate')}</Label>
                    <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                      <Input
                        id="vatRate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className={`w-20 ${isRTL ? 'text-left' : 'text-right'}`}
                        {...form.register('vatRate', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  {/* VAT Amount Display */}
                  <div className="grid grid-cols-2 text-sm py-2">
                    <span>{t('vatAmount')}</span>
                    <span className={`${isRTL ? 'text-left' : 'text-right'} font-medium text-blue-600`}>{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: financialPrefs.baseCurrency || 'USD'
                    }).format(form.watch('vatAmount') || 0)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 py-2">
                    <span className="font-semibold">{t('total')}</span>
                    <span className={`${isRTL ? 'text-left' : 'text-right'} font-bold text-lg`}>{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: financialPrefs.baseCurrency || 'USD'
                    }).format(form.watch('grandTotal') || 0)}</span>
                  </div>
                  
                  {form.watch('paymentStatus') === 'partial' && (
                    <>
                      <div className="grid grid-cols-2 text-sm py-2">
                        <span>{t('amountPaid')}</span>
                        <span className={`${isRTL ? 'text-left' : 'text-right'} font-medium text-green-600`}>{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: financialPrefs.baseCurrency || 'USD'
                        }).format(form.watch('amountPaid') || 0)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 text-sm py-2">
                        <span>{t('balanceDue')}</span>
                        <span className={`${isRTL ? 'text-left' : 'text-right'} font-medium text-red-600`}>{new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: financialPrefs.baseCurrency || 'USD'
                        }).format((form.watch('grandTotal') || 0) - (form.watch('amountPaid') || 0))}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div className="mt-6">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                placeholder={t('additionalNotes')}
                className="min-h-[100px]"
                {...form.register('notes')}
              />
            </div>
          </CardContent>
          <CardFooter className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between`}>
            <Button variant="outline" onClick={() => window.history.back()} disabled={isSubmitting}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />}
              {t('createInvoiceButton')}
            </Button>
            <Button 
              type="button" 
              onClick={createInvoice} 
              disabled={isSubmitting}
              className="ml-2"
            >
              {isSubmitting && <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />}
              {t('createInvoiceButton')} (Direct)
            </Button>
          </CardFooter>
        </Card>
      </form>
      
      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('invoiceCreated')}</DialogTitle>
            <DialogDescription>
              {t('invoiceCreatedSuccessfully')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>{t('whatWouldYouLikeToDoNext')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => window.location.href = "/invoices"}>
              {t('viewAllInvoices')}
            </Button>
            <Button onClick={() => {
              setShowInvoicePreview(false);
              form.reset(getDefaultFormValues(financialPrefs));
            }}>
              {t('createAnotherInvoice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Draft Invoices Tab */}
        <TabsContent value="drafts" className="space-y-6">
          <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between items-center`}>
            <div>
              <h2 className="text-xl font-semibold">{t('draftInvoices')}</h2>
              <p className="text-muted-foreground">{t('manageYourSavedInvoiceDrafts')}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                // Clear all drafts
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i);
                  if (key && key.startsWith('invoice_draft_')) {
                    keysToRemove.push(key);
                  }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                setSavedDrafts([]);
                toast({
                  title: t('allDraftsCleared'),
                  description: t('allInvoiceDraftsHaveBeenDeleted'),
                });
              }}
              disabled={savedDrafts.length === 0}
            >
              <Trash className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t('clearAllDrafts')}
            </Button>
          </div>

          {savedDrafts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('noDraftInvoices')}</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {t('youHaventSavedAnyInvoiceDrafts')}
                </p>
                <Button onClick={() => setMainTab("create")} variant="outline">
                  <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('createNewInvoice')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {savedDrafts.map((draft) => (
                <Card key={draft.key} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 mb-2`}>
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="font-medium">
                            {draft.customer?.name ? `${t('invoiceFor')} ${draft.customer.name}` : t('untitledInvoiceDraft')}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {t('draft')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                            <User className="w-4 h-4" />
                            <span>{draft.customer?.company || draft.customer?.name || t('noCustomerSelected')}</span>
                          </div>
                          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                            <Calendar className="w-4 h-4" />
                            <span>{t('saved')} {new Date(draft.savedAt).toLocaleDateString()}</span>
                          </div>
                          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                            <FileText className="w-4 h-4" />
                            <span>{draft.items?.length || 0} {t('items')}</span>
                          </div>
                        </div>
                        
                        {draft.items && draft.items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-green-600">
                              {t('total')}: {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: financialPrefs.baseCurrency || 'USD'
                              }).format(draft.grandTotal || 0)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex items-center ${isRTL ? 'space-x-reverse mr-4' : 'space-x-2 ml-4'}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadDraft(draft.key)}
                        >
                          <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                          {t('loadDraft')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDraft(draft.key)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Quotation Selector Dialog */}
      <Dialog open={showQuotationSelector} onOpenChange={setShowQuotationSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('selectFromQuotations')}</DialogTitle>
            <DialogDescription>
              {t('chooseQuotationToImport')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {quotations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('noQuotationsFound')}</h3>
                <p className="text-muted-foreground">
                  {t('noQuotationsAvailable')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quotations.map((quotation) => (
                  <Card key={quotation.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleQuotationSelection(quotation)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium">{quotation.quotationNumber}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              quotation.status === 'approved' ? 'bg-green-100 text-green-800' :
                              quotation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {t(quotation.status)}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{quotation.customerName || t('noCustomer')}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(quotation.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>{quotation.items?.length || 0} {t('items')}</span>
                              </div>
                            </div>
                          </div>
                          
                          {quotation.items && quotation.items.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-blue-600">
                                {t('total')}: {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: financialPrefs.baseCurrency || 'USD'
                                }).format(quotation.total || quotation.amount || 0)}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <Button variant="outline" size="sm">
                          {t('import')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuotationSelector(false)}>
              {t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Order Selector Dialog */}
      <Dialog open={showOrderSelector} onOpenChange={setShowOrderSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('selectFromOrderHistory')}</DialogTitle>
            <DialogDescription>
              {t('chooseCompletedOrder')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('noOrdersFound')}</h3>
                <p className="text-muted-foreground">
                  {t('noCompletedOrdersAvailable')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleOrderSelection(order)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div>
                              <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">
                                {order.targetProduct}
                              </p>
                            </div>
                            <div className="ml-auto flex items-center space-x-2">
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                order.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {t(order.status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{order.customerName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4" />
                                <span>{t('batch')}: {order.batchNumber}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm font-medium text-green-600">
                              {t('revenue')}: {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: financialPrefs.baseCurrency || 'USD'
                              }).format(order.revenue || order.totalCost || 0)}
                            </p>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          {t('import')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderSelector(false)}>
              {t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{t('invoicePreview')}</span>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={!printRef.current}
                >
                  <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('print')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePDF}
                  disabled={isGeneratingPDF || !printRef.current}
                >
                  {isGeneratingPDF ? (
                    <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                  ) : (
                    <Download className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  )}
                  {isGeneratingPDF ? t('generating') : t('downloadPDF')}
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('previewInvoiceBeforePrinting')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-white">
            <div ref={printRef} className="p-6">
              <div className="max-w-4xl mx-auto bg-white shadow-sm border rounded-lg overflow-hidden">
                {/* Professional Header matching the provided design */}
                <div className="bg-white border-b p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      {/* Company Logo/Icon */}
                      <div className="flex-shrink-0">
                        <img 
                          src="/attached_assets/P_1749320448134.png" 
                          alt="Premier ERP Logo" 
                          className="w-16 h-16 object-contain rounded-lg"
                        />
                      </div>
                      {/* Company Info */}
                      <div>
                        <h1 className="text-2xl font-bold text-blue-600 mb-1">Morgan Chemical</h1>
                        <p className="text-gray-600 text-sm mb-2">Enterprise Resource Planning System</p>
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <p>123 Business District</p>
                          <p>Cairo, Egypt 11511</p>
                          <p>Phone: +20 2 1234 5678</p>
                          <p>Email: info@premieregypt.com</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Invoice Details */}
                    <div className="text-right">
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h2>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-semibold text-gray-800">Invoice Number: </span>
                          <span>{createdInvoiceData?.invoiceNumber || `INV-${String(new Date().getMonth() + 1).padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}${String(getCurrentDraft()?.name?.replace('draft-', '') || activeInvoiceId.replace('draft-', '') || '01').padStart(2, '0')}`}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">Paper Invoice Number: </span>
                          <span>{form.watch('paperInvoiceNumber') || '23423'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">Approval No.: </span>
                          <span>{form.watch('approvalNumber') || '12312312'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800">Date: </span>
                          <span>{new Date().toLocaleDateString('en-GB')}</span>
                        </div>
                        
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Bill To Section - Professional Card Design */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Bill To:</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 mb-2">
                          {createdInvoiceData?.customer?.name || form.watch('customer.name') || 'Cairo Medical Center'}
                        </h4>
                        
                        <div className="flex space-x-2 mb-3">
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            Code: CUST-{String(createdInvoiceData?.customer?.id || form.watch('customer.id') || '0001').padStart(4, '0')}
                          </div>
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            Mobile: {createdInvoiceData?.customer?.phone || form.watch('customer.phone') || '+20 2 2222 3333'}
                          </div>
                        </div>

                        {(createdInvoiceData?.customer?.company || form.watch('customer.company')) && (
                          <p className="text-gray-600 text-sm mb-2">
                            {createdInvoiceData?.customer?.company || form.watch('customer.company')}
                          </p>
                        )}
                        {(createdInvoiceData?.customer?.address || form.watch('customer.address')) && (
                          <p className="text-gray-600 text-sm">
                            {createdInvoiceData?.customer?.address || form.watch('customer.address')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Invoice Date:</span>
                        <p className="text-gray-900">{new Date().toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Due Date:</span>
                        <p className="text-gray-900">{new Date(Date.now() + (parseInt(form.watch('paymentTerms') || '0') * 24 * 60 * 60 * 1000)).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Payment Terms:</span>
                        <p className="text-gray-900">{(createdInvoiceData?.paymentTerms || form.watch('paymentTerms')) === '0' ? 'Due Immediately' : `Net ${createdInvoiceData?.paymentTerms || form.watch('paymentTerms')} Days`}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-bold text-black" style={{width: '30%'}}>Item Description</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-bold text-black" style={{width: '12%'}}>Category</th>
                          <th className="border border-gray-300 px-3 py-2 text-left text-sm font-bold text-black" style={{width: '10%'}}>Batch No.</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm font-bold text-black" style={{width: '8%'}}>Grade</th>
                          <th className="border border-gray-300 px-3 py-2 text-center text-sm font-bold text-black" style={{width: '8%'}}>Qty</th>
                          <th className="border border-gray-300 px-3 py-2 text-right text-sm font-bold text-black" style={{width: '16%'}}>Unit Price</th>
                          <th className="border border-gray-300 px-3 py-2 text-right text-sm font-bold text-black" style={{width: '16%'}}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(createdInvoiceData?.items || form.watch('items')).map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-2">
                              <p className="font-medium text-gray-900 text-sm break-words" style={{wordWrap: 'break-word', hyphens: 'auto'}}>{item.productName || item.name || 'No Product Name'}</p>
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-gray-900 text-sm">{item.category || 'Category null'}</td>
                            <td className="border border-gray-300 px-3 py-2 text-gray-900 text-sm">{item.batchNo || '-'}</td>
                            <td className="border border-gray-300 px-3 py-2 text-center text-gray-900 text-sm font-bold">({item.grade || 'P'})</td>
                            <td className="border border-gray-300 px-3 py-2 text-center text-gray-900 text-sm">{item.quantity || 0}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right text-gray-900 text-sm">{formatCurrency(item.unitPrice || 0)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-900 text-sm">{formatCurrency(item.total || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Section */}
                  <div className="flex justify-end">
                    <div className="w-80">
                      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                          <span className="font-medium">Subtotal:</span>
                          <span className="font-medium">EGP {(createdInvoiceData?.subtotal || form.watch('subtotal') || 0).toFixed(2)}</span>
                        </div>
                        
                        {(createdInvoiceData?.discountAmount || form.watch('discountAmount')) > 0 && (
                          <div className="flex justify-between text-green-600 border-b border-gray-200 pb-2">
                            <span className="font-medium">Discount:</span>
                            <span className="font-medium">-EGP {(createdInvoiceData?.discountAmount || form.watch('discountAmount') || 0).toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                          <span className="font-medium">Tax ({createdInvoiceData?.taxRate || form.watch('taxRate') || 14}%):</span>
                          <span className="font-medium">EGP {(createdInvoiceData?.taxAmount || form.watch('taxAmount') || 0).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                          <span className="font-medium">VAT ({createdInvoiceData?.vatRate || form.watch('vatRate') || 14}%):</span>
                          <span className="font-medium">EGP {(createdInvoiceData?.vatAmount || form.watch('vatAmount') || 0).toFixed(2)}</span>
                        </div>
                        
                        <div className="bg-blue-600 text-white rounded p-3 -m-1">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount:</span>
                            <span>EGP {(createdInvoiceData?.grandTotal || form.watch('grandTotal') || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        {(createdInvoiceData?.paymentStatus || form.watch('paymentStatus')) === 'partial' && (
                          <div className="border-t border-gray-200 pt-3 space-y-2">
                            <div className="flex justify-between text-green-600">
                              <span className="font-medium">Amount Paid:</span>
                              <span className="font-medium">EGP {(createdInvoiceData?.amountPaid || form.watch('amountPaid') || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-600 font-semibold">
                              <span>Balance Due:</span>
                              <span>EGP {((createdInvoiceData?.grandTotal || form.watch('grandTotal') || 0) - (createdInvoiceData?.amountPaid || form.watch('amountPaid') || 0)).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(createdInvoiceData?.notes || form.watch('notes')) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                      <p className="text-sm text-gray-700">{createdInvoiceData?.notes || form.watch('notes')}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-center text-sm text-gray-500 border-t pt-4 mt-8 space-y-2">
                    <p className="font-medium">Thank you for your business!</p>
                    <p>This invoice was generated on {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour12: false })}</p>
                    <p>For any questions regarding this invoice, please contact us at info@morganerp.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowInvoicePreview(false);
              setCreatedInvoiceData(null);
            }}>
              {t('closePreview')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-4xl h-[90vh] overflow-hidden flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{t('printPreview')}</span>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const printContent = document.getElementById('print-content');
                    if (printContent) {
                      const newWindow = window.open('', '_blank');
                      if (newWindow) {
                        newWindow.document.write(`
                          <html>
                            <head>
                              <title>${t('invoice')} ${t('print')}</title>
                              <style>
                                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                                .printable-invoice { max-width: none; margin: 0; }
                                @media print {
                                  body { margin: 0; padding: 0; }
                                  @page { margin: 0.5in; }
                                }
                              </style>
                            </head>
                            <body>
                              ${printContent.innerHTML}
                            </body>
                          </html>
                        `);
                        newWindow.document.close();
                        newWindow.print();
                        newWindow.close();
                      }
                    }
                  }}
                >
                  <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('print')}
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              {t('previewBeforePrinting')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto border rounded-md bg-gray-50 p-4">
            <div id="print-content">
              <div className="printable-invoice bg-white p-8 max-w-4xl mx-auto text-black">
                {/* Header - Professional Design Matching Image */}
                <div className="flex justify-between items-start mb-8 border-b pb-6">
                  <div className="flex items-start space-x-4">
                    {/* Company Logo/Icon */}
                    <div className="flex-shrink-0">
                      <img 
                        src="/attached_assets/P_1749320448134.png" 
                        alt="Premier ERP Logo" 
                        className="w-16 h-16 object-contain rounded-lg"
                      />
                    </div>
                    {/* Company Info */}
                    <div className="company-info">
                      <h1 className="text-2xl font-bold text-blue-600 mb-1">Premier ERP</h1>
                      <p className="text-gray-600 text-sm mb-2">Enterprise Resource Planning System</p>
                      <div className="text-sm text-gray-600 space-y-0.5">
                        <p>123 Business District</p>
                        <p>Cairo, Egypt 11511</p>
                        <p>Phone: +20 2 1234 5678</p>
                        <p>Email: info@premieregypt.com</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="invoice-header text-right">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h2>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-semibold text-gray-800">Invoice Number: </span>
                        <span>INV-{getCurrentDraft()?.name || activeInvoiceId}-{new Date().getFullYear()}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Paper Invoice Number: </span>
                        <span>{form.watch('paperInvoiceNumber') || '23423'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Approval No.: </span>
                        <span>{form.watch('approvalNumber') || '12312312'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">Date: </span>
                        <span>{new Date().toLocaleDateString('en-GB')}</span>
                      </div>
                      
                    </div>
                  </div>
                </div>

                {/* Customer Information - Professional Card Design */}
                <div className="customer-info mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">
                        {form.watch('customer.name') || 'Cairo Medical Center'}
                      </h4>
                      
                      <div className="flex space-x-2 mb-3">
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          Code: CUST-{String(form.watch('customer.id') || '0001').padStart(4, '0')}
                        </div>
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          Mobile: {form.watch('customer.phone') || '+20 2 2222 3333'}
                        </div>
                      </div>

                      {form.watch('customer.company') && (
                        <p className="text-gray-600 text-sm mb-2">
                          {form.watch('customer.company')}
                        </p>
                      )}
                      {form.watch('customer.address') && (
                        <p className="text-gray-600 text-sm">
                          {form.watch('customer.address')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="items-table mb-8">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left font-bold text-black" style={{width: '30%'}}>Item Description</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-bold text-black" style={{width: '12%'}}>Category</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-bold text-black" style={{width: '10%'}}>Batch No.</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-bold text-black" style={{width: '8%'}}>Grade</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-bold text-black" style={{width: '8%'}}>Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-bold text-black" style={{width: '16%'}}>Unit Price</th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-bold text-black" style={{width: '16%'}}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.watch('items').map((item: any, index: number) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-3 py-2 text-sm break-words" style={{wordWrap: 'break-word', maxWidth: '0'}}>{item.productName || item.name || 'No Product Name'}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.category || 'Category null'}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.batchNo || ''}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm font-bold">({item.grade || 'P'})</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.quantity || 0}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm">EGP {(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm">EGP {(item.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="summary flex justify-end mb-8">
                  <div className="w-80">
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-medium">EGP {(form.watch('subtotal') || 0).toFixed(2)}</span>
                      </div>
                      {form.watch('discountAmount') > 0 && (
                        <div className="flex justify-between text-green-600 border-b border-gray-200 pb-2">
                          <span className="font-medium">Discount:</span>
                          <span className="font-medium">-EGP {(form.watch('discountAmount') || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                        <span className="font-medium">Tax ({form.watch('taxRate') || 14}%):</span>
                        <span className="font-medium">EGP {(form.watch('taxAmount') || 0).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                        <span className="font-medium">VAT ({form.watch('vatRate') || 14}%):</span>
                        <span className="font-medium">EGP {(form.watch('vatAmount') || 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-blue-600 text-white rounded p-3 -m-1">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Amount:</span>
                          <span>EGP {(form.watch('grandTotal') || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      {form.watch('paymentStatus') === 'partial' && (
                        <div className="border-t border-gray-200 pt-3 space-y-2">
                          <div className="flex justify-between text-green-600">
                            <span className="font-medium">Amount Paid:</span>
                            <span className="font-medium">EGP {(form.watch('amountPaid') || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-red-600 font-semibold">
                            <span>Balance Due:</span>
                            <span>EGP {((form.watch('grandTotal') || 0) - (form.watch('amountPaid') || 0)).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {form.watch('notes') && (
                  <div className="notes mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Notes:</h3>
                    <div className="bg-gray-50 p-4 rounded border">
                      <p className="text-sm">{form.watch('notes')}</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="footer text-center text-sm text-gray-600 border-t pt-4 space-y-2">
                  <p className="font-medium">Thank you for your business!</p>
                  <p>This invoice was generated on {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour12: false })}</p>
                  <p>For any questions regarding this invoice, please contact us at info@morganerp.com</p>
                  <p className="mt-3">Payment Terms: {form.watch('paymentTerms') === '0' ? 'Due Immediately' : `Net ${form.watch('paymentTerms')} Days`}</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
              {t('closePreview')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateInvoice;