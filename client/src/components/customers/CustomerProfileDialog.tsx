import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { CustomerData } from './CustomerCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, Mail, MapPin, Phone, Building, FileText, Download, ChevronDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useQuery } from '@tanstack/react-query';

interface CustomerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData | null;
}

// Invoice data structure
interface InvoiceData {
  id: number;
  date: string;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  itemCount: number;
  etaInvoiceNumber?: string;
}

// Customer profile data structure
interface CustomerProfileData {
  customer: CustomerData;
  invoices: InvoiceData[];
  statistics: {
    totalPurchases: number;
    totalOrders: number;
    openInvoices: number;
    lastOrderDate: string | null;
    averageOrderValue: number;
    paymentScore: string;
    customerSince: string;
  };
}

const CustomerProfileDialog: React.FC<CustomerProfileDialogProps> = ({
  open,
  onOpenChange,
  customer
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch real customer profile data
  const { data: profileData, isLoading } = useQuery<CustomerProfileData>({
    queryKey: [`/api/customers/${customer?.id}/profile`],
    enabled: !!customer?.id && open
  });

  if (!customer) return null;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Export to PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(41, 128, 185); // Blue color
      doc.text('Customer Profile Report', 20, 20);
      
      // Add company logo placeholder
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Premier ERP System', 150, 20);
      
      // Customer basic info
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Customer Information', 20, 40);
      
      // Add horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 45, 190, 45);
      
      doc.setFontSize(12);
      let yPos = 55;
      
      // Customer details
      const details = [
        { label: 'Name', value: customer.name },
        { label: 'Company', value: customer.company || 'N/A' },
        { label: 'Email', value: customer.email },
        { label: 'Phone', value: customer.phone || 'N/A' },
        { label: 'Address', value: customer.address || 'N/A' },
        { label: 'Sector', value: customer.sector || 'N/A' },
        { label: 'Position', value: customer.position || 'N/A' },
        { label: 'Tax Number', value: customer.taxNumber || 'N/A' }
      ];
      
      details.forEach(({ label, value }) => {
        doc.setTextColor(60, 60, 60);
        doc.text(`${label}:`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.text(value, 80, yPos);
        yPos += 10;
      });
      
      // Invoice history section
      if (profileData?.invoices && profileData.invoices.length > 0) {
        yPos += 10;
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Invoice History', 20, yPos);
        
        // Add horizontal line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos + 5, 190, yPos + 5);
        
        yPos += 15;
        
        // Table headers
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(41, 128, 185);
        doc.rect(20, yPos, 170, 8, 'F');
        
        doc.text('Invoice #', 25, yPos + 6);
        doc.text('Date', 60, yPos + 6);
        doc.text('Amount', 95, yPos + 6);
        doc.text('Status', 130, yPos + 6);
        doc.text('Items', 165, yPos + 6);
        
        yPos += 8;
        
        // Table rows
        doc.setTextColor(0, 0, 0);
        profileData.invoices.forEach((invoice: any, index: number) => {
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(20, yPos, 170, 8, 'F');
          }
          
          doc.text(`INV-${invoice.id}`, 25, yPos + 6);
          doc.text(formatDate(invoice.date), 60, yPos + 6);
          doc.text(`EGP ${invoice.totalAmount.toLocaleString()}`, 95, yPos + 6);
          doc.text(invoice.paymentStatus.toUpperCase(), 130, yPos + 6);
          doc.text(invoice.itemCount.toString(), 165, yPos + 6);
          
          yPos += 8;
        });
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by Premier ERP System', 20, pageHeight - 10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 140, pageHeight - 10);
      
      // Save the PDF
      const fileName = `customer-profile-${customer.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      
      // Customer info sheet with enhanced formatting
      const customerData = [
        ['Premier ERP System - Customer Profile Report'],
        ['Generated on:', new Date().toLocaleString()],
        [''],
        ['Customer Information'],
        ['Field', 'Value'],
        ['Name', customer.name],
        ['Company', customer.company || 'N/A'],
        ['Email', customer.email],
        ['Phone', customer.phone || 'N/A'],
        ['Address', customer.address || 'N/A'],
        ['Sector', customer.sector || 'N/A'],
        ['Position', customer.position || 'N/A'],
        ['Tax Number', customer.taxNumber || 'N/A']
      ];
      
      const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
      
      // Style the customer sheet
      const customerRange = XLSX.utils.decode_range(customerSheet['!ref'] || 'A1');
      
      // Merge cells for title
      customerSheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }
      ];
      
      // Set column widths
      customerSheet['!cols'] = [
        { width: 20 },
        { width: 40 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Info');
      
      // Invoice history sheet
      if (profileData?.invoices && profileData.invoices.length > 0) {
        const invoiceData = [
          ['Invoice History'],
          ['Generated on:', new Date().toLocaleString()],
          [''],
          ['Invoice #', 'Date', 'Amount (EGP)', 'Status', 'Items Count', 'Payment Status'],
          ...profileData.invoices.map((invoice: any) => [
            `INV-${invoice.id}`,
            formatDate(invoice.date),
            invoice.totalAmount,
            invoice.paymentStatus.toUpperCase(),
            invoice.itemCount,
            invoice.paymentStatus === 'paid' ? 'COMPLETED' : 'PENDING'
          ]),
          [''],
          ['Summary'],
          ['Total Invoices:', profileData.invoices.length],
          ['Total Amount:', `EGP ${profileData.invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0).toLocaleString()}`],
          ['Paid Invoices:', profileData.invoices.filter((inv: any) => inv.paymentStatus === 'paid').length],
          ['Pending Invoices:', profileData.invoices.filter((inv: any) => inv.paymentStatus !== 'paid').length]
        ];
        
        const invoiceSheet = XLSX.utils.aoa_to_sheet(invoiceData);
        
        // Set column widths for invoice sheet
        invoiceSheet['!cols'] = [
          { width: 15 },
          { width: 12 },
          { width: 15 },
          { width: 12 },
          { width: 12 },
          { width: 15 }
        ];
        
        // Merge cells for title and summary
        invoiceSheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
          { s: { r: profileData.invoices.length + 4, c: 0 }, e: { r: profileData.invoices.length + 4, c: 5 } }
        ];
        
        XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoice History');
      }
      
      // Save the Excel file
      const fileName = `customer-profile-${customer.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Failed to generate Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Customer Profile</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Comprehensive customer information and business relationship details for {customer.name}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Name</label>
                <div className="text-lg font-bold text-blue-900 bg-white p-3 rounded border border-blue-200">
                  {customer.name}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Position/Title</label>
                <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                  {customer.position || 'N/A'}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Status</label>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    N/A
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer ID</label>
                <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200 font-mono">
                  CUST-{customer.id.toString().padStart(6, '0')}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Since</label>
                <div className="text-sm text-blue-800 bg-white p-3 rounded border border-blue-200">
                  {profileData?.statistics.customerSince ? 
                    formatDate(profileData.statistics.customerSince) : 
                    'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Company Name</label>
                <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                  {customer.company}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Industry Sector</label>
                <div className="bg-white p-3 rounded border border-green-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {customer.sector}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Business Type</label>
                <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                  {customer.sector || 'N/A'}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Company Size</label>
                <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                  N/A
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Registration Number</label>
                <div className="text-sm text-green-800 bg-white p-3 rounded border border-green-200 font-mono">
                  N/A
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Primary Email</label>
                <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                    {customer.email}
                  </a>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Phone Number</label>
                <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                  <a href={`tel:${customer.phone}`} className="hover:underline">
                    {customer.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Alternative Contact</label>
                <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                  N/A
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Preferred Contact Method</label>
                <div className="text-sm text-purple-800 bg-white p-3 rounded border border-purple-200">
                  N/A
                </div>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address & Location
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Business Address</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 min-h-[80px]">
                  {customer.address}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Billing Address</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200 min-h-[80px]">
                  {customer.address || 'N/A'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Country</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                  N/A
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Time Zone</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                  N/A
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Service Region</label>
                <div className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-200">
                  N/A
                </div>
              </div>
            </div>
          </div>

          {/* Tax & Compliance Section */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Tax & Compliance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">ETA Tax Number</label>
                <div className="bg-white p-3 rounded border border-yellow-200">
                  {customer.taxNumber ? (
                    <span className="text-blue-600 font-medium font-mono">{customer.taxNumber}</span>
                  ) : (
                    <span className="text-gray-500">Not registered with ETA</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">VAT Status</label>
                <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                  N/A
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">Tax Classification</label>
                <div className="bg-white p-3 rounded border border-yellow-200">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    N/A
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">Commercial Registration</label>
                <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200 font-mono">
                  N/A
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">License Expiry</label>
                <div className="text-sm text-yellow-800 bg-white p-3 rounded border border-yellow-200">
                  N/A
                </div>
              </div>
            </div>
          </div>

          {/* Account Summary Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Account Summary & Performance
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="text-sm font-medium text-gray-700">Total Purchases</div>
                    <div className="text-2xl font-bold text-green-600">
                      {profileData?.statistics?.totalPurchases?.toLocaleString() || 0} EGP
                    </div>
                    <div className="text-xs text-gray-500">Lifetime value</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="text-sm font-medium text-gray-700">Open Invoices</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {profileData?.statistics.openInvoices || 0}
                    </div>
                    <div className="text-xs text-gray-500">Pending payment</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="text-sm font-medium text-gray-700">Total Orders</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {profileData?.statistics.totalOrders || 0}
                    </div>
                    <div className="text-xs text-gray-500">Since registration</div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="text-sm font-medium text-gray-700">Payment Score</div>
                    <div className="text-2xl font-bold text-green-600">
                      {profileData?.statistics.paymentScore || 0}%
                    </div>
                    <div className="text-xs text-gray-500">On-time payments</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Last Order Date</label>
                    <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                      {profileData?.statistics.lastOrderDate ? 
                        formatDate(profileData.statistics.lastOrderDate) : 
                        'No orders yet'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Average Order Value</label>
                    <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                      {profileData?.statistics?.averageOrderValue?.toLocaleString() || 0} EGP
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Customer Tier</label>
                    <div className="bg-white p-3 rounded border border-gray-200">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {(profileData?.statistics.totalPurchases || 0) > 50000 ? 'Gold Customer' : 
                         (profileData?.statistics.totalPurchases || 0) > 10000 ? 'Silver Customer' : 
                         'Bronze Customer'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Invoice History Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Recent Invoice History
            </h3>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA Number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ) : profileData?.invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No invoices found for this customer
                      </TableCell>
                    </TableRow>
                  ) : (
                    profileData?.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">#{invoice.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {formatDate(invoice.date)}
                          </div>
                        </TableCell>
                        <TableCell>{invoice.itemCount}</TableCell>
                        <TableCell className="text-right font-medium">{invoice.totalAmount.toLocaleString()} EGP</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              invoice.paymentStatus === 'paid'
                                ? 'bg-green-500'
                                : invoice.paymentStatus === 'pending'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }
                          >
                            {invoice.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-blue-600 font-mono text-xs">
                            {invoice.etaInvoiceNumber || 'N/A'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">
                      Total Invoices: {profileData?.invoices.length || 0} | 
                      Customer Since: {profileData?.statistics.customerSince ? 
                        formatDate(profileData.statistics.customerSince) : 'Today'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Amount</div>
                    <div className="text-xl font-bold text-green-600">
                      {profileData?.statistics?.totalPurchases?.toLocaleString() || 0} EGP
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Profile'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Mail className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerProfileDialog;