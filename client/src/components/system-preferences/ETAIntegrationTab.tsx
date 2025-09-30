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
import { Textarea } from '@/components/ui/textarea';
import { FileTextIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, RotateCwIcon, KeyIcon } from 'lucide-react';

interface ETAIntegrationTabProps {
  preferences: any;
  refetch: () => void;
}

const ETAIntegrationTab: React.FC<ETAIntegrationTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    etaEnabled: false,
    environment: 'sandbox',
    clientId: '',
    clientSecret: '',
    username: '',
    pin: '',
    apiKey: '',
    autoSubmit: false,
    testMode: true,
    taxNumber: '',
    branchId: '',
    activityCode: '',
  });

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    if (preferences) {
      const etaPrefs = preferences.filter((pref: any) => pref.category === 'eta');
      if (etaPrefs.length) {
        const prefsObj: any = {};
        etaPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('eta_', '')] = pref.value;
        });
        
        setSettings({
          etaEnabled: prefsObj.etaEnabled || false,
          environment: prefsObj.environment || 'sandbox',
          clientId: prefsObj.clientId || '',
          clientSecret: prefsObj.clientSecret || '',
          username: prefsObj.username || '',
          pin: prefsObj.pin || '',
          apiKey: prefsObj.apiKey || '',
          autoSubmit: prefsObj.autoSubmit || false,
          testMode: prefsObj.testMode !== false,
          taxNumber: prefsObj.taxNumber || '',
          branchId: prefsObj.branchId || '',
          activityCode: prefsObj.activityCode || '',
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
        description: 'Failed to update ETA setting.',
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
        description: 'Failed to create ETA setting.',
        variant: 'destructive',
      });
    },
  });

  const handleChangeSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const fullKey = `eta_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'eta',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `ETA setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('connecting');
    try {
      const response = await apiRequest('POST', '/api/eta/test-connection', {
        environment: settings.environment,
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
        username: settings.username,
        pin: settings.pin,
      });
      
      if (response.success) {
        setConnectionStatus('connected');
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to ETA system.',
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: 'Connection Failed',
          description: response.message || 'Failed to connect to ETA system.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: 'Connection Error',
        description: 'An error occurred while testing the connection.',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'connecting':
        return <RotateCwIcon className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Failed';
      default:
        return 'Not Connected';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">ETA Integration</h3>
          <p className="text-sm text-muted-foreground">
            Configure Egyptian Tax Authority electronic invoicing integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTestConnection}>
            Test Connection
          </Button>
          <Button variant="outline" size="sm">
            View Documentation
          </Button>
        </div>
      </div>

      {/* ETA Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <FileTextIcon className="h-6 w-6 mx-auto text-blue-700 mb-1" />
          <div className="text-sm text-blue-600">Status</div>
          <div className="text-lg font-bold text-blue-700">
            {settings.etaEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-center mb-1">{getStatusIcon()}</div>
          <div className="text-sm text-green-600">Connection</div>
          <div className="text-lg font-bold text-green-700">{getStatusText()}</div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <RotateCwIcon className="h-6 w-6 mx-auto text-purple-700 mb-1" />
          <div className="text-sm text-purple-600">Environment</div>
          <div className="text-lg font-bold text-purple-700">{settings.environment}</div>
        </div>
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <CheckCircleIcon className="h-6 w-6 mx-auto text-orange-700 mb-1" />
          <div className="text-sm text-orange-600">Auto Submit</div>
          <div className="text-lg font-bold text-orange-700">
            {settings.autoSubmit ? 'On' : 'Off'}
          </div>
        </div>
      </div>

      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileTextIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Basic Configuration</CardTitle>
              <CardDescription>Enable and configure ETA integration settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <FileTextIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="etaEnabled">Enable ETA Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Connect to Egyptian Tax Authority for electronic invoicing
                </p>
              </div>
            </div>
            <Switch
              id="etaEnabled"
              checked={settings.etaEnabled}
              onCheckedChange={(checked) => handleChangeSetting('etaEnabled', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={settings.environment}
                onValueChange={(value) => handleChangeSetting('environment', value)}
                disabled={!settings.etaEnabled}
              >
                <SelectTrigger id="environment">
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose sandbox for testing or production for live invoices
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="testMode">Test Mode</Label>
                <Switch
                  id="testMode"
                  checked={settings.testMode}
                  onCheckedChange={(checked) => handleChangeSetting('testMode', checked)}
                  disabled={!settings.etaEnabled}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enable test mode for development and testing
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <RotateCwIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="autoSubmit">Auto Submit Invoices</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically submit invoices to ETA when created
                </p>
              </div>
            </div>
            <Switch
              id="autoSubmit"
              checked={settings.autoSubmit}
              onCheckedChange={(checked) => handleChangeSetting('autoSubmit', checked)}
              disabled={!settings.etaEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <KeyIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">API Credentials</CardTitle>
              <CardDescription>Configure your ETA API authentication credentials</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                type="text"
                value={settings.clientId}
                onChange={(e) => handleChangeSetting('clientId', e.target.value)}
                placeholder="Enter your ETA Client ID"
                disabled={!settings.etaEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Your ETA application client identifier
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={settings.clientSecret}
                onChange={(e) => handleChangeSetting('clientSecret', e.target.value)}
                placeholder="Enter your ETA Client Secret"
                disabled={!settings.etaEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Your ETA application client secret key
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={settings.username}
                onChange={(e) => handleChangeSetting('username', e.target.value)}
                placeholder="Enter your ETA username"
                disabled={!settings.etaEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Your ETA portal username
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                value={settings.pin}
                onChange={(e) => handleChangeSetting('pin', e.target.value)}
                placeholder="Enter your ETA PIN"
                disabled={!settings.etaEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Your ETA portal PIN code
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e) => handleChangeSetting('apiKey', e.target.value)}
              placeholder="Enter your ETA API Key"
              disabled={!settings.etaEnabled}
            />
            <p className="text-sm text-muted-foreground">
              Your ETA API access key
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileTextIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Company Information</CardTitle>
              <CardDescription>Configure company details for ETA submissions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="taxNumber">Tax Registration Number</Label>
              <Input
                id="taxNumber"
                type="text"
                value={settings.taxNumber}
                onChange={(e) => handleChangeSetting('taxNumber', e.target.value)}
                placeholder="Enter tax registration number"
                disabled={!settings.etaEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Your company's tax registration number
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="branchId">Branch ID</Label>
              <Input
                id="branchId"
                type="text"
                value={settings.branchId}
                onChange={(e) => handleChangeSetting('branchId', e.target.value)}
                placeholder="Enter branch identifier"
                disabled={!settings.etaEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Your branch or location identifier
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="activityCode">Activity Code</Label>
            <Input
              id="activityCode"
              type="text"
              value={settings.activityCode}
              onChange={(e) => handleChangeSetting('activityCode', e.target.value)}
              placeholder="Enter business activity code"
              disabled={!settings.etaEnabled}
            />
            <p className="text-sm text-muted-foreground">
              Your primary business activity code as registered with ETA
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ETAIntegrationTab;