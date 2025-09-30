import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calculator, FileText, TrendingUp, CreditCard, Building, Globe } from 'lucide-react';

interface FinancialConfigurationTabProps {
  preferences: any;
  refetch: () => void;
}

const FinancialConfigurationTab: React.FC<FinancialConfigurationTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    baseCurrency: 'EGP',
    vatRate: '14',
    fiscalYearStart: '01-01',
    invoicePrefix: 'INV',
    quotationPrefix: 'QUO',
    autoNumbering: true,
    multiCurrency: false,
    paymentTerms: '30',
    creditLimit: '10000',
    discountCalculation: 'line',
    taxInclusive: false,
    etaIntegration: false,
  });

  useEffect(() => {
    if (preferences) {
      const financialPrefs = preferences.filter((pref: any) => pref.category === 'financial');
      if (financialPrefs.length) {
        const prefsObj: any = {};
        financialPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('financial_', '')] = pref.value;
        });
        
        setSettings({
          baseCurrency: prefsObj.baseCurrency || 'EGP',
          vatRate: prefsObj.vatRate?.toString() || '14',
          fiscalYearStart: prefsObj.fiscalYearStart || '01-01',
          invoicePrefix: prefsObj.invoicePrefix || 'INV',
          quotationPrefix: prefsObj.quotationPrefix || 'QUO',
          autoNumbering: prefsObj.autoNumbering || true,
          multiCurrency: prefsObj.multiCurrency || false,
          paymentTerms: prefsObj.paymentTerms?.toString() || '30',
          creditLimit: prefsObj.creditLimit?.toString() || '10000',
          discountCalculation: prefsObj.discountCalculation || 'line',
          taxInclusive: prefsObj.taxInclusive || false,
          etaIntegration: prefsObj.etaIntegration || false,
        });
      }
    }
  }, [preferences]);

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      return apiRequest('PATCH', `/api/system-preferences/${key}`, { value });
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update financial setting.',
        variant: 'destructive',
      });
    },
  });

  const createPreferenceMutation = useMutation({
    mutationFn: async (preference: any) => {
      return apiRequest('POST', `/api/system-preferences`, preference);
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create financial setting.',
        variant: 'destructive',
      });
    },
  });

  const handleChangeSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const fullKey = `financial_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'financial',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Financial setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Financial Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure accounting, taxation, and financial reporting settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Test ETA Connection
          </Button>
          <Button variant="outline" size="sm">
            Sync Settings
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <DollarSign className="h-6 w-6 mx-auto text-green-700 mb-1" />
          <div className="text-sm text-green-600">Base Currency</div>
          <div className="text-lg font-bold text-green-700">{settings.baseCurrency}</div>
        </div>
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Calculator className="h-6 w-6 mx-auto text-blue-700 mb-1" />
          <div className="text-sm text-blue-600">VAT Rate</div>
          <div className="text-lg font-bold text-blue-700">{settings.vatRate}%</div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <FileText className="h-6 w-6 mx-auto text-purple-700 mb-1" />
          <div className="text-sm text-purple-600">Payment Terms</div>
          <div className="text-lg font-bold text-purple-700">{settings.paymentTerms} days</div>
        </div>
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <Globe className="h-6 w-6 mx-auto text-orange-700 mb-1" />
          <div className="text-sm text-orange-600">ETA Status</div>
          <div className="text-lg font-bold text-orange-700">
            {settings.etaIntegration ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Currency & Taxation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Currency & Taxation</CardTitle>
              <CardDescription>Configure currency settings and tax calculations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="baseCurrency">Base Currency</Label>
              <Select
                value={settings.baseCurrency}
                onValueChange={(value) => handleChangeSetting('baseCurrency', value)}
              >
                <SelectTrigger id="baseCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EGP">Egyptian Pound (EGP)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  <SelectItem value="SAR">Saudi Riyal (SAR)</SelectItem>
                  <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Primary currency for financial transactions
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="vatRate">Default VAT Rate (%)</Label>
              <Input
                id="vatRate"
                type="number"
                value={settings.vatRate}
                onChange={(e) => handleChangeSetting('vatRate', e.target.value)}
                min="0"
                max="30"
                step="0.1"
              />
              <p className="text-sm text-muted-foreground">
                Default tax rate applied to products and services
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="multiCurrency">Multi-Currency Support</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable multiple currency transactions
                  </p>
                </div>
              </div>
              <Switch
                id="multiCurrency"
                checked={settings.multiCurrency}
                onCheckedChange={(checked) => handleChangeSetting('multiCurrency', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="taxInclusive">Tax Inclusive Pricing</Label>
                  <p className="text-sm text-muted-foreground">
                    Product prices include tax by default
                  </p>
                </div>
              </div>
              <Switch
                id="taxInclusive"
                checked={settings.taxInclusive}
                onCheckedChange={(checked) => handleChangeSetting('taxInclusive', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Document Settings</CardTitle>
              <CardDescription>Configure invoice and quotation numbering</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                value={settings.invoicePrefix}
                onChange={(e) => handleChangeSetting('invoicePrefix', e.target.value)}
                placeholder="INV"
              />
              <p className="text-sm text-muted-foreground">
                Prefix for auto-generated invoice numbers
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="quotationPrefix">Quotation Prefix</Label>
              <Input
                id="quotationPrefix"
                value={settings.quotationPrefix}
                onChange={(e) => handleChangeSetting('quotationPrefix', e.target.value)}
                placeholder="QUO"
              />
              <p className="text-sm text-muted-foreground">
                Prefix for auto-generated quotation numbers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="fiscalYearStart">Fiscal Year Start</Label>
              <Input
                id="fiscalYearStart"
                value={settings.fiscalYearStart}
                onChange={(e) => handleChangeSetting('fiscalYearStart', e.target.value)}
                placeholder="MM-DD"
              />
              <p className="text-sm text-muted-foreground">
                Start date of fiscal year (MM-DD format)
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="discountCalculation">Discount Calculation</Label>
              <Select
                value={settings.discountCalculation}
                onValueChange={(value) => handleChangeSetting('discountCalculation', value)}
              >
                <SelectTrigger id="discountCalculation">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Item Level</SelectItem>
                  <SelectItem value="document">Document Level</SelectItem>
                  <SelectItem value="both">Both Methods</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How discounts are calculated and applied
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="autoNumbering">Auto Numbering</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically generate sequential document numbers
                </p>
              </div>
            </div>
            <Switch
              id="autoNumbering"
              checked={settings.autoNumbering}
              onCheckedChange={(checked) => handleChangeSetting('autoNumbering', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment & Credit */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Payment & Credit Management</CardTitle>
              <CardDescription>Configure payment terms and credit limits</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="paymentTerms">Default Payment Terms (Days)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={settings.paymentTerms}
                onChange={(e) => handleChangeSetting('paymentTerms', e.target.value)}
                min="0"
                max="365"
              />
              <p className="text-sm text-muted-foreground">
                Default number of days for payment
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="creditLimit">Default Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                value={settings.creditLimit}
                onChange={(e) => handleChangeSetting('creditLimit', e.target.value)}
                min="0"
              />
              <p className="text-sm text-muted-foreground">
                Default credit limit for new customers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ETA Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">ETA Integration</CardTitle>
              <CardDescription>Egyptian Tax Authority electronic invoicing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="etaIntegration">Enable ETA Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Connect to Egyptian Tax Authority for electronic invoicing
                </p>
              </div>
            </div>
            <Switch
              id="etaIntegration"
              checked={settings.etaIntegration}
              onCheckedChange={(checked) => handleChangeSetting('etaIntegration', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialConfigurationTab;