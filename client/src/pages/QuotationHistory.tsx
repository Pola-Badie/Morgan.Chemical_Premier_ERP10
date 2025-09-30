import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Download, 
  FilePlus, 
  ClipboardList,
  Package,
  Factory,
  TestTube,
  FileText,
  Truck,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  DollarSign,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import jsPDF from 'jspdf';
import { useLanguage } from '@/contexts/LanguageContext';
import { PrintableQuotation } from '@/components/PrintableQuotation';

// Enhanced Quotation interface
interface Quotation {
  id: number;
  quotationNumber: string;
  type: 'manufacturing' | 'refining' | 'finished';
  customerName: string;
  customerId: number;
  date: string;
  validUntil: string;
  notes?: string;
  subtotal: number;
  transportationFees: number;
  transportationType?: string;
  transportationNotes?: string;
  packagingFees: number;
  packagingType?: string;
  packagingNotes?: string;
  tax: number;
  total: number;
  amount: number;
  status: 'draft' | 'sent' | 'pending' | 'accepted' | 'rejected' | 'expired';
  items: {
    id: string;
    type: 'manufacturing' | 'refining' | 'finished';
    productName: string;
    description: string;
    quantity: number;
    uom: string;
    unitPrice: number;
    total: number;
    grade?: string;
    specifications?: string;
    rawMaterials?: string[];
    processingTime?: number;
    qualityGrade?: string;
  }[];
  packagingItems?: {
    id: string;
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    notes?: string;
  }[];
  termsAndConditions?: string;
}

// Helper functions
const getQuotationTypeIcon = (type: string) => {
  switch (type) {
    case 'manufacturing': return <Factory className="h-4 w-4" />;
    case 'refining': return <TestTube className="h-4 w-4" />;
    case 'finished': return <Package className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getQuotationTypeBadge = (type: string) => {
  switch (type) {
    case 'manufacturing':
      return (
        <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
          <Factory className="mr-1 h-3 w-3" />
          Manufacturing
        </Badge>
      );
    case 'refining':
      return (
        <Badge className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
          <TestTube className="mr-1 h-3 w-3" />
          Refining
        </Badge>
      );
    case 'finished':
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          <Package className="mr-1 h-3 w-3" />
          Finished
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-50 text-gray-700 border-gray-200">
          <FileText className="mr-1 h-3 w-3" />
          Standard
        </Badge>
      );
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="text-gray-600 border-gray-300">Draft</Badge>;
    case 'sent':
      return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Sent</Badge>;
    case 'pending':
      return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">Pending</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Accepted</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Rejected</Badge>;
    case 'expired':
      return <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const QuotationHistory = () => {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch quotations
  const { data: quotations = [], isLoading } = useQuery<Quotation[]>({
    queryKey: ['/api/quotations', searchTerm, statusFilter, typeFilter, dateFilter],
    queryFn: async () => {
      const res = await apiRequest(
        'GET', 
        `/api/quotations?query=${encodeURIComponent(searchTerm)}&status=${statusFilter}&type=${typeFilter}&date=${dateFilter}`
      );
      return res; // apiRequest already parses JSON
    },
  });

  // Fetch customer details when a quotation is selected
  const { data: customerDetails } = useQuery({
    queryKey: ['/api/v1/customers', selectedQuotation?.customerId],
    queryFn: async () => {
      if (!selectedQuotation?.customerId) return null;
      const res = await apiRequest('GET', `/api/v1/customers/${selectedQuotation.customerId}`);
      return res;
    },
    enabled: !!selectedQuotation?.customerId,
  });

  // Filter quotations
  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = searchTerm === '' || 
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesType = typeFilter === 'all' || quotation.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle quotation preview
  const handlePreview = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowPreview(true);
  };

  // Generate PDF for quotation
  const generateQuotationPDF = (quotation: Quotation) => {
    try {
      // Validate quotation data
      if (!quotation) {
        throw new Error('No quotation data provided');
      }

      console.log('Generating PDF for quotation:', quotation);
      
      const doc = new jsPDF();
      
      // Company Header
      doc.setFontSize(24);
      doc.setTextColor(41, 128, 185);
      doc.text('Premier ERP System', 20, 30);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('QUOTATION', 20, 45);
      
      // Quotation details
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 30);
      
      // Quotation info section
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      let yPos = 65;
      
      // Left column - Quotation details
      doc.text('Quotation Details:', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      
      // Safely access quotation properties
      const quotationNo = quotation.quotationNumber || 'N/A';
      const quotationType = quotation.type ? quotation.type.charAt(0).toUpperCase() + quotation.type.slice(1) : 'N/A';
      const quotationDate = quotation.date ? new Date(quotation.date).toLocaleDateString() : 'N/A';
      const validUntil = quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString() : 'N/A';
      const quotationStatus = quotation.status ? quotation.status.toUpperCase() : 'N/A';
      
      const quotationDetails = [
        ['Quotation No:', quotationNo],
        ['Type:', quotationType],
        ['Date:', quotationDate],
        ['Valid Until:', validUntil],
        ['Status:', quotationStatus]
      ];
      
      quotationDetails.forEach(([label, value]) => {
        doc.setTextColor(80, 80, 80);
        doc.text(String(label), 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), 70, yPos);
        yPos += 7;
      });
      
      // Right column - Customer details
      yPos = 75;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Customer Information:', 120, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Customer:', 120, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(String(quotation.customerName || 'N/A'), 150, yPos);
      yPos += 7;
      
      doc.setTextColor(80, 80, 80);
      doc.text('Customer ID:', 120, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(String(quotation.customerId || 'N/A'), 150, yPos);
      
      yPos += 20;
      
      // Items section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Quotation Items', 20, yPos);
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos + 3, 190, yPos + 3);
      
      yPos += 15;
      
      // Check if items exist
      const items = quotation.items || [];
      
      if (items.length > 0) {
        // Table headers
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(41, 128, 185);
        doc.rect(20, yPos, 170, 8, 'F');
        
        doc.text('Product', 22, yPos + 6);
        doc.text('Type', 70, yPos + 6);
        doc.text('Qty', 90, yPos + 6);
        doc.text('UoM', 105, yPos + 6);
        doc.text('Unit Price', 125, yPos + 6);
        doc.text('Total', 160, yPos + 6);
        
        yPos += 8;
        
        // Table rows
        doc.setTextColor(0, 0, 0);
        items.forEach((item, index) => {
          // Alternate row colors
          if (index % 2 === 0) {
            doc.setFillColor(248, 249, 250);
            doc.rect(20, yPos, 170, 8, 'F');
          }
          
          const productName = (item.productName || 'Unknown Product').substring(0, 20);
          const itemType = (item.type || 'N/A').substring(0, 8);
          const quantity = String(item.quantity || 0);
          const uom = item.uom || 'pcs';
          const unitPrice = `EGP ${(item.unitPrice || 0).toLocaleString()}`;
          const total = `EGP ${(item.total || 0).toLocaleString()}`;
          
          doc.text(productName, 22, yPos + 6);
          doc.text(itemType, 70, yPos + 6);
          doc.text(quantity, 90, yPos + 6);
          doc.text(uom, 105, yPos + 6);
          doc.text(unitPrice, 125, yPos + 6);
          doc.text(total, 160, yPos + 6);
          
          yPos += 8;
          
          // Add description if available
          if (item.description && item.description.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(item.description.substring(0, 60), 22, yPos + 3);
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            yPos += 6;
          }
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('No items in this quotation', 22, yPos + 6);
        yPos += 15;
      }
      
      yPos += 10;
      
      // Totals section
      doc.setFontSize(10);
      const totalsY = yPos;
      
      // Safely access totals
      const subtotal = quotation.subtotal || 0;
      const transportationFees = quotation.transportationFees || 0;
      const tax = quotation.tax || 0;
      const total = quotation.total || quotation.amount || 0;
      
      // Subtotal
      doc.setTextColor(80, 80, 80);
      doc.text('Subtotal:', 140, totalsY);
      doc.setTextColor(0, 0, 0);
      doc.text(`EGP ${subtotal.toLocaleString()}`, 170, totalsY);
      
      // Transportation fees
      if (transportationFees > 0) {
        doc.setTextColor(80, 80, 80);
        doc.text('Transportation:', 140, totalsY + 8);
        doc.setTextColor(0, 0, 0);
        doc.text(`EGP ${transportationFees.toLocaleString()}`, 170, totalsY + 8);
      }
      
      // Tax
      doc.setTextColor(80, 80, 80);
      doc.text('Tax (14%):', 140, totalsY + 16);
      doc.setTextColor(0, 0, 0);
      doc.text(`EGP ${tax.toLocaleString()}`, 170, totalsY + 16);
      
      // Total
      doc.setLineWidth(0.5);
      doc.line(140, totalsY + 20, 190, totalsY + 20);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Total:', 140, totalsY + 28);
      doc.text(`EGP ${total.toLocaleString()}`, 170, totalsY + 28);
      
      // Notes section
      if (quotation.notes && quotation.notes.length > 0) {
        yPos = totalsY + 40;
        doc.setFontSize(12);
        doc.text('Notes:', 20, yPos);
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        
        // Split notes into lines safely
        const noteLines = doc.splitTextToSize(quotation.notes, 170);
        doc.text(noteLines, 20, yPos + 8);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('This quotation is valid until the specified date above.', 20, pageHeight - 20);
      doc.text('Generated by Premier ERP System', 20, pageHeight - 15);
      doc.text('Page 1 of 1', 170, pageHeight - 10);
      
      // Save the PDF
      const fileName = `quotation-${(quotationNo || 'unknown').replace(/[\/\\]/g, '-')}.pdf`;
      doc.save(fileName);
      
      console.log('PDF generated successfully:', fileName);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        quotation: quotation
      });
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  // Handle convert quotation to invoice
  const handleConvertToInvoice = (quotation: Quotation) => {
    // Store quotation data in localStorage for the invoice form
    const invoiceData = {
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      items: (quotation.items || []).map(item => ({
        productName: item.productName,
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        uom: item.uom
      })),
      subtotal: quotation.subtotal || quotation.amount,
      tax: quotation.tax || (quotation.amount * 0.14),
      total: quotation.total || quotation.amount,
      notes: quotation.notes || '',
      quotationNumber: quotation.quotationNumber
    };
    
    localStorage.setItem('quotationToInvoice', JSON.stringify(invoiceData));
    setLocation('/create-invoice');
  };

  // Get summary statistics
  const totalQuotations = filteredQuotations.length;
  const pendingQuotations = filteredQuotations.filter(q => q.status === 'pending').length;
  const acceptedQuotations = filteredQuotations.filter(q => q.status === 'accepted').length;
  const totalValue = filteredQuotations.reduce((sum, q) => sum + (q.total || q.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quotation History</h1>
              <p className="text-gray-600">Manage and track all pharmaceutical quotations</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/create-quotation'}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Quotation
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                  <p className="text-2xl font-bold text-gray-900">{totalQuotations}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingQuotations}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{acceptedQuotations}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search quotations by number, customer, or product..."
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] border-gray-200">
                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px] border-gray-200">
                    <Package className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="refining">Refining</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[160px] border-gray-200">
                    <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expanded Customer Quotations Management */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Customer Quotations Dashboard Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Customer Quotations Management</h2>
                      <p className="text-blue-100">Comprehensive pharmaceutical quotation tracking and analysis</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{filteredQuotations.length}</div>
                      <div className="text-blue-200 text-sm">Total Quotations</div>
                    </div>
                  </div>
                </div>

                {/* Advanced Metrics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 font-medium">Accepted</p>
                        <p className="text-2xl font-bold text-green-800">
                          {filteredQuotations.filter(q => q.status === 'accepted').length}
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      ${filteredQuotations.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.total || q.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 font-medium">Pending</p>
                        <p className="text-2xl font-bold text-orange-800">
                          {filteredQuotations.filter(q => q.status === 'pending').length}
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      ${filteredQuotations.filter(q => q.status === 'pending').reduce((sum, q) => sum + (q.total || q.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-600 font-medium">Overdue</p>
                        <p className="text-2xl font-bold text-red-800">
                          {filteredQuotations.filter(q => q.status === 'rejected' || q.status === 'expired').length}
                        </p>
                      </div>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      ${filteredQuotations.filter(q => q.status === 'rejected' || q.status === 'expired').reduce((sum, q) => sum + (q.total || q.amount || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 font-medium">Total Value</p>
                        <p className="text-2xl font-bold text-blue-800">
                          ${filteredQuotations.reduce((sum, q) => sum + (q.total || q.amount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Combined portfolio value</p>
                  </div>
                </div>

                {/* Enhanced Action Bar - Fixed Layout */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Left Section - Statistics */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 font-medium">
                          {filteredQuotations.length} Active Quotations
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600">
                            {filteredQuotations.filter(q => q.status === 'accepted').length} Converted
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-gray-600">
                            {filteredQuotations.filter(q => q.status === 'pending').length} In Progress
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-gray-600">
                            {filteredQuotations.filter(q => q.status === 'rejected' || q.status === 'expired').length} Expired
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Section - Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = '/create-quotation'}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50 transition-colors"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Quotation
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert('Bulk actions: Select quotations and perform batch operations like status updates or exports')}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Bulk Actions
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const csvContent = filteredQuotations.map(q => 
                            `"${q.quotationNumber}","${q.customerName}","${q.date}","${q.status}","${q.total || q.amount}"`
                          ).join('\n');
                          const blob = new Blob([`"Quotation #","Customer","Date","Status","Amount"\n${csvContent}`], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'quotations-export.csv';
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50 transition-colors"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Professional Schedule Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b border-gray-200">
                        <TableHead className="w-12 px-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Quotation #</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Customer</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4 text-right">Amount</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4 text-right">Payment Terms</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Payment Method</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 px-4 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotations.map((quotation, index) => (
                        <TableRow 
                          key={quotation.id} 
                          className="hover:bg-gray-50/70 border-b border-gray-100 transition-colors"
                        >
                          <TableCell className="px-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-blue-600 px-4">
                            <button
                              onClick={() => {
                                setSelectedQuotation(quotation);
                                setShowPreview(true);
                              }}
                              className="hover:underline transition-all duration-200"
                            >
                              {quotation.quotationNumber}
                            </button>
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 px-4">
                            <div>
                              <div>{quotation.customerName}</div>
                              {quotation.type === 'manufacturing' && (
                                <div className="text-xs text-gray-500">Manufacturing Services</div>
                              )}
                              {quotation.type === 'refining' && (
                                <div className="text-xs text-gray-500">API Purification</div>
                              )}
                              {quotation.type === 'finished' && (
                                <div className="text-xs text-gray-500">Finished Products</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 px-4">
                            {quotation.date ? format(new Date(quotation.date), 'MMM d, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right font-semibold px-4 text-gray-900">
                            ${(quotation.total || quotation.amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right px-4">
                            {quotation.status === 'accepted' && 'Net 15'}
                            {quotation.status === 'pending' && 'Net 30'}
                            {quotation.status === 'sent' && 'Due on Receipt'}
                            {quotation.status === 'draft' && 'Not Set'}
                            {quotation.status === 'rejected' && 'Cash on Delivery'}
                            {quotation.status === 'expired' && 'Net 60'}
                          </TableCell>
                          <TableCell className="px-4">
                            {quotation.status === 'accepted' && 'Credit Card'}
                            {quotation.status === 'pending' && 'Bank Transfer'}
                            {quotation.status === 'sent' && 'Check Payment'}
                            {quotation.status === 'draft' && 'Not Set'}
                            {quotation.status === 'rejected' && 'Cash Payment'}
                            {quotation.status === 'expired' && 'Wire Transfer'}
                          </TableCell>
                          <TableCell className="px-4">
                            {quotation.status === 'accepted' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Accepted
                              </span>
                            )}
                            {quotation.status === 'pending' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Pending
                              </span>
                            )}
                            {quotation.status === 'rejected' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Rejected
                              </span>
                            )}
                            {quotation.status === 'expired' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Expired
                              </span>
                            )}
                            {quotation.status === 'draft' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Draft
                              </span>
                            )}
                            {quotation.status === 'sent' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Sent
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 text-center">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedQuotation(quotation);
                                  setShowPreview(true);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 rounded-full"
                                title="Convert to Invoice"
                                onClick={() => handleConvertToInvoice(quotation)}
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-center text-sm text-gray-600 pt-4">
                  Showing 1 to {filteredQuotations.length} of {filteredQuotations.length} quotations
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        {selectedQuotation && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-6xl max-h-[95vh] w-[95vw] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Quotation #{selectedQuotation.quotationNumber}
                </DialogTitle>
                <DialogDescription>
                  Created: {selectedQuotation.date ? format(new Date(selectedQuotation.date), 'PPPP') : 'N/A'} • 
                  Valid Until: {selectedQuotation.validUntil ? format(new Date(selectedQuotation.validUntil), 'PPPP') : 'N/A'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto">
                <PrintableQuotation
                  quotationNumber={selectedQuotation.quotationNumber}
                  date={new Date(selectedQuotation.date)}
                  validUntil={selectedQuotation.validUntil}
                  customer={{
                    name: customerDetails?.name || selectedQuotation.customerName,
                    id: selectedQuotation.customerId,
                    company: customerDetails?.company,
                    phone: customerDetails?.phone,
                    email: customerDetails?.email,
                    address: customerDetails?.address,
                    taxNumber: customerDetails?.taxNumber,
                    sector: customerDetails?.sector,
                    position: customerDetails?.position
                  }}
                  items={selectedQuotation.items.map(item => ({
                    id: item.id,
                    productName: item.productName,
                    description: item.description,
                    quantity: item.quantity,
                    uom: item.uom,
                    unitPrice: item.unitPrice,
                    total: item.total,
                    type: item.type,
                    grade: item.grade || 'P',
                    processingTime: item.processingTime,
                    qualityGrade: item.qualityGrade,
                    specifications: item.specifications
                  }))}
                  packagingItems={selectedQuotation.packagingItems || []}
                  subtotal={selectedQuotation.subtotal}
                  transportationFees={selectedQuotation.transportationFees}
                  packagingFees={selectedQuotation.packagingFees}
                  vatPercentage={14}
                  vatAmount={selectedQuotation.tax}
                  grandTotal={selectedQuotation.total}
                  notes={selectedQuotation.notes}
                  transportationType={selectedQuotation.transportationType}
                  transportationNotes={selectedQuotation.transportationNotes}
                  packagingType={selectedQuotation.packagingType}
                  packagingNotes={selectedQuotation.packagingNotes}
                  quotationType={selectedQuotation.type}
                  termsAndConditions={selectedQuotation.termsAndConditions}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button onClick={() => selectedQuotation && generateQuotationPDF(selectedQuotation)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default QuotationHistory;