import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import CustomerSearch from '@/components/orders/CustomerSearch';
import ProductSearch from '@/components/orders/ProductSearch';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Factory, 
  TestTube, 
  Package,
  Calendar,
  User,
  DollarSign,
  Eye,
  Save,
  Send,
  ArrowLeft,
  Calculator,
  Info,
  Truck,
  Edit,
  MessageCircle,
  Mail,
  ChevronDown
} from 'lucide-react';
import { PrintableQuotation } from '@/components/PrintableQuotation';
import { apiRequest } from '@/lib/queryClient';
import jsPDF from 'jspdf';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuotationItem {
  id: string;
  type: 'manufacturing' | 'refining' | 'finished';
  productName: string;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  total: number;
  grade?: string; // P (Pharmaceutical), F (Food), T (Technical)
  specifications?: string;
  rawMaterials?: string[];
  processingTime?: number;
  qualityGrade?: string;
}

interface PackagingItem {
  id: string;
  type: string; // packaging type (e.g., 'bottles', 'boxes', 'bags')
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

interface Customer {
  id: number;
  name: string;
  company?: string;
  position?: string;
  email: string;
  phone: string;
  address: string;
  sector?: string;
  taxNumber?: string;
}

const CreateQuotation: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  
  // Form state
  const [quotationType, setQuotationType] = useState<'manufacturing' | 'refining' | 'finished'>('finished');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quotationNumber, setQuotationNumber] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  
  // Transportation fees state
  const [transportationFees, setTransportationFees] = useState(0);
  const [transportationType, setTransportationType] = useState('standard');
  const [transportationNotes, setTransportationNotes] = useState('');
  
  // Packaging state - keeping legacy for backward compatibility
  const [packagingFees, setPackagingFees] = useState(0);
  const [packagingType, setPackagingType] = useState('standard');
  const [packagingNotes, setPackagingNotes] = useState('');
  
  // New packaging items state
  const [packagingItems, setPackagingItems] = useState<PackagingItem[]>([]);
  const [newPackagingItem, setNewPackagingItem] = useState({
    type: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  });
  
  // VAT percentage state
  const [vatPercentage, setVatPercentage] = useState(14);
  
  // Terms and conditions state
  const [termsAndConditions, setTermsAndConditions] = useState(`1. Validity: This quotation is valid for 30 days from the date of issue.

2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.

3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.

4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.

5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.

6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.`);

  // Calculation functions
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = Number(item.total) || 0;
      return sum + itemTotal;
    }, 0);
  };
  
  const calculatePackagingTotal = () => {
    return packagingItems.reduce((total, item) => total + item.total, 0) + (packagingFees || 0);
  };
  
  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const transportFees = Number(transportationFees) || 0;
    const packagingFeesAmount = calculatePackagingTotal();
    const vatRate = Number(vatPercentage) || 0;
    return (subtotal + transportFees + packagingFeesAmount) * (vatRate / 100);
  };
  
  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const transportFees = Number(transportationFees) || 0;
    const packagingFeesAmount = calculatePackagingTotal();
    const tax = calculateTax();
    return subtotal + transportFees + packagingFeesAmount + tax;
  };

  // Calculate totals for component use
  const subtotal = calculateSubtotal();
  const vatAmount = calculateTax();
  const grandTotal = calculateGrandTotal();

  // Item form for adding new items
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newItem, setNewItem] = useState<Partial<QuotationItem>>({
    type: quotationType,
    productName: '',
    description: '',
    quantity: 1,
    uom: 'kg',
    unitPrice: 0,
    grade: 'P', // Default to Pharmaceutical
    specifications: '',
    rawMaterials: [],
    processingTime: 0,
    qualityGrade: 'pharmaceutical'
  });

  // Create quotation mutation
  const createQuotationMutation = useMutation({
    mutationFn: async (quotationData: any) => {
      return apiRequest('POST', '/api/quotations', quotationData);
    },
    onSuccess: (response, variables) => {
      const action = variables.status;
      toast({
        title: "Success",
        description: `Quotation ${action === 'draft' ? 'saved as draft' : 'sent to customer'} successfully`
      });
      // Invalidate quotations cache
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      setLocation('/quotation-history');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save quotation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Generate quotation number on component mount
  useEffect(() => {
    const generateQuotationNumber = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const typePrefix = quotationType === 'manufacturing' ? 'MFG' : 
                        quotationType === 'refining' ? 'REF' : 'FPD';
      return `QUO-${typePrefix}-${year}${month}-${random}`;
    };
    
    setQuotationNumber(generateQuotationNumber());
  }, [quotationType]);

  // Set default valid until date (30 days from now)
  useEffect(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    setValidUntil(thirtyDaysFromNow.toISOString().split('T')[0]);
  }, []);

  // Fetch real products from database for different quotation types
  const { data: manufacturingProducts = [], isLoading: isLoadingManufacturing } = useQuery({
    queryKey: ['/api/products'],
    select: (products: any[]) => products
      .filter(product => product.productType === 'finished')
      .map(product => ({
        name: product.name,
        uom: product.unitOfMeasure || 'units',
        basePrice: parseFloat(product.sellingPrice) || 0
      }))
      .slice(0, 10) // Limit to 10 products
  });

  // Fetch semi-finished products for refining services
  const { data: refiningServices = [], isLoading: isLoadingRefining } = useQuery({
    queryKey: ['/api/products/semi-finished'],
    select: (semiProducts: any[]) => semiProducts.map(product => ({
      name: product.name,
      uom: product.unit || 'kg',
      basePrice: product.unitPrice || 0
    }))
  });

  // Fetch raw materials for finished products service
  const { data: finishedProducts = [], isLoading: isLoadingFinished } = useQuery({
    queryKey: ['/api/products/raw-materials'],
    select: (rawProducts: any[]) => rawProducts
      .filter(product => product.productType === 'finished')
      .map(product => ({
        name: product.name,
        uom: product.unitOfMeasure || 'units',
        basePrice: parseFloat(product.sellingPrice) || 0
      }))
      .slice(0, 8) // Limit to 8 products
  });

  const getProductList = () => {
    switch (quotationType) {
      case 'manufacturing': return manufacturingProducts;
      case 'refining': return refiningServices;
      case 'finished': return finishedProducts;
      default: return [];
    }
  };

  const addItem = () => {
    if (!newItem.productName || !newItem.quantity || !newItem.unitPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Ensure numerical values are properly converted
    const quantity = Number(newItem.quantity!);
    const unitPrice = Number(newItem.unitPrice!);
    const total = quantity * unitPrice;

    const item: QuotationItem = {
      id: Date.now().toString(),
      type: quotationType,
      productName: newItem.productName!,
      description: newItem.description || '',
      quantity: quantity,
      uom: newItem.uom!,
      unitPrice: unitPrice,
      total: total,
      grade: newItem.grade || 'P', // Ensure grade is included with default value
      specifications: newItem.specifications,
      rawMaterials: newItem.rawMaterials,
      processingTime: newItem.processingTime,
      qualityGrade: newItem.qualityGrade
    };

    setItems([...items, item]);
    setSelectedProduct(null);
    setNewItem({
      type: quotationType,
      productName: '',
      description: '',
      quantity: 1,
      uom: 'kg',
      unitPrice: 0,
      grade: 'P', // Default to Pharmaceutical
      specifications: '',
      rawMaterials: [],
      processingTime: 0,
      qualityGrade: 'pharmaceutical'
    });

    toast({
      title: "Success",
      description: "Item added to quotation"
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Success",
      description: "Item removed from quotation"
    });
  };

  const addPackagingItem = () => {
    if (!newPackagingItem.type || !newPackagingItem.quantity || !newPackagingItem.unitPrice) {
      toast({
        title: "Error",
        description: "Please fill in all required packaging fields",
        variant: "destructive"
      });
      return;
    }

    const quantity = Number(newPackagingItem.quantity);
    const unitPrice = Number(newPackagingItem.unitPrice);
    const total = quantity * unitPrice;

    const packagingItem: PackagingItem = {
      id: Date.now().toString(),
      type: newPackagingItem.type,
      description: newPackagingItem.description,
      quantity: quantity,
      unitPrice: unitPrice,
      total: total,
      notes: newPackagingItem.notes
    };

    setPackagingItems([...packagingItems, packagingItem]);
    setNewPackagingItem({
      type: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      notes: ''
    });

    toast({
      title: "Success",
      description: "Packaging item added to quotation"
    });
  };

  const removePackagingItem = (id: string) => {
    setPackagingItems(packagingItems.filter(item => item.id !== id));
    toast({
      title: "Success",
      description: "Packaging item removed from quotation"
    });
  };

  const handleSubmit = (action: 'draft' | 'send') => {
    console.log('handleSubmit called with action:', action);
    console.log('selectedCustomer:', selectedCustomer);
    console.log('items:', items);
    
    if (!selectedCustomer) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive"
      });
      return;
    }

    const quotationData = {
      quotationNumber,
      type: quotationType,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      validUntil,
      notes,
      items,
      packagingItems, // New packaging items array
      subtotal: calculateSubtotal(),
      transportationFees,
      transportationType,
      transportationNotes,
      packagingFees,
      packagingType,
      packagingNotes,
      tax: calculateTax(),
      total: calculateGrandTotal(),
      status: action === 'draft' ? 'draft' : 'sent',
      date: new Date().toISOString(),
      termsAndConditions
    };

    console.log('Quotation data to submit:', quotationData);
    createQuotationMutation.mutate(quotationData);
  };

  const getQuotationTypeIcon = (type: string) => {
    switch (type) {
      case 'manufacturing': return <Factory className="h-5 w-5" />;
      case 'refining': return <TestTube className="h-5 w-5" />;
      case 'finished': return <Package className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getQuotationTypeDescription = (type: string) => {
    switch (type) {
      case 'manufacturing': return 'Manufacturing Services';
      case 'refining': return 'Refining & Processing';
      case 'finished': return 'Finished Products';
      default: return 'Pharmaceutical Services';
    }
  };

  const getTransportationTypeLabel = (type?: string) => {
    switch (type) {
      case 'standard': return 'Standard Delivery (3-5 days)';
      case 'express': return 'Express Delivery (1-2 days)';
      case 'cold-chain': return 'Cold Chain Transport (Temperature Controlled)';
      case 'hazmat': return 'Hazardous Materials Transport';
      case 'international': return 'International Shipping';
      case 'pickup': return 'Customer Pickup';
      case 'custom': return 'Custom Transportation';
      default: return 'Standard Delivery';
    }
  };

  const getQuotationTypeLabel = (type: string) => {
    switch (type) {
      case 'manufacturing': return 'Manufacturing Services';
      case 'refining': return 'Refining & Processing';
      case 'finished': return 'Finished Products';
      default: return 'Pharmaceutical Services';
    }
  };

  // Clean HTML2Canvas PDF Generation Function
  const generateQuotationPDF = async (): Promise<void> => {
    try {
      console.log('🎯 GENERATING PDF FROM PREVIEW COMPONENT');
      
      // Get the preview element
      const previewElement = document.querySelector('.printable-quotation') as HTMLElement;
      if (!previewElement) {
        toast({
          title: "Error",
          description: "Preview not found. Please ensure the preview is visible.",
          variant: "destructive"
        });
        return;
      }

      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Please wait while we create your PDF..."
      });

      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      // Capture the preview as an image with high quality
      const canvas = await html2canvas(previewElement, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: previewElement.scrollWidth,
        height: previewElement.scrollHeight
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit the page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      // If content is longer than one page, add additional pages
      if (imgHeight > pageHeight - 20) {
        let remainingHeight = imgHeight - (pageHeight - 20);
        let currentY = -(pageHeight - 20);
        
        while (remainingHeight > 0) {
          pdf.addPage();
          const pageContentHeight = Math.min(remainingHeight, pageHeight - 20);
          pdf.addImage(imgData, 'PNG', 10, currentY, imgWidth, imgHeight);
          remainingHeight -= pageContentHeight;
          currentY -= (pageHeight - 20);
        }
      }

      // Generate filename
      const filename = `quotation-${quotationNumber || 'draft'}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download the PDF
      pdf.save(filename);

      // Success message
      toast({
        title: "Success",
        description: `PDF downloaded: ${filename}`
      });

      console.log('✅ PDF generated successfully using html2canvas approach');
      
    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/quotation-history')}>
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('createQuotation')}</h1>
            <p className="text-muted-foreground">{t('generateProfessionalQuotations')}</p>
          </div>
        </div>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('preview')}
          </Button>
          <Button variant="outline" onClick={() => handleSubmit('draft')}>
            <Save className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('saveDraft')}
          </Button>
          <Button onClick={() => handleSubmit('send')}>
            <Send className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {t('sendQuotation')}
          </Button>
        </div>
      </div>

      {/* Tabs for Draft Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">{t('createNew')}</TabsTrigger>
          <TabsTrigger value="drafts">{t('draftQuotations')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quotation Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('quotationType')}</CardTitle>
              <CardDescription>{t('selectTypeOfService')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['manufacturing', 'refining', 'finished'].map((type) => (
                  <Card 
                    key={type}
                    className={`cursor-pointer transition-all ${
                      quotationType === type ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setQuotationType(type as any);
                      setItems([]); // Clear items when changing type
                      setNewItem({
                        ...newItem,
                        type: type as any,
                        productName: '',
                        unitPrice: 0
                      });
                    }}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        {getQuotationTypeIcon(type)}
                      </div>
                      <h3 className="font-semibold capitalize">{t(type)}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getQuotationTypeDescription(type)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('customerDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CustomerSearch
                    value={selectedCustomer}
                    onChange={setSelectedCustomer}
                  />
                </div>
                <div>
                  <Label>{t('quotationNumber')}</Label>
                  <Input value={quotationNumber} readOnly />
                </div>
                <div>
                  <Label>{t('validUntil')}</Label>
                  <Input 
                    type="date" 
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t('type')}</Label>
                  <div className="flex items-center gap-2 pt-2">
                    {getQuotationTypeIcon(quotationType)}
                    <Badge variant="secondary" className="capitalize">
                      {quotationType}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label>{t('notesAndSpecialInstructions')}</Label>
                <Textarea 
                  placeholder={t('addSpecialNotes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Items */}
          <Card>
            <CardHeader>
              <CardTitle>{t('addItems')}</CardTitle>
              <CardDescription>
                {t('addItemsToQuotation').replace('{type}', t(quotationType))}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <ProductSearch
                    value={selectedProduct}
                    onChange={(product) => {
                      setSelectedProduct(product);
                      setNewItem({
                        ...newItem,
                        productName: product?.name || '',
                        unitPrice: product?.sellingPrice || 0,
                        uom: product?.unitOfMeasure || 'kg'
                      });
                    }}
                    quotationType={quotationType}
                  />
                </div>
                <div>
                  <Label>{t('description')}</Label>
                  <Input 
                    placeholder={t('additionalDescription')}
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{t('quantity')}</Label>
                  <Input 
                    type="number"
                    min="1"
                    placeholder={t('enterQuantity')}
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>{t('unitOfMeasure')}</Label>
                  <Select 
                    value={newItem.uom}
                    onValueChange={(value) => setNewItem({...newItem, uom: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">{t('kilograms')}</SelectItem>
                      <SelectItem value="grams">{t('grams')}</SelectItem>
                      <SelectItem value="liters">{t('liters')}</SelectItem>
                      <SelectItem value="tablets">{t('tablets')}</SelectItem>
                      <SelectItem value="capsules">{t('capsules')}</SelectItem>
                      <SelectItem value="bottles">{t('bottles')}</SelectItem>
                      <SelectItem value="boxes">{t('boxes')}</SelectItem>
                      <SelectItem value="tubes">{t('tubes')}</SelectItem>
                      <SelectItem value="kits">{t('kits')}</SelectItem>
                      <SelectItem value="units">{t('units')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('unitPrice')}</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newItem.unitPrice || ''}
                    onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label>{t('grade')}</Label>
                  <Select 
                    value={newItem.grade}
                    onValueChange={(value) => setNewItem({...newItem, grade: value})}
                  >
                    <SelectTrigger data-testid="select-grade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P">{t('pharmaceuticalGrade')}</SelectItem>
                      <SelectItem value="F">{t('foodGrade')}</SelectItem>
                      <SelectItem value="T">{t('technicalGrade')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('total')}</Label>
                  <Input 
                    value={`$${((newItem.quantity || 0) * (newItem.unitPrice || 0)).toFixed(2)}`}
                    readOnly
                  />
                </div>
              </div>

              {/* Additional fields based on quotation type */}
              {quotationType === 'manufacturing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('processingTime')}</Label>
                    <Input 
                      type="number"
                      min="1"
                      placeholder={t('enterProcessingDays')}
                      value={newItem.processingTime || ''}
                      onChange={(e) => setNewItem({...newItem, processingTime: Number(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>{t('qualityGrade')}</Label>
                    <Select 
                      value={newItem.qualityGrade}
                      onValueChange={(value) => setNewItem({...newItem, qualityGrade: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pharmaceutical">{t('pharmaceuticalGrade')}</SelectItem>
                        <SelectItem value="food">{t('foodGrade')}</SelectItem>
                        <SelectItem value="industrial">{t('industrialGrade')}</SelectItem>
                        <SelectItem value="research">{t('researchGrade')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {quotationType === 'refining' && (
                <div>
                  <Label>{t('specificationsRequirements')}</Label>
                  <Textarea 
                    placeholder={t('specifyPurityRequirements')}
                    value={newItem.specifications}
                    onChange={(e) => setNewItem({...newItem, specifications: e.target.value})}
                    rows={2}
                  />
                </div>
              )}

              <Button onClick={addItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {t('addItemToQuotation')}
              </Button>
            </CardContent>
          </Card>

          {/* Items List */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('quotationItems')}</CardTitle>
                <CardDescription>{items.length} {t('itemsAdded')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('item')}</TableHead>
                        <TableHead>{t('description')}</TableHead>
                        <TableHead className="text-center">{t('qty')}</TableHead>
                        <TableHead className="text-center">{t('uom')}</TableHead>
                        <TableHead className="text-center">{t('grade')}</TableHead>
                        <TableHead className="text-right">{t('unitPrice')}</TableHead>
                        <TableHead className="text-right">{t('total')}</TableHead>
                        <TableHead className="text-center">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.description}
                            {item.type === 'manufacturing' && item.processingTime && (
                              <div className="text-xs mt-1">
                                {t('processing')}: {item.processingTime} {t('days')} | {t('grade')}: {item.qualityGrade}
                              </div>
                            )}
                            {item.type === 'refining' && item.specifications && (
                              <div className="text-xs mt-1">
                                {t('specs')}: {item.specifications}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">{item.uom}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {item.grade === 'P' ? t('pharmaceuticalGrade') : 
                               item.grade === 'F' ? t('foodGrade') : 
                               item.grade === 'T' ? t('technicalGrade') : item.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Packaging */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('packagingMaterials')}
              </CardTitle>
              <CardDescription>
                {t('addPackagingSpecificationsCosts')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Packaging Item Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('packagingType')}</Label>
                  <Input 
                    placeholder="e.g., Bottles, Boxes, Bags"
                    value={newPackagingItem.type}
                    onChange={(e) => setNewPackagingItem({...newPackagingItem, type: e.target.value})}
                    data-testid="input-packaging-type"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input 
                    placeholder="Packaging description"
                    value={newPackagingItem.description}
                    onChange={(e) => setNewPackagingItem({...newPackagingItem, description: e.target.value})}
                    data-testid="input-packaging-description"
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={newPackagingItem.quantity}
                    onChange={(e) => setNewPackagingItem({...newPackagingItem, quantity: Number(e.target.value) || 1})}
                    data-testid="input-packaging-quantity"
                  />
                </div>
                <div>
                  <Label>Unit Price (EGP)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPackagingItem.unitPrice || ''}
                    onChange={(e) => setNewPackagingItem({...newPackagingItem, unitPrice: Number(e.target.value) || 0})}
                    placeholder="0.00"
                    data-testid="input-packaging-unit-price"
                  />
                </div>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Special packaging requirements or notes"
                  value={newPackagingItem.notes}
                  onChange={(e) => setNewPackagingItem({...newPackagingItem, notes: e.target.value})}
                  rows={2}
                  data-testid="textarea-packaging-notes"
                />
              </div>
              
              <Button 
                onClick={addPackagingItem} 
                className="w-full"
                data-testid="button-add-packaging"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Quotation
              </Button>
              
              {/* Packaging Items Table */}
              {packagingItems.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Added Packaging Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packagingItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.type}</p>
                              {item.notes && (
                                <p className="text-sm text-muted-foreground">{item.notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">EGP {item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">EGP {item.total.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removePackagingItem(item.id)}
                              data-testid={`button-remove-packaging-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transportation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {t('transportation')}
              </CardTitle>
              <CardDescription>
                {t('specifyTransportationRequirements')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('transportationType')}</Label>
                  <Select 
                    value={transportationType}
                    onValueChange={setTransportationType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Delivery (3-5 days)</SelectItem>
                      <SelectItem value="express">Express Delivery (1-2 days)</SelectItem>
                      <SelectItem value="cold-chain">Cold Chain Transport</SelectItem>
                      <SelectItem value="hazmat">Hazardous Materials Transport</SelectItem>
                      <SelectItem value="international">International Shipping</SelectItem>
                      <SelectItem value="pickup">Customer Pickup</SelectItem>
                      <SelectItem value="custom">Custom Transportation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('transportationCost')} (EGP)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={transportationFees || ''}
                    onChange={(e) => setTransportationFees(Number(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label>{t('transportationNotes')}</Label>
                <Textarea 
                  placeholder={t('addSpecialTransportationRequirements')}
                  value={transportationNotes}
                  onChange={(e) => setTransportationNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('termsAndConditions')}
              </CardTitle>
              <CardDescription>
                {t('defineContractualTerms')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                rows={8}
                placeholder={t('enterTermsAndConditions')}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('quotationSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCustomer && (
                <div className="text-sm">
                  <div className="font-medium">{selectedCustomer.company || selectedCustomer.name}</div>
                  <div className="text-muted-foreground">{selectedCustomer.email}</div>
                  <div className="text-muted-foreground">{selectedCustomer.phone}</div>
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('quotationType')}:</span>
                  <Badge variant="outline" className="capitalize">{quotationType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>{t('quotationNumber')}:</span>
                  <span className="font-mono text-xs">{quotationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('validUntil')}:</span>
                  <span>{validUntil}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('items')}:</span>
                  <span>{items.length}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Pricing Breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('subtotal')}:</span>
                  <span>EGP {subtotal.toFixed(2)}</span>
                </div>
                {transportationFees > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('transportation')}:</span>
                    <span>EGP {transportationFees.toFixed(2)}</span>
                  </div>
                )}
                {calculatePackagingTotal() > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('packaging')}:</span>
                    <span>EGP {calculatePackagingTotal().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT ({vatPercentage}%):</span>
                  <span>EGP {vatAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>{t('total')}:</span>
                  <span>EGP {grandTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <Label>{t('vatPercentage')} (%)</Label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={vatPercentage}
                  onChange={(e) => setVatPercentage(Number(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsPreviewOpen(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('previewQuotation')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleSubmit('draft')}
                disabled={!selectedCustomer || items.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                {t('saveDraft')}
              </Button>
              <Button 
                className="w-full justify-start"
                onClick={() => handleSubmit('send')}
                disabled={!selectedCustomer || items.length === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                {t('sendQuotation')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>
        
        <TabsContent value="drafts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('draftQuotations')}</CardTitle>
              <CardDescription>
                {t('manageAndEditSavedDrafts')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sample Draft Quotations */}
                <div className="space-y-3">
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Factory className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">QUOTE-MFG-2025-001</h4>
                            <p className="text-sm text-muted-foreground">Manufacturing - Cairo Pharmaceuticals</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last modified: 2 hours ago • 3 items • $12,450.00
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setActiveTab('create');
                              toast({
                                title: "Opening Editor",
                                description: "Loading QUOTE-MFG-2025-001 for editing...",
                              });
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setIsPreviewOpen(true);
                              toast({
                                title: "Preview Loading",
                                description: "Preparing quotation preview...",
                              });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm">
                                <Send className="h-3 w-3 mr-1" />
                                Send
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Sending via WhatsApp",
                                    description: "Opening WhatsApp with quotation QUOTE-MFG-2025-001...",
                                  });
                                  window.open('https://wa.me/?text=Hello! Please find our quotation QUOTE-MFG-2025-001 for Manufacturing services. Total amount: $12,450.00', '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Opening Email Client",
                                    description: "Preparing email with quotation QUOTE-MFG-2025-001...",
                                  });
                                  window.location.href = 'mailto:?subject=Quotation QUOTE-MFG-2025-001 - Manufacturing Services&body=Dear Client,%0A%0APlease find attached our quotation for Manufacturing services.%0A%0AQuotation Number: QUOTE-MFG-2025-001%0ATotal Amount: $12,450.00%0A%0ABest regards,%0AYour Pharmaceutical Team';
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                Send via Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete QUOTE-MFG-2025-001? This action cannot be undone.')) {
                                toast({
                                  title: "Draft Deleted",
                                  description: "QUOTE-MFG-2025-001 has been permanently deleted.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <TestTube className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">QUOTE-REF-2025-002</h4>
                            <p className="text-sm text-muted-foreground">Refining - Alexandria Pharma</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last modified: 1 day ago • 2 items • $8,750.00
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setActiveTab('create');
                              toast({
                                title: "Opening Editor",
                                description: "Loading QUOTE-REF-2025-002 for editing...",
                              });
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setIsPreviewOpen(true);
                              toast({
                                title: "Preview Loading",
                                description: "Preparing quotation preview...",
                              });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm">
                                <Send className="h-3 w-3 mr-1" />
                                Send
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Sending via WhatsApp",
                                    description: "Opening WhatsApp with quotation QUOTE-REF-2025-002...",
                                  });
                                  window.open('https://wa.me/?text=Hello! Please find our quotation QUOTE-REF-2025-002 for Refining services. Total amount: $8,750.00', '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Opening Email Client",
                                    description: "Preparing email with quotation QUOTE-REF-2025-002...",
                                  });
                                  window.location.href = 'mailto:?subject=Quotation QUOTE-REF-2025-002 - Refining Services&body=Dear Client,%0A%0APlease find attached our quotation for Refining services.%0A%0AQuotation Number: QUOTE-REF-2025-002%0ATotal Amount: $8,750.00%0A%0ABest regards,%0AYour Pharmaceutical Team';
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                Send via Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete QUOTE-REF-2025-002? This action cannot be undone.')) {
                                toast({
                                  title: "Draft Deleted",
                                  description: "QUOTE-REF-2025-002 has been permanently deleted.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Package className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">QUOTE-FIN-2025-003</h4>
                            <p className="text-sm text-muted-foreground">Finished Products - Giza Medical Supply</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Last modified: 3 days ago • 5 items • $15,200.00
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setActiveTab('create');
                              toast({
                                title: "Opening Editor",
                                description: "Loading QUOTE-FIN-2025-003 for editing...",
                              });
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setIsPreviewOpen(true);
                              toast({
                                title: "Preview Loading",
                                description: "Preparing quotation preview...",
                              });
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm">
                                <Send className="h-3 w-3 mr-1" />
                                Send
                                <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Sending via WhatsApp",
                                    description: "Opening WhatsApp with quotation QUOTE-FIN-2025-003...",
                                  });
                                  window.open('https://wa.me/?text=Hello! Please find our quotation QUOTE-FIN-2025-003 for Finished Products. Total amount: $15,200.00', '_blank');
                                }}
                              >
                                <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                                Send via WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  toast({
                                    title: "Opening Email Client",
                                    description: "Preparing email with quotation QUOTE-FIN-2025-003...",
                                  });
                                  window.location.href = 'mailto:?subject=Quotation QUOTE-FIN-2025-003 - Finished Products&body=Dear Client,%0A%0APlease find attached our quotation for Finished Products.%0A%0AQuotation Number: QUOTE-FIN-2025-003%0ATotal Amount: $15,200.00%0A%0ABest regards,%0AYour Pharmaceutical Team';
                                }}
                              >
                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                Send via Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete QUOTE-FIN-2025-003? This action cannot be undone.')) {
                                toast({
                                  title: "Draft Deleted",
                                  description: "QUOTE-FIN-2025-003 has been permanently deleted.",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* No drafts state */}
                {/* Uncomment this when there are no drafts */}
                {/*
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Draft Quotations</h3>
                  <p className="text-muted-foreground mb-4">
                    Start creating quotations and save them as drafts to see them here.
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Quotation
                  </Button>
                </div>
                */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t('quotationPreview')}</DialogTitle>
            <DialogDescription>
              {t('reviewQuotationBeforeSending')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {selectedCustomer ? (
              <PrintableQuotation
                quotationNumber={quotationNumber}
                date={new Date()}
                validUntil={validUntil}
                customer={{
                  id: selectedCustomer.id,
                  name: selectedCustomer.name,
                  company: selectedCustomer.company || '',
                  position: selectedCustomer.position || '',
                  email: selectedCustomer.email || '',
                  phone: selectedCustomer.phone || '',
                  address: selectedCustomer.address || '',
                  sector: selectedCustomer.sector || '',
                  taxNumber: selectedCustomer.taxNumber || '',
                }}
                items={items}
                packagingItems={packagingItems}
                subtotal={subtotal}
                transportationFees={transportationFees}
                packagingFees={packagingFees}
                vatPercentage={vatPercentage}
                vatAmount={vatAmount}
                grandTotal={grandTotal}
                notes={notes}
                transportationType={transportationType}
                transportationNotes={transportationNotes}
                packagingType={packagingType}
                packagingNotes={packagingNotes}
                quotationType={quotationType}
                termsAndConditions={termsAndConditions}
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('pleaseSelectCustomerToPreview')}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              {t('closePreview')}
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                await generateQuotationPDF();
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>

            <Button onClick={() => {
              setIsPreviewOpen(false);
              handleSubmit('send');
            }}>
              <Send className="mr-2 h-4 w-4" />
              Send Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateQuotation;