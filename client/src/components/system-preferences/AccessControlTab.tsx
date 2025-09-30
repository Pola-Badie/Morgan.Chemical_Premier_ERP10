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

interface AccessControlTabProps {
  preferences: any;
  refetch: () => void;
}

const AccessControlTab: React.FC<AccessControlTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for access control settings
  const [settings, setSettings] = useState({
    sessionTimeout: '30',
    maintenanceMode: false,
    loginLogs: true,
  });

  // Initialize state from preferences
  useEffect(() => {
    if (preferences) {
      const accessPrefs = preferences.filter((pref: any) => pref.category === 'access_control');
      if (accessPrefs.length) {
        const prefsObj: any = {};
        accessPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('access_', '')] = pref.value;
        });
        
        setSettings({
          sessionTimeout: prefsObj.sessionTimeout?.toString() || '30',
          maintenanceMode: prefsObj.maintenanceMode || false,
          loginLogs: prefsObj.loginLogs !== undefined ? prefsObj.loginLogs : true,
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

    const fullKey = `access_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'access_control',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Access control setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  const handleSaveAll = async () => {
    setIsLoading(true);
    
    try {
      // Create array of all settings to save
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key: `access_${key}`,
        value,
        existingPref: preferences?.find((pref: any) => pref.key === `access_${key}`),
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
            category: 'access_control',
            label: setting.key.replace('access_', '').charAt(0).toUpperCase() + 
                  setting.key.replace('access_', '').slice(1).replace(/([A-Z])/g, ' $1'),
            description: `Access control setting for ${setting.key.replace('access_', '')}`,
            dataType: typeof setting.value === 'boolean' ? 'boolean' : 'string',
          });
        }
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Access control settings have been updated successfully.',
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
        <h3 className="text-lg font-medium">System Access Control</h3>
        <Button onClick={handleSaveAll} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save All Settings
        </Button>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Timeout */}
        <div className="space-y-3">
          <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
          <Input
            id="sessionTimeout"
            type="number"
            value={settings.sessionTimeout}
            onChange={(e) => handleChangeSetting('sessionTimeout', e.target.value)}
            min="5"
          />
          <p className="text-sm text-muted-foreground">
            Time of inactivity after which users are automatically logged out
          </p>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="text-base font-medium">System Access Options</h4>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenanceMode" className="text-red-500 font-semibold">Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, only administrators can access the system
            </p>
          </div>
          <Switch
            id="maintenanceMode"
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) => handleChangeSetting('maintenanceMode', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="loginLogs">Login Activity Logs</Label>
            <p className="text-sm text-muted-foreground">
              Log all login attempts and user sessions
            </p>
          </div>
          <Switch
            id="loginLogs"
            checked={settings.loginLogs}
            onCheckedChange={(checked) => handleChangeSetting('loginLogs', checked)}
          />
        </div>
      </div>
      
      {/* Login logs view could be added here */}
    </div>
  );
};

export default AccessControlTab;