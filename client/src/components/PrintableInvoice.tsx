import React from 'react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import logoPath from '@assets/P_1749320448134.png';

interface InvoiceItem {
  productName: string;
  category?: string;
  batchNo?: string;
  quantity: number;
  unitPrice: number;
  total: number;
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

interface PrintableInvoiceProps {
  invoiceNumber: string;
  paperInvoiceNumber?: string;
  approvalNumber?: string;
  date: Date;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paymentTerms?: string;
  notes?: string;
  amountPaid?: number;
  paymentStatus: string;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  invoiceNumber,
  paperInvoiceNumber,
  approvalNumber,
  date,
  customer,
  items,
  subtotal,
  discountAmount = 0,
  taxRate,
  taxAmount,
  grandTotal,
  paymentTerms,
  notes,
  amountPaid = 0,
  paymentStatus,
}) => {
  const { t, isRTL } = useLanguage();
  const balance = grandTotal - amountPaid;

  return (
    <div className={`printable-invoice bg-white p-8 max-w-4xl mx-auto text-black ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between items-start mb-8 border-b pb-6`}>
        <div className={`company-info flex ${isRTL ? 'flex-row-reverse' : ''} items-start gap-4`}>
          <img 
            src={logoPath} 
            alt="Premier ERP Logo" 
            className="w-16 h-16 object-contain"
          />
          <div className={isRTL ? 'text-right' : ''}>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Premier ERP</h1>
            <p className="text-gray-600 text-sm">{t('enterpriseResourcePlanningSystem')}</p>
            <div className="mt-4 text-sm text-gray-600">
              <p>123 {t('businessDistrict')}</p>
              <p>{t('cairo')}, {t('egypt')} 11511</p>
              <p>{t('phone')}: +20 2 1234 5678</p>
              <p>{t('email')}: info@premieregypt.com</p>
            </div>
          </div>
        </div>
        
        <div className={`invoice-header ${isRTL ? 'text-left' : 'text-right'}`}>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('invoice').toUpperCase()}</h2>
          <div className="text-sm">
            <p><span className="font-semibold">{t('invoiceNumber')}:</span> {invoiceNumber}</p>
            {paperInvoiceNumber && (
              <p><span className="font-semibold">{t('paperInvoiceNumber')}:</span> {paperInvoiceNumber}</p>
            )}
            {approvalNumber && (
              <p><span className="font-semibold">{t('approvalNo')}:</span> {approvalNumber}</p>
            )}
            <p><span className="font-semibold">{t('date')}:</span> {format(date, 'dd/MM/yyyy')}</p>
            <p><span className="font-semibold">{t('dueDate')}:</span> {format(new Date(date.getTime() + (parseInt(paymentTerms || '0') * 24 * 60 * 60 * 1000)), 'dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="customer-info mb-8">
        <h3 className={`text-lg font-semibold text-gray-800 mb-3 ${isRTL ? 'text-right' : ''}`}>{t('billTo')}:</h3>
        <div className="bg-gray-50 p-4 rounded border">
          <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between items-start`}>
            <div className="flex-1">
              {customer.company ? (
                <div className={isRTL ? 'text-right' : ''}>
                  <h3 className="font-medium text-lg">{customer.company}</h3>
                  <p className="text-sm text-gray-600">{customer.name}</p>
                </div>
              ) : (
                <h3 className={`font-medium text-lg ${isRTL ? 'text-right' : ''}`}>{customer.company || customer.name}</h3>
              )}
              
              {/* Customer Code and Mobile prominently displayed */}
              <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} flex-wrap gap-2 mt-2`}>
                {customer.id && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {t('code')}: CUST-{String(customer.id).padStart(4, '0')}
                  </span>
                )}
                {customer.phone && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    {t('mobile')}: {customer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Other customer details */}
          <div className={`space-y-1 pt-2 border-t mt-3 ${isRTL ? 'text-right' : ''}`}>


            {customer.taxNumber && (
              <p className="text-sm text-gray-600">{t('etaNumber')}: {customer.taxNumber}</p>
            )}
            {customer.address && (
              <p className="text-sm text-gray-600">{t('address')}: {customer.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="items-table mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-semibold`}>{t('itemDescription')}</th>
              <th className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-semibold`}>{t('category')}</th>
              <th className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} font-semibold`}>{t('batchNo')}</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">{t('qty')}</th>
              <th className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-left' : 'text-right'} font-semibold`}>{t('unitPrice')}</th>
              <th className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-left' : 'text-right'} font-semibold`}>{t('total')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-right' : ''}`}>{item.productName}</td>
                <td className={`border border-gray-300 px-4 py-3 text-gray-600 ${isRTL ? 'text-right' : ''}`}>{item.category || '-'}</td>
                <td className={`border border-gray-300 px-4 py-3 text-gray-600 ${isRTL ? 'text-right' : ''}`}>{item.batchNo || '-'}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                <td className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>EGP {item.unitPrice.toFixed(2)}</td>
                <td className={`border border-gray-300 px-4 py-3 ${isRTL ? 'text-left' : 'text-right'} font-semibold`}>EGP {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} mb-8`}>
        <div className="w-80">
          <div className="border border-gray-300 bg-gray-50">
            <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between px-4 py-2 border-b border-gray-300`}>
              <span className="font-medium">{t('subtotal')}:</span>
              <span>EGP {subtotal.toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between px-4 py-2 border-b border-gray-300 text-green-600`}>
                <span className="font-medium">{t('discount')}:</span>
                <span>-EGP {discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between px-4 py-2 border-b border-gray-300`}>
              <span className="font-medium">{t('tax')} ({taxRate}%):</span>
              <span>EGP {taxAmount.toFixed(2)}</span>
            </div>
            
            <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between px-4 py-3 bg-blue-600 text-white font-bold text-lg`}>
              <span>{t('totalAmount')}:</span>
              <span>EGP {grandTotal.toFixed(2)}</span>
            </div>
            
            {amountPaid > 0 && (
              <>
                <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between px-4 py-2 border-b border-gray-300 text-green-600`}>
                  <span className="font-medium">{t('amountPaid')}:</span>
                  <span>EGP {amountPaid.toFixed(2)}</span>
                </div>
                <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} justify-between px-4 py-2 font-semibold`}>
                  <span>{t('balanceDue')}:</span>
                  <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                    EGP {balance.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="payment-status mb-6">
        <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} items-center gap-4`}>
          <span className="font-semibold">{t('paymentStatus')}:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
            paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {t(paymentStatus)}
          </span>
        </div>
        {paymentTerms && (
          <p className={`text-sm text-gray-600 mt-2 ${isRTL ? 'text-right' : ''}`}>
            <span className="font-medium">{t('paymentTerms')}:</span> {paymentTerms} {t('days')}
          </p>
        )}
      </div>

      {/* Notes */}
      {notes && (
        <div className="notes mb-8">
          <h3 className={`font-semibold text-gray-800 mb-2 ${isRTL ? 'text-right' : ''}`}>{t('notes')}:</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <p className={`text-gray-700 ${isRTL ? 'text-right' : ''}`}>{notes}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer border-t pt-6 mt-8">
        <div className="text-center text-sm text-gray-600">
          <p className="font-semibold mb-2">{t('thankYouForBusiness')}</p>
          <p>{t('invoiceGeneratedOn')} {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          <p className="mt-2">{t('forQuestionsContact')} support@premiererp.com</p>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          .printable-invoice {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 20px !important;
            max-width: none !important;
            width: 100% !important;
          }
          
          .bg-gray-50 {
            background-color: #f9f9f9 !important;
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