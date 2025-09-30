import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Save,
  FileText,
  Info,
  CreditCard,
  Banknote
} from 'lucide-react';

interface InvoicePreviewSettingsTabProps {
  preferences: any;
  refetch: () => void;
}

const InvoicePreviewSettingsTab: React.FC<InvoicePreviewSettingsTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  // Company Information Settings
  const [companyName, setCompanyName] = useState('Morgan ERP');
  const [companyDescription, setCompanyDescription] = useState('Enterprise Resource Planning System');
  const [companyAddress, setCompanyAddress] = useState('123 Business District');
  const [companyCity, setCompanyCity] = useState('Cairo, Egypt 11511');
  const [companyPhone, setCompanyPhone] = useState('+20 2 1234 5678');
  const [companyEmail, setCompanyEmail] = useState('support@premiererp.com');
  const [taxNumber, setTaxNumber] = useState('EG-123456789');
  const [commercialRegister, setCommercialRegister] = useState('CR-987654321');
  
  // Payment Information
  const [bankName, setBankName] = useState('National Bank of Egypt');
  const [accountNumber, setAccountNumber] = useState('1234567890123456');
  const [iban, setIban] = useState('EG380001234567890123456789012');
  const [swiftCode, setSwiftCode] = useState('NBEAEGCXALEX');
  
  // Footer Settings
  const [footerMessage, setFooterMessage] = useState('Thank you for your business with Morgan ERP!');
  const [footerEmail, setFooterEmail] = useState('support@premiererp.com');
  const [footerNote, setFooterNote] = useState('Payment is due within 30 days. Late payments may incur additional charges.');
  
  // Invoice Terms
  const [paymentTerms, setPaymentTerms] = useState(`• Payment is due within 30 days of invoice date
• Late payments may incur additional charges at 1.5% per month
• All pharmaceutical products are subject to quality assurance
• Returns accepted within 14 days with original packaging
• Invoice disputes must be raised within 7 days
• All amounts are in Egyptian Pounds (EGP)
• This invoice complies with Egyptian Tax Authority regulations`);

  const handleSaveSettings = async () => {
    try {
      // In a real implementation, this would save to the database
      toast({
        title: "Settings Saved",
        description: "Invoice preview settings have been updated successfully.",
        variant: "default"
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save invoice preview settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Receipt className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Invoice Preview Settings</h2>
          <p className="text-muted-foreground">
            Configure company information and payment details for invoice PDF downloads
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
            <CardDescription>
              This information appears in the header of all invoice PDFs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-company-name">Company Name</Label>
              <Input
                id="inv-company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inv-company-description">Company Description</Label>
              <Input
                id="inv-company-description"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Brief company description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inv-company-address">Address Line 1</Label>
              <Input
                id="inv-company-address"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Street address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inv-company-city">Address Line 2</Label>
              <Input
                id="inv-company-city"
                value={companyCity}
                onChange={(e) => setCompanyCity(e.target.value)}
                placeholder="City, Country, Postal Code"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-company-phone">Phone Number</Label>
                <Input
                  id="inv-company-phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inv-company-email">Email Address</Label>
                <Input
                  id="inv-company-email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax-number">Tax Number</Label>
                <Input
                  id="tax-number"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="Tax registration number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commercial-register">Commercial Register</Label>
                <Input
                  id="commercial-register"
                  value={commercialRegister}
                  onChange={(e) => setCommercialRegister(e.target.value)}
                  placeholder="Commercial register number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
            <CardDescription>
              Bank details and payment information for invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="International Bank Account Number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="swift-code">SWIFT Code</Label>
              <Input
                id="swift-code"
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
                placeholder="Bank SWIFT/BIC code"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Footer Settings
          </CardTitle>
          <CardDescription>
            Configure the footer message and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="inv-footer-message">Thank You Message</Label>
            <Textarea
              id="inv-footer-message"
              value={footerMessage}
              onChange={(e) => setFooterMessage(e.target.value)}
              placeholder="Thank you message for invoices"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inv-footer-email">Contact Email</Label>
            <Input
              id="inv-footer-email"
              type="email"
              value={footerEmail}
              onChange={(e) => setFooterEmail(e.target.value)}
              placeholder="Contact email for questions"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inv-footer-note">Payment Note</Label>
            <Textarea
              id="inv-footer-note"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              placeholder="Payment terms and conditions"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Payment Terms & Conditions
          </CardTitle>
          <CardDescription>
            Set default payment terms and legal conditions for invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="payment-terms">Payment Terms & Conditions</Label>
            <Textarea
              id="payment-terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Enter payment terms and conditions"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These payment terms will be included in all invoice PDFs for legal compliance and clarity.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Invoice Settings
        </Button>
      </div>
    </div>
  );
};

export default InvoicePreviewSettingsTab;