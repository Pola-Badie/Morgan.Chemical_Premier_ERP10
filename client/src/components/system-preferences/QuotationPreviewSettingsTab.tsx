import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  FileDown, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Save,
  FileText,
  Info
} from 'lucide-react';

interface QuotationPreviewSettingsTabProps {
  preferences: any;
  refetch: () => void;
}

const QuotationPreviewSettingsTab: React.FC<QuotationPreviewSettingsTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  // Company Information Settings
  const [companyName, setCompanyName] = useState('Morgan ERP');
  const [companyDescription, setCompanyDescription] = useState('Enterprise Resource Planning System');
  const [companyAddress, setCompanyAddress] = useState('123 Business District');
  const [companyCity, setCompanyCity] = useState('Cairo, Egypt 11511');
  const [companyPhone, setCompanyPhone] = useState('+20 2 1234 5678');
  const [companyEmail, setCompanyEmail] = useState('support@premiererp.com');
  
  // Footer Settings
  const [footerMessage, setFooterMessage] = useState('Thank you for considering Morgan ERP for your pharmaceutical needs!');
  const [footerEmail, setFooterEmail] = useState('support@premiererp.com');
  const [footerNote, setFooterNote] = useState('All prices are in EGP and exclude applicable taxes unless otherwise stated.');
  
  // Default Terms & Conditions
  const [defaultTerms, setDefaultTerms] = useState(`• Payment is due within 30 days of quotation date
• All pharmaceutical products are subject to quality assurance
• Prices are valid for 30 days from quotation date
• Delivery times may vary based on product availability
• Returns accepted within 14 days with original packaging
• All orders subject to credit approval
• Force majeure conditions may affect delivery schedules`);

  const handleSaveSettings = async () => {
    try {
      // In a real implementation, this would save to the database
      toast({
        title: "Settings Saved",
        description: "Quotation preview settings have been updated successfully.",
        variant: "default"
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save quotation preview settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileDown className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Quotation Preview Settings</h2>
          <p className="text-muted-foreground">
            Configure company information and footer details for quotation PDF downloads
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
              This information appears in the header of all quotation PDFs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-description">Company Description</Label>
              <Input
                id="company-description"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Brief company description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-address">Address Line 1</Label>
              <Input
                id="company-address"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Street address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-city">Address Line 2</Label>
              <Input
                id="company-city"
                value={companyCity}
                onChange={(e) => setCompanyCity(e.target.value)}
                placeholder="City, Country, Postal Code"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-phone">Phone Number</Label>
                <Input
                  id="company-phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-email">Email Address</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="footer-message">Thank You Message</Label>
              <Textarea
                id="footer-message"
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                placeholder="Thank you message for quotations"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="footer-email">Contact Email</Label>
              <Input
                id="footer-email"
                type="email"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="Contact email for questions"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="footer-note">Footer Note</Label>
              <Textarea
                id="footer-note"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                placeholder="Additional footer note (currency, terms, etc.)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Default Terms & Conditions
          </CardTitle>
          <CardDescription>
            Set default terms and conditions that will be pre-filled in new quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="default-terms">Terms & Conditions</Label>
            <Textarea
              id="default-terms"
              value={defaultTerms}
              onChange={(e) => setDefaultTerms(e.target.value)}
              placeholder="Enter default terms and conditions"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These terms will be automatically added to new quotations. Users can edit them as needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Quotation Settings
        </Button>
      </div>
    </div>
  );
};

export default QuotationPreviewSettingsTab;