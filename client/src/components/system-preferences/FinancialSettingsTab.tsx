import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface FinancialSettingsTabProps {
  preferences: any;
  refetch: () => void;
}

const FinancialSettingsTab: React.FC<FinancialSettingsTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for financial settings
  const [settings, setSettings] = useState({
    currency: 'USD',
    taxPercentage: '15',
    allowPartialPayments: true,
    paymentTerms: '30',
    autoStockDeduction: true,
  });

  // Initialize state from preferences
  useEffect(() => {
    if (preferences) {
      const financialPrefs = preferences.filter((pref: any) => pref.category === 'financial');
      if (financialPrefs.length) {
        const prefsObj: any = {};
        financialPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('financial_', '')] = pref.value;
        });
        
        setSettings({
          currency: prefsObj.currency || 'USD',
          taxPercentage: prefsObj.taxPercentage?.toString() || '15',
          allowPartialPayments: prefsObj.allowPartialPayments !== undefined 
            ? prefsObj.allowPartialPayments 
            : true,
          paymentTerms: prefsObj.paymentTerms?.toString() || '30',
          autoStockDeduction: prefsObj.autoStockDeduction !== undefined 
            ? prefsObj.autoStockDeduction 
            : true,
        });
      }
    }
  }, [preferences]);

  // Update preferences mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      return apiRequest('PATCH', `/api/system-preferences/${key}`, { value });
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update setting.',
        variant: 'destructive',
      });
    },
  });

  // Create preference mutation
  const createPreferenceMutation = useMutation({
    mutationFn: async (preference: any) => {
      return apiRequest('POST', `/api/system-preferences`, preference);
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create setting.',
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

  const handleSaveAll = async () => {
    setIsLoading(true);
    
    try {
      // Create array of all settings to save
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key: `financial_${key}`,
        value,
        existingPref: preferences?.find((pref: any) => pref.key === `financial_${key}`),
      }));
      
      // Process each setting
      for (const setting of settingsToSave) {
        if (setting.existingPref) {
          await updatePreferenceMutation.mutateAsync({ 
            key: setting.key, 
            value: setting.value 
          });
        } else {
          await createPreferenceMutation.mutateAsync({
            key: setting.key,
            value: setting.value,
            category: 'financial',
            label: setting.key.replace('financial_', '').charAt(0).toUpperCase() + 
                  setting.key.replace('financial_', '').slice(1).replace(/([A-Z])/g, ' $1'),
            description: `Financial setting for ${setting.key.replace('financial_', '')}`,
            dataType: typeof setting.value === 'boolean' ? 'boolean' : 'string',
          });
        }
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Financial settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save all settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Financial Configuration</h3>
        <Button onClick={handleSaveAll} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Settings
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency Settings */}
        <div className="space-y-3">
          <Label htmlFor="currency">Default Currency</Label>
          <Select
            value={settings.currency}
            onValueChange={(value) => handleChangeSetting('currency', value)}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
              <SelectItem value="EUR">Euro (EUR)</SelectItem>
              <SelectItem value="GBP">British Pound (GBP)</SelectItem>
              <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
              <SelectItem value="AUD">Australian Dollar (AUD)</SelectItem>
              <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
              <SelectItem value="CNY">Chinese Yuan (CNY)</SelectItem>
              <SelectItem value="INR">Indian Rupee (INR)</SelectItem>
              <SelectItem value="EGP">Egyptian Pound (EGP)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Default currency used for transactions
          </p>
        </div>
        
        {/* Tax Percentage */}
        <div className="space-y-3">
          <Label htmlFor="taxPercentage">VAT/Tax Percentage</Label>
          <Input
            id="taxPercentage"
            type="number"
            value={settings.taxPercentage}
            onChange={(e) => handleChangeSetting('taxPercentage', e.target.value)}
            min="0"
            max="100"
          />
          <p className="text-sm text-muted-foreground">
            Default tax rate applied to sales (%)
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Terms */}
        <div className="space-y-3">
          <Label htmlFor="paymentTerms">Default Payment Terms</Label>
          <Select
            value={settings.paymentTerms}
            onValueChange={(value) => handleChangeSetting('paymentTerms', value)}
          >
            <SelectTrigger id="paymentTerms">
              <SelectValue placeholder="Select payment terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Immediate Payment</SelectItem>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="45">45 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Default payment period for invoices
          </p>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-base font-medium">Payment Options</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allowPartialPayments">Allow Partial Payments</Label>
            <p className="text-sm text-muted-foreground">
              Enable accepting partial payments for invoices
            </p>
          </div>
          <Switch
            id="allowPartialPayments"
            checked={settings.allowPartialPayments}
            onCheckedChange={(checked) => handleChangeSetting('allowPartialPayments', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="autoStockDeduction">Auto Stock Deduction</Label>
            <p className="text-sm text-muted-foreground">
              Automatically reduce inventory when invoice is paid
            </p>
          </div>
          <Switch
            id="autoStockDeduction"
            checked={settings.autoStockDeduction}
            onCheckedChange={(checked) => handleChangeSetting('autoStockDeduction', checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialSettingsTab;