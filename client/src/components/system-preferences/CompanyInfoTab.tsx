import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Building2, MapPin, Phone, Mail, Globe, FileText, Upload, X } from 'lucide-react';

interface CompanyInfoTabProps {
  preferences: any[] | undefined;
  refetch: () => void;
}

const CompanyInfoTab: React.FC<CompanyInfoTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract company info from preferences
  const getPreferenceValue = (key: string) => {
    const pref = preferences?.find(p => p.key === key);
    return pref ? pref.value : '';
  };

  const [companyInfo, setCompanyInfo] = useState({
    companyName: getPreferenceValue('company_name') || 'Premier ERP',
    companyLogo: getPreferenceValue('company_logo') || '',
    address: getPreferenceValue('company_address') || '',
    city: getPreferenceValue('company_city') || '',
    state: getPreferenceValue('company_state') || '',
    zipCode: getPreferenceValue('company_zip') || '',
    country: getPreferenceValue('company_country') || '',
    phone: getPreferenceValue('company_phone') || '',
    email: getPreferenceValue('company_email') || '',
    website: getPreferenceValue('company_website') || '',
    taxId: getPreferenceValue('company_tax_id') || '',
    registrationNumber: getPreferenceValue('company_registration') || '',
    description: getPreferenceValue('company_description') || '',
    industry: getPreferenceValue('company_industry') || 'Pharmaceutical Manufacturing',
    foundedYear: getPreferenceValue('company_founded') || '',
    employeeCount: getPreferenceValue('company_employees') || ''
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const updatePreferenceMutation = useMutation({
    mutationFn: async (data: { key: string; value: string; category: string }) => {
      const response = await fetch('/api/system-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update preference');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-preferences'] });
      refetch();
      toast({
        title: "Success",
        description: "Company information updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update company information",
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload logo');
      return response.json();
    },
    onSuccess: (data) => {
      handleInputChange('companyLogo', data.url);
      setLogoFile(null);
      setIsUploading(false);
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    },
    onError: (error) => {
      setIsUploading(false);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    const updates = [
      { key: 'company_name', value: companyInfo.companyName, category: 'company' },
      { key: 'company_logo', value: companyInfo.companyLogo, category: 'company' },
      { key: 'company_address', value: companyInfo.address, category: 'company' },
      { key: 'company_city', value: companyInfo.city, category: 'company' },
      { key: 'company_state', value: companyInfo.state, category: 'company' },
      { key: 'company_zip', value: companyInfo.zipCode, category: 'company' },
      { key: 'company_country', value: companyInfo.country, category: 'company' },
      { key: 'company_phone', value: companyInfo.phone, category: 'company' },
      { key: 'company_email', value: companyInfo.email, category: 'company' },
      { key: 'company_website', value: companyInfo.website, category: 'company' },
      { key: 'company_tax_id', value: companyInfo.taxId, category: 'company' },
      { key: 'company_registration', value: companyInfo.registrationNumber, category: 'company' },
      { key: 'company_description', value: companyInfo.description, category: 'company' },
      { key: 'company_industry', value: companyInfo.industry, category: 'company' },
      { key: 'company_founded', value: companyInfo.foundedYear, category: 'company' },
      { key: 'company_employees', value: companyInfo.employeeCount, category: 'company' }
    ];

    for (const update of updates) {
      if (update.value) {
        await updatePreferenceMutation.mutateAsync(update);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    
    setIsUploading(true);
    uploadLogoMutation.mutate(logoFile);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    handleInputChange('companyLogo', '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Company Information</h3>
          <p className="text-sm text-muted-foreground">
            Manage your company details and branding information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyInfo.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={companyInfo.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="e.g., Pharmaceutical Manufacturing"
              />
            </div>

            <div>
              <Label htmlFor="foundedYear">Founded Year</Label>
              <Input
                id="foundedYear"
                type="number"
                value={companyInfo.foundedYear}
                onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                placeholder="e.g., 2020"
              />
            </div>

            <div>
              <Label htmlFor="employeeCount">Number of Employees</Label>
              <Input
                id="employeeCount"
                type="number"
                value={companyInfo.employeeCount}
                onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                placeholder="e.g., 150"
              />
            </div>

            <div>
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                value={companyInfo.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your company"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={companyInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={companyInfo.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={companyInfo.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={companyInfo.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={companyInfo.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center">
                <Phone className="mr-1 h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                value={companyInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-1 h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={companyInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <Label htmlFor="website" className="flex items-center">
                <Globe className="mr-1 h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                value={companyInfo.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.company.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Legal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Legal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taxId">Tax Identification Number</Label>
              <Input
                id="taxId"
                value={companyInfo.taxId}
                onChange={(e) => handleInputChange('taxId', e.target.value)}
                placeholder="Enter tax ID"
              />
            </div>

            <div>
              <Label htmlFor="registrationNumber">Business Registration Number</Label>
              <Input
                id="registrationNumber"
                value={companyInfo.registrationNumber}
                onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                placeholder="Enter registration number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyLogo">Company Logo URL</Label>
              <Input
                id="companyLogo"
                value={companyInfo.companyLogo}
                onChange={(e) => handleInputChange('companyLogo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a URL to your company logo image
              </p>
            </div>

            <div className="relative">
              <Label>Or Upload Logo</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-center">
                        <span className="font-medium">Click to upload</span>
                        <p className="text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {logoFile && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">
                      <p className="font-medium">{logoFile.name}</p>
                      <p className="text-muted-foreground">
                        {(logoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={handleUploadLogo}
                      disabled={isUploading || uploadLogoMutation.isPending}
                    >
                      {isUploading || uploadLogoMutation.isPending ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLogoFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {companyInfo.companyLogo && (
              <div>
                <div className="flex items-center justify-between">
                  <Label>Logo Preview</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                <div className="mt-2 p-4 border rounded-lg bg-muted/10">
                  <img
                    src={companyInfo.companyLogo}
                    alt="Company Logo"
                    className="max-h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={updatePreferenceMutation.isPending}
          className="min-w-32"
        >
          {updatePreferenceMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default CompanyInfoTab;