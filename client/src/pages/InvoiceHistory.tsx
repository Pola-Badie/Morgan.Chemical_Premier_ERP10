import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Download, Eye, Search, Calendar, Filter, Upload, Image as ImageIcon, MessageCircle, Mail, MoreHorizontal, CreditCard, Trash2, Check, ChevronDown, RotateCcw, ChevronLeft, ChevronRight, Send, CheckCircle, Clock, XCircle, AlertCircle, Printer } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerName: string;
  date: string;
  dueDate?: string;
  amount?: number;
  grandTotal?: string;
  totalAmount?: string;
  amountPaid?: string;
  paymentMethod?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'partial' | 'overdue' | 'refunded';
  status?: 'paid' | 'unpaid' | 'partial' | 'overdue' | 'refunded';
  etaStatus?: 'not_sent' | 'pending' | 'uploaded' | 'failed';
  etaReference?: string;
  etaUuid?: string;
  etaSubmissionDate?: string;
  etaErrorMessage?: string;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
    company?: string;
  };
  items?: {
    id?: number;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: string | number;
    total: string | number;
    unitOfMeasure?: string;
    categoryName?: string;
  }[];
}

const InvoiceHistory = () => {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detailedInvoice, setDetailedInvoice] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [invoiceToUpdate, setInvoiceToUpdate] = useState<Invoice | null>(null);
  
  // ETA state
  const [sendingToETA, setSendingToETA] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch real invoice data from unified API (same approach as procurement in accounting)
  const { data: apiInvoices, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/unified/invoices'],
    queryFn: () => {
      console.log('Invoice History - Fetching invoices from unified API for complete synchronization');
      return fetch('/api/unified/invoices').then(res => res.json());
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 60000 // Refresh every 60 seconds to reduce server load
  });

  // Debug logging
  console.log('Invoice History - API Response:', { 
    loading: isLoading, 
    error: error, 
    dataLength: Array.isArray(apiInvoices) ? apiInvoices.length : 0,
    latestInvoice: Array.isArray(apiInvoices) && apiInvoices.length > 0 ? apiInvoices[apiInvoices.length - 1] : null
  });

  const invoices: Invoice[] = Array.isArray(apiInvoices) ? apiInvoices : [];

  // Add refresh functionality
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Invoice data has been updated",
    });
  };

  // Handle PDF download - matches invoice preview dialog layout exactly
  const downloadInvoicePDF = async (invoice: Invoice) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your invoice PDF...",
      });

      // Fetch detailed invoice data first
      let detailedData = null;
      try {
        const response = await fetch(`/api/sales/${invoice.id}`);
        if (response.ok) {
          detailedData = await response.json();
        }
      } catch (error) {
        console.log('Could not fetch detailed data, using basic invoice info');
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Company Header - matches Premier ERP branding
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(37, 99, 235); // Blue-600
      pdf.text('Premier ERP', 20, 25);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128); // Gray-500
      pdf.text('Enterprise Resource Planning System', 20, 33);
      
      // Company Details
      pdf.setFontSize(9);
      pdf.text('123 Business District', 20, 45);
      pdf.text('Cairo, Egypt 11511', 20, 52);
      pdf.text('Phone: +20 2 1234 5678', 20, 59);
      pdf.text('Email: info@premieregypt.com', 20, 66);

      // Invoice Title (Right Side)
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81); // Gray-700
      pdf.text('INVOICE', pageWidth - 55, 25);

      // Header border
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(20, 75, pageWidth - 20, 75);

      // Invoice Information Section (matches dialog layout)
      pdf.setFillColor(249, 250, 251); // Gray-50 background
      pdf.rect(20, 85, (pageWidth - 45) / 2, 45, 'F');
      pdf.setDrawColor(229, 231, 235);
      pdf.rect(20, 85, (pageWidth - 45) / 2, 45);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(17, 24, 39); // Gray-900
      pdf.text('Invoice Information', 25, 97);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99); // Gray-600
      pdf.text('Invoice Number:', 25, 107);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(invoice.invoiceNumber, 65, 107);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Date:', 25, 115);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(format(new Date(invoice.date), 'PPP'), 65, 115);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Payment Method:', 25, 123);
      pdf.setTextColor(0, 0, 0);
      pdf.text(invoice.paymentMethod?.replace('_', ' ') || 'Not specified', 65, 123);

      // Customer Details Section (Right side)
      pdf.setFillColor(249, 250, 251);
      pdf.rect((pageWidth / 2) + 2.5, 85, (pageWidth - 45) / 2, 45, 'F');
      pdf.rect((pageWidth / 2) + 2.5, 85, (pageWidth - 45) / 2, 45);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(17, 24, 39);
      pdf.text('Customer Details', (pageWidth / 2) + 7.5, 97);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Name:', (pageWidth / 2) + 7.5, 107);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(detailedData?.customer?.name || invoice.customerName, (pageWidth / 2) + 25, 107);
      
      if (detailedData?.customer?.email) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        pdf.text('Email:', (pageWidth / 2) + 7.5, 115);
        pdf.setTextColor(0, 0, 0);
        pdf.text(detailedData.customer.email, (pageWidth / 2) + 25, 115);
      }
      
      if (detailedData?.customer?.phone) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        pdf.text('Phone:', (pageWidth / 2) + 7.5, 123);
        pdf.setTextColor(0, 0, 0);
        pdf.text(detailedData.customer.phone, (pageWidth / 2) + 25, 123);
      }

      // Invoice Items Table (matches dialog table exactly)
      let tableStartY = 145;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(17, 24, 39);
      pdf.text('Invoice Items', 20, tableStartY - 5);
      
      // Table Headers
      pdf.setFillColor(249, 250, 251); // Gray-50
      pdf.rect(20, tableStartY, pageWidth - 40, 12, 'F');
      pdf.setDrawColor(229, 231, 235);
      pdf.rect(20, tableStartY, pageWidth - 40, 12);
      
      const headerColumns = ['Product', 'Quantity', 'Unit', 'Unit Price', 'Total'];
      const colWidths = [60, 25, 20, 35, 35];
      let currentX = 20;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81);
      
      headerColumns.forEach((header, i) => {
        const alignment = (i === 1 || i === 2) ? 'center' : (i >= 3) ? 'right' : 'left';
        if (alignment === 'center') {
          pdf.text(header, currentX + (colWidths[i] / 2), tableStartY + 8, { align: 'center' });
        } else if (alignment === 'right') {
          pdf.text(header, currentX + colWidths[i] - 3, tableStartY + 8, { align: 'right' });
        } else {
          pdf.text(header, currentX + 3, tableStartY + 8);
        }
        currentX += colWidths[i];
      });

      // Table Content
      let currentY = tableStartY + 15;
      let calculatedSubtotal = 0;
      
      if (detailedData?.items && detailedData.items.length > 0) {
        detailedData.items.forEach((item: any, index: number) => {
          currentX = 20;
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          const itemTotal = parseFloat(item.total || (item.quantity * item.unitPrice));
          calculatedSubtotal += itemTotal;
          
          // Alternating row background
          if (index % 2 === 1) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(20, currentY - 8, pageWidth - 40, 12, 'F');
          }
          
          pdf.setFontSize(8);
          
          // Product name
          pdf.text(item.productName, currentX + 3, currentY);
          currentX += colWidths[0];
          
          // Quantity (centered)
          pdf.text(item.quantity.toString(), currentX + (colWidths[1] / 2), currentY, { align: 'center' });
          currentX += colWidths[1];
          
          // Unit (centered)
          pdf.text(item.unitOfMeasure || 'PCS', currentX + (colWidths[2] / 2), currentY, { align: 'center' });
          currentX += colWidths[2];
          
          // Unit Price (right aligned)
          pdf.text(`EGP ${parseFloat(item.unitPrice || 0).toLocaleString()}`, currentX + colWidths[3] - 3, currentY, { align: 'right' });
          currentX += colWidths[3];
          
          // Total (right aligned, bold)
          pdf.setFont('helvetica', 'bold');
          pdf.text(`EGP ${itemTotal.toLocaleString()}`, currentX + colWidths[4] - 3, currentY, { align: 'right' });
          
          currentY += 12;
        });
      } else {
        // No items fallback
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text('No items found', pageWidth / 2, currentY, { align: 'center' });
        currentY += 12;
      }

      // Table borders
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(229, 231, 235);
      currentX = 20;
      colWidths.forEach((width, i) => {
        pdf.line(currentX, tableStartY, currentX, currentY);
        currentX += width;
      });
      pdf.line(currentX, tableStartY, currentX, currentY); // Last vertical line
      pdf.line(20, tableStartY, pageWidth - 20, tableStartY); // Top border
      pdf.line(20, currentY, pageWidth - 20, currentY); // Bottom border

      // Invoice Totals Section (matches dialog totals exactly)
      const totalsStartY = currentY + 20;
      const totalsWidth = 80;
      const totalsX = pageWidth - totalsWidth - 20;
      
      pdf.setFillColor(249, 250, 251); // Gray-50
      pdf.rect(totalsX, totalsStartY, totalsWidth, 65, 'F');
      pdf.setDrawColor(229, 231, 235);
      pdf.rect(totalsX, totalsStartY, totalsWidth, 65);
      
      // Calculate financial values (matches dialog calculation logic)
      const subtotal = detailedData?.subtotal || calculatedSubtotal;
      const discount = detailedData?.discount || 0;
      const tax = detailedData?.tax || (subtotal * 0.14); // 14% VAT
      const total = detailedData?.total || detailedData?.grandTotal || 
                   parseFloat(invoice.amount.toString()) || (subtotal - discount + tax);
      const amountPaid = detailedData?.amountPaid || invoice.amountPaid || 0;
      const balanceDue = total - amountPaid;
      
      let yPos = totalsStartY + 12;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Subtotal:', totalsX + 5, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`EGP ${subtotal.toLocaleString()}`, totalsX + totalsWidth - 5, yPos, { align: 'right' });
      yPos += 10;
      
      if (discount > 0) {
        pdf.setTextColor(75, 85, 99);
        pdf.text('Discount:', totalsX + 5, yPos);
        pdf.setTextColor(239, 68, 68); // Red for discount
        pdf.text(`-EGP ${discount.toLocaleString()}`, totalsX + totalsWidth - 5, yPos, { align: 'right' });
        yPos += 10;
      }
      
      pdf.setTextColor(75, 85, 99);
      pdf.text('Tax (VAT 14%):', totalsX + 5, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`EGP ${tax.toLocaleString()}`, totalsX + totalsWidth - 5, yPos, { align: 'right' });
      yPos += 10;
      
      // Draw separator line
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(229, 231, 235);
      pdf.line(totalsX + 5, yPos, totalsX + totalsWidth - 5, yPos);
      yPos += 8;
      
      // Total Amount (bold and larger)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Total Amount:', totalsX + 5, yPos);
      pdf.setFontSize(12);
      pdf.text(`EGP ${total.toLocaleString()}`, totalsX + totalsWidth - 5, yPos, { align: 'right' });
      yPos += 15;
      
      // Another separator
      pdf.setLineWidth(0.3);
      pdf.line(totalsX + 5, yPos, totalsX + totalsWidth - 5, yPos);
      yPos += 8;
      
      // Payment Information
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Amount Paid:', totalsX + 5, yPos);
      pdf.setTextColor(34, 197, 94); // Green
      pdf.text(`EGP ${amountPaid.toLocaleString()}`, totalsX + totalsWidth - 5, yPos, { align: 'right' });
      yPos += 10;
      
      pdf.setFont('helvetica', 'bold');
      const balanceColor = balanceDue > 0 ? [239, 68, 68] : [34, 197, 94]; // Red or Green
      pdf.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
      pdf.text(balanceDue > 0 ? 'Balance Due:' : 'Overpaid:', totalsX + 5, yPos);
      pdf.setFontSize(10);
      pdf.text(`EGP ${Math.abs(balanceDue).toLocaleString()}`, totalsX + totalsWidth - 5, yPos, { align: 'right' });

      // Payment Status Badge
      const statusY = totalsStartY + 80;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Payment Status:', 20, statusY);
      
      // Status badge colors matching dialog
      const statusColors = {
        paid: [34, 197, 94],     // Green
        pending: [251, 191, 36], // Yellow  
        unpaid: [239, 68, 68]    // Red
      };
      const statusColor = statusColors[invoice.status as keyof typeof statusColors] || statusColors.unpaid;
      
      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.rect(80, statusY - 6, 30, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(invoice.status.toUpperCase(), 95, statusY, { align: 'center' });

      // Notes section (if available)
      if (detailedData?.notes) {
        const notesY = statusY + 20;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(17, 24, 39);
        pdf.text('Notes', 20, notesY);
        
        pdf.setFillColor(249, 250, 251);
        pdf.rect(20, notesY + 5, pageWidth - 40, 20, 'F');
        pdf.setDrawColor(229, 231, 235);
        pdf.rect(20, notesY + 5, pageWidth - 40, 20);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(55, 65, 81);
        pdf.text(detailedData.notes, 25, notesY + 15);
      }

      // Footer
      const footerY = pageHeight - 25;
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
      pdf.text(`Generated on ${format(new Date(), 'PPP')} at ${format(new Date(), 'p')}`, pageWidth / 2, footerY + 8, { align: 'center' });
      pdf.text('For questions regarding this invoice, contact us at support@premiererp.com', pageWidth / 2, footerY + 16, { align: 'center' });
      
      // Save the PDF
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.invoiceNumber} has been downloaded successfully.`,
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Filter invoices based on search term, status, and date
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const invoiceDate = new Date(invoice.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - invoiceDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = diffDays <= 1;
          break;
        case 'week':
          matchesDate = diffDays <= 7;
          break;
        case 'month':
          matchesDate = diffDays <= 30;
          break;
        case 'quarter':
          matchesDate = diffDays <= 90;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // ETA Status Badge Helper
  const getETAStatusBadge = (etaStatus?: string) => {
    switch (etaStatus) {
      case 'uploaded':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Uploaded
        </Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Sent
        </Badge>;
    }
  };

  // Send invoice to ETA
  const handleSendToETA = async (invoice: Invoice) => {
    try {
      setSendingToETA(invoice.id);
      
      const response = await fetch(`/api/eta/submit-invoice/${invoice.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "ETA Submission Successful",
          description: `Invoice ${invoice.invoiceNumber} has been submitted to Egyptian Tax Authority`,
        });
        refetch(); // Refresh to get updated ETA status
      } else {
        toast({
          title: "ETA Submission Failed",
          description: result.message || "Failed to submit invoice to ETA",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('ETA submission error:', error);
      toast({
        title: "ETA Submission Error",
        description: "Unable to connect to Egyptian Tax Authority",
        variant: "destructive",
      });
    } finally {
      setSendingToETA(null);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = filteredInvoices.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { className: 'bg-green-100 text-green-800', label: 'Paid' },
      unpaid: { className: 'bg-red-100 text-red-800', label: 'Unpaid' },
      partial: { className: 'bg-yellow-100 text-yellow-800', label: 'Partial' },
      overdue: { className: 'bg-purple-100 text-purple-800', label: 'Overdue' },
      refunded: { className: 'bg-gray-100 text-gray-800', label: 'Refunded' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
    setLoadingDetails(true);
    
    try {
      // Use unified API data - no need for separate fetch since unified API provides all data
      console.log('Using unified invoice data for preview:', invoice);
      setDetailedInvoice(invoice);
    } catch (error) {
      console.error('Error setting invoice details:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice details",
        variant: "destructive"
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice History</h1>
              <p className="text-gray-600">Manage and track all your invoices</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {currentInvoices.length} of {filteredInvoices.length} invoices
                {filteredInvoices.length !== invoices.length && ` (filtered from ${invoices.length} total)`}
              </div>
              <div className="text-sm text-gray-600">
                Total Amount: EGP {invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Table */}
        <Card>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading invoices...</p>
                </div>
              </div>
            ) : currentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-600">
                  {filteredInvoices.length === 0 && invoices.length > 0
                    ? 'Try adjusting your filters to see more results.'
                    : 'Create your first invoice to get started.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ETA Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>EGP {parseFloat(invoice.grandTotal || invoice.totalAmount || invoice.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getETAStatusBadge(invoice.etaStatus)}
                            {(invoice.etaStatus === 'not_sent' || invoice.etaStatus === 'failed' || !invoice.etaStatus) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendToETA(invoice)}
                                disabled={sendingToETA === invoice.id}
                              >
                                {sendingToETA === invoice.id ? (
                                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3 mr-1" />
                                )}
                                {sendingToETA === invoice.id ? 'Sending...' : 'Send to ETA'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {invoice.paymentMethod?.replace('_', ' ') || 'Not specified'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadInvoicePDF(invoice)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Invoice Preview Dialog - Matching CreateInvoice Format */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Invoice Preview</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    disabled={!selectedInvoice}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedInvoice && downloadInvoicePDF(selectedInvoice)}
                    disabled={!selectedInvoice}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </DialogTitle>
              <DialogDescription>
                Preview invoice before printing or downloading
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto bg-white">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading invoice details...</span>
                </div>
              ) : selectedInvoice && detailedInvoice ? (
                <div className="p-6">
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
                              <span>{detailedInvoice.invoiceNumber}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800">Paper Invoice Number: </span>
                              <span>{detailedInvoice.paperInvoiceNumber || '23423'}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800">Approval No.: </span>
                              <span>{detailedInvoice.approvalNumber || '12312312'}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800">Date: </span>
                              <span>{new Date(detailedInvoice.date).toLocaleDateString('en-GB')}</span>
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
                              {detailedInvoice.customer?.name || selectedInvoice.customerName}
                            </h4>
                            
                            <div className="flex space-x-2 mb-3">
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                Code: CUST-{String(detailedInvoice.customer?.id || '0001').padStart(4, '0')}
                              </div>
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Mobile: {detailedInvoice.customer?.phone || '+20 2 2222 3333'}
                              </div>
                            </div>

                            {detailedInvoice.customer?.company && (
                              <p className="text-gray-600 text-sm mb-2">
                                {detailedInvoice.customer.company}
                              </p>
                            )}
                            {detailedInvoice.customer?.address && (
                              <p className="text-gray-600 text-sm">
                                {detailedInvoice.customer.address}
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
                            <p className="text-gray-900">{new Date(detailedInvoice.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Due Date:</span>
                            <p className="text-gray-900">{detailedInvoice.dueDate ? new Date(detailedInvoice.dueDate).toLocaleDateString() : 'Due Immediately'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Payment Terms:</span>
                            <p className="text-gray-900">{detailedInvoice.paymentTerms === '0' || !detailedInvoice.paymentTerms ? 'Due Immediately' : `Net ${detailedInvoice.paymentTerms} Days`}</p>
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
                            {detailedInvoice.items?.map((item: any, index: number) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-3 py-2">
                                  <p className="font-medium text-gray-900 text-sm break-words" style={{wordWrap: 'break-word', hyphens: 'auto'}}>{item.productName || 'No Product Name'}</p>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-gray-900 text-sm">{item.category || 'Category null'}</td>
                                <td className="border border-gray-300 px-3 py-2 text-gray-900 text-sm">{item.batchNo || '-'}</td>
                                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900 text-sm font-bold">({item.grade || 'P'})</td>
                                <td className="border border-gray-300 px-3 py-2 text-center text-gray-900 text-sm">{item.quantity || 0}</td>
                                <td className="border border-gray-300 px-3 py-2 text-right text-gray-900 text-sm">EGP {parseFloat(item.unitPrice || 0).toFixed(2)}</td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-medium text-gray-900 text-sm">EGP {parseFloat(item.total || 0).toFixed(2)}</td>
                              </tr>
                            )) || (
                              <tr>
                                <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                                  No items found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals Section */}
                      <div className="flex justify-end">
                        <div className="w-80">
                          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-3">
                            {(() => {
                              // Use database values directly - no recalculation to avoid mismatches
                              const subtotal = parseFloat(detailedInvoice.subtotal || 0);
                              const discountAmount = parseFloat(detailedInvoice.discountAmount || detailedInvoice.discount || 0);
                              const taxAmount = parseFloat(detailedInvoice.taxAmount || detailedInvoice.tax || 0);
                              const vatAmount = parseFloat(detailedInvoice.vatAmount || 0);
                              
                              // Use actual grandTotal from database instead of calculating
                              const total = parseFloat(detailedInvoice.grandTotal || detailedInvoice.totalAmount || 0);
                              
                              // Payment calculations using database values
                              const amountPaid = parseFloat(detailedInvoice.amountPaid || 0);
                              const balanceDue = total - amountPaid;
                              
                              return (
                                <>
                                  <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                                    <span className="font-medium">Subtotal:</span>
                                    <span className="font-medium">EGP {subtotal.toFixed(2)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between text-green-600 border-b border-gray-200 pb-2">
                                    <span className="font-medium">Discount:</span>
                                    <span className="font-medium">-EGP {discountAmount.toFixed(2)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                                    <span className="font-medium">Tax ({detailedInvoice.taxRate || 14}%):</span>
                                    <span className="font-medium">EGP {taxAmount.toFixed(2)}</span>
                                  </div>
                                  
                                  {vatAmount > 0 && (
                                    <div className="flex justify-between text-gray-700 border-b border-gray-200 pb-2">
                                      <span className="font-medium">VAT ({detailedInvoice.vatRate || 14}%):</span>
                                      <span className="font-medium">EGP {vatAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  <div className="bg-blue-600 text-white rounded p-3 -m-1">
                                    <div className="flex justify-between text-lg font-bold">
                                      <span>Total Amount:</span>
                                      <span>EGP {total.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  <div className="border-t border-gray-200 pt-3 space-y-2">
                                    <div className="flex justify-between text-green-600">
                                      <span className="font-medium">Amount Paid:</span>
                                      <span className="font-medium">EGP {amountPaid.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-600 font-semibold">
                                      <span>Balance Due:</span>
                                      <span>EGP {balanceDue.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {detailedInvoice.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Notes:</h4>
                          <p className="text-sm text-gray-700">{detailedInvoice.notes}</p>
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Failed to load invoice details
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowPreview(false);
                setDetailedInvoice(null);
                setUploadedFiles([]);
              }}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceHistory;