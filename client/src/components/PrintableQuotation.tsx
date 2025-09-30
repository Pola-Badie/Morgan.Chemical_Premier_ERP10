import React from 'react';
import { format } from 'date-fns';
import logoPath from '@assets/P_1749320448134.png';

// Default terms and conditions for pharmaceutical quotations
const DEFAULT_TERMS = `1. Validity: This quotation is valid for 30 days from the date of issue.

2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.

3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.

4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.

5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.

6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.`;

interface QuotationItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  total: number;
  type: 'manufacturing' | 'refining' | 'finished';
  grade?: string; // P (Pharmaceutical), F (Food), T (Technical)
  processingTime?: number;
  qualityGrade?: string;
  specifications?: string;
}

interface PackagingItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

interface Customer {
  id?: number;
  name: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  address?: string;
  sector?: string;
  taxNumber?: string;
}

interface PrintableQuotationProps {
  quotationNumber: string;
  date: Date;
  validUntil: string;
  customer: Customer;
  items: QuotationItem[];
  packagingItems?: PackagingItem[];
  subtotal: number;
  transportationFees: number;
  packagingFees: number;
  vatPercentage: number;
  vatAmount: number;
  grandTotal: number;
  notes?: string;
  transportationType?: string;
  transportationNotes?: string;
  packagingType?: string;
  packagingNotes?: string;
  quotationType: 'manufacturing' | 'refining' | 'finished';
  termsAndConditions?: string;
}

export const PrintableQuotation: React.FC<PrintableQuotationProps> = ({
  quotationNumber,
  date,
  validUntil,
  customer,
  items,
  packagingItems = [],
  subtotal,
  transportationFees,
  packagingFees,
  vatPercentage,
  vatAmount,
  grandTotal,
  notes,
  transportationType,
  transportationNotes,
  packagingType,
  packagingNotes,
  quotationType,
  termsAndConditions,
}) => {
  const validUntilDate = validUntil ? new Date(validUntil) : new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);

  const getQuotationTypeLabel = (type: string) => {
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

  return (
    <div className="printable-quotation bg-white p-6 max-w-4xl mx-auto text-black text-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 border-b pb-3">
        <div className="company-info flex items-start gap-4">
          <img 
            src={logoPath} 
            alt="Morgan ERP Logo" 
            className="w-16 h-16 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-blue-600 mb-1">Morgan ERP</h1>
            <p className="text-gray-600 text-xs">Enterprise Resource Planning System</p>
            <div className="mt-2 text-xs text-gray-600">
              <p>123 Business District</p>
              <p>Cairo, Egypt 11511</p>
              <p>Phone: +20 2 1234 5678</p>
              <p>Email: info@morganerp.com</p>
            </div>
          </div>
        </div>
        
        <div className="quotation-header text-right">
          <h2 className="text-lg font-bold text-gray-800 mb-1">QUOTATION</h2>
          <div className="text-xs">
            <p><span className="font-semibold">Quotation #:</span> {quotationNumber}</p>
            <p><span className="font-semibold">Date:</span> {format(date, 'dd/MM/yyyy')}</p>
            <p><span className="font-semibold">Valid Until:</span> {format(validUntilDate, 'dd/MM/yyyy')}</p>
            <p><span className="font-semibold">Service Type:</span> {getQuotationTypeLabel(quotationType)}</p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="customer-info mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Quote For:</h3>
        <div className="bg-gray-50 p-4 rounded border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {customer.company ? (
                <div>
                  <h3 className="font-medium text-lg">{customer.company}</h3>
                  <p className="text-sm text-gray-600">{customer.name}</p>
                </div>
              ) : (
                <h3 className="font-medium text-lg">{customer.company || customer.name}</h3>
              )}
              
              {/* Customer Code and Mobile prominently displayed */}
              <div className="flex flex-wrap gap-2 mt-2">
                {customer.id && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Code: CUST-{String(customer.id).padStart(4, '0')}
                  </span>
                )}
                {customer.phone && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    Mobile: {customer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Other customer details */}
          <div className="space-y-1 pt-2 border-t mt-3">
            {customer.taxNumber && (
              <p className="text-sm text-gray-600">ETA Number: {customer.taxNumber}</p>
            )}
            {customer.address && (
              <p className="text-sm text-gray-600">Address: {customer.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="items-table mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Quoted Items & Services</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Item/Service</th>
              <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-xs">Description</th>
              <th className="border border-gray-300 px-2 py-1 text-center font-semibold text-xs">Qty</th>
              <th className="border border-gray-300 px-2 py-1 text-center font-semibold text-xs">UoM</th>
              <th className="border border-gray-300 px-2 py-1 text-center font-semibold text-xs">Grade</th>
              <th className="border border-gray-300 px-2 py-1 text-right font-semibold text-xs">Unit Price</th>
              <th className="border border-gray-300 px-2 py-1 text-right font-semibold text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1 font-medium text-xs">{item.productName}</td>
                <td className="border border-gray-300 px-2 py-1 text-gray-600 text-xs">
                  {item.description}
                  {item.type === 'manufacturing' && item.processingTime && (
                    <div className="text-xs mt-1 text-blue-600">
                      Processing Time: {item.processingTime} days
                      {item.qualityGrade && ` | Quality: ${item.qualityGrade}`}
                    </div>
                  )}
                  {item.type === 'refining' && item.specifications && (
                    <div className="text-xs mt-1 text-blue-600">
                      Specifications: {item.specifications}
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-1 text-center text-xs">{item.quantity}</td>
                <td className="border border-gray-300 px-2 py-1 text-center text-xs">{item.uom}</td>
                <td className="border border-gray-300 px-2 py-1 text-center">
                  <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                    {item.grade === 'P' ? 'Pharmaceutical' : 
                     item.grade === 'F' ? 'Food Grade' : 
                     item.grade === 'T' ? 'Technical' : 
                     item.grade || 'N/A'}
                  </span>
                </td>
                <td className="border border-gray-300 px-2 py-1 text-right text-xs">EGP {item.unitPrice.toFixed(2)}</td>
                <td className="border border-gray-300 px-2 py-1 text-right font-semibold text-xs">EGP {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Transportation Section */}
      {transportationFees > 0 && (
        <div className="transportation-info mb-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Transportation & Delivery</h3>
          <div className="bg-blue-50 p-4 rounded border">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-blue-900">{getTransportationTypeLabel(transportationType)}</p>
                {transportationNotes && (
                  <p className="text-sm text-blue-700 mt-1">{transportationNotes}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-900">EGP {transportationFees.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Packaging Items Section */}
      {packagingItems && packagingItems.length > 0 && (
        <div className="packaging-info mb-3">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Packaging Items</h3>
          <div className="space-y-3">
            {packagingItems.map((item, index) => (
              <div key={item.id} className="bg-green-50 p-4 rounded border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-green-900">{item.type}</p>
                    {item.description && (
                      <p className="text-sm text-green-700 mt-1">{item.description}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-green-600 mt-1 italic">{item.notes}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-semibold text-green-900">EGP {item.total.toFixed(2)}</p>
                    <p className="text-xs text-green-600">{item.quantity} × EGP {item.unitPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals Section */}
      <div className="flex justify-end mb-4">
        <div className="w-80">
          <div className="border border-gray-300 bg-gray-50">
            <div className="flex justify-between px-2 py-1 border-b border-gray-300 text-xs">
              <span className="font-medium">Subtotal:</span>
              <span>EGP {subtotal.toFixed(2)}</span>
            </div>
            
            {transportationFees > 0 && (
              <div className="flex justify-between px-2 py-1 border-b border-gray-300 text-xs">
                <span className="font-medium">Transportation:</span>
                <span>EGP {transportationFees.toFixed(2)}</span>
              </div>
            )}
            
            {packagingFees > 0 && (
              <div className="flex justify-between px-2 py-1 border-b border-gray-300 text-xs">
                <span className="font-medium">Packaging:</span>
                <span>EGP {packagingFees.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between px-2 py-1 border-b border-gray-300 text-xs">
              <span className="font-medium">VAT ({vatPercentage}%):</span>
              <span>EGP {vatAmount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between px-2 py-2 bg-blue-600 text-white font-bold text-sm">
              <span>Total Amount:</span>
              <span>EGP {grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="terms mb-4 page-break-before">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Terms & Conditions</h3>
        <div className="bg-gray-50 p-4 rounded border text-sm">
          <pre className="whitespace-pre-wrap font-sans text-gray-700">{(termsAndConditions ?? '').trim() || DEFAULT_TERMS}</pre>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="notes mb-3">
          <h3 className="font-semibold text-gray-800 mb-1 text-sm">Additional Notes:</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="text-gray-700">{notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer border-t pt-2 mt-3">
        <div className="text-center text-xs text-gray-600">
          <p className="font-semibold mb-2">Thank you for considering Morgan ERP for your pharmaceutical needs!</p>
          <p>This quotation was generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p className="mt-2">For any questions regarding this quotation, please contact us at support@premiererp.com</p>
          <p className="mt-1 text-xs">All prices are in USD and exclude applicable taxes unless otherwise stated.</p>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          .printable-quotation {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 15px !important;
            max-width: none !important;
            width: 100% !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          
          .page-break-before {
            page-break-before: always !important;
          }
          
          .bg-gray-50 {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-blue-50 {
            background-color: #eff6ff !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .bg-blue-600 {
            background-color: #2563eb !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .text-blue-600 {
            color: #2563eb !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .border {
            border: 1px solid #000 !important;
          }
          
          table {
            page-break-inside: avoid;
          }
          
          .footer {
            page-break-inside: avoid;
          }
        }
        `
      }} />
    </div>
  );
};