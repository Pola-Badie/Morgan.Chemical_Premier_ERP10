import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface NotificationsTabProps {
  preferences: any;
  refetch: () => void;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for notification settings
  const [settings, setSettings] = useState({
    lowStockAlerts: true,
    expiryAlertDays: '30',
    criticalErrorNotifications: true,
    stockoutAlerts: true,
    emailNotifications: false,
  });

  // Initialize state from preferences
  useEffect(() => {
    if (preferences) {
      const notificationPrefs = preferences.filter((pref: any) => pref.category === 'notifications');
      if (notificationPrefs.length) {
        const prefsObj: any = {};
        notificationPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('notifications_', '')] = pref.value;
        });
        
        setSettings({
          lowStockAlerts: prefsObj.lowStockAlerts !== undefined ? prefsObj.lowStockAlerts : true,
          expiryAlertDays: prefsObj.expiryAlertDays?.toString() || '30',
          criticalErrorNotifications: prefsObj.criticalErrorNotifications !== undefined 
            ? prefsObj.criticalErrorNotifications 
            : true,
          stockoutAlerts: prefsObj.stockoutAlerts !== undefined ? prefsObj.stockoutAlerts : true,
          emailNotifications: prefsObj.emailNotifications || false,
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

    const fullKey = `notifications_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'notifications',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Notification setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    
    try {
      // Create array of all settings to save
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key: `notifications_${key}`,
        value,
        existingPref: preferences?.find((pref: any) => pref.key === `notifications_${key}`),
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
            category: 'notifications',
            label: setting.key.replace('notifications_', '').charAt(0).toUpperCase() + 
                  setting.key.replace('notifications_', '').slice(1).replace(/([A-Z])/g, ' $1'),
            description: `Notification setting for ${setting.key.replace('notifications_', '')}`,
            dataType: typeof setting.value === 'boolean' ? 'boolean' : 'string',
          });
        }
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Notification settings have been updated successfully.',
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
        <h3 className="text-lg font-medium">Notifications & Alerts</h3>
        <Button onClick={handleSaveAll} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Settings
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expiry Alert Days */}
        <div className="space-y-3">
          <Label htmlFor="expiryAlertDays">Expiry Alert Days</Label>
          <Input
            id="expiryAlertDays"
            type="number"
            value={settings.expiryAlertDays}
            onChange={(e) => handleChangeSetting('expiryAlertDays', e.target.value)}
            min="1"
          />
          <p className="text-sm text-muted-foreground">
            Number of days before expiry to start showing alerts
          </p>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-base font-medium">Alert Types</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Show alerts when products reach low stock threshold
            </p>
          </div>
          <Switch
            id="lowStockAlerts"
            checked={settings.lowStockAlerts}
            onCheckedChange={(checked) => handleChangeSetting('lowStockAlerts', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="stockoutAlerts">Stock-out Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Show urgent alerts when products are completely out of stock
            </p>
          </div>
          <Switch
            id="stockoutAlerts"
            checked={settings.stockoutAlerts}
            onCheckedChange={(checked) => handleChangeSetting('stockoutAlerts', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="criticalErrorNotifications">Critical Error Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show system notifications for critical errors
            </p>
          </div>
          <Switch
            id="criticalErrorNotifications"
            checked={settings.criticalErrorNotifications}
            onCheckedChange={(checked) => handleChangeSetting('criticalErrorNotifications', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Send alerts via email (requires email configuration)
            </p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => handleChangeSetting('emailNotifications', checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;