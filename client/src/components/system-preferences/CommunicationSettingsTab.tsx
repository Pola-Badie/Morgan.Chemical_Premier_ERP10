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
import { Mail, MessageSquare, Bell, Phone, Send, Server, Smartphone } from 'lucide-react';

interface CommunicationSettingsTabProps {
  preferences: any;
  refetch: () => void;
}

const CommunicationSettingsTab: React.FC<CommunicationSettingsTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushNotifications: true,
    smtpServer: '',
    smtpPort: '587',
    smtpUsername: '',
    smtpSecurity: 'tls',
    smsProvider: 'twilio',
    lowStockNotifications: true,
    orderNotifications: true,
    paymentNotifications: true,
    systemNotifications: true,
    notificationFrequency: 'immediate',
  });

  useEffect(() => {
    if (preferences) {
      const commPrefs = preferences.filter((pref: any) => pref.category === 'communication');
      if (commPrefs.length) {
        const prefsObj: any = {};
        commPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('communication_', '')] = pref.value;
        });
        
        setSettings({
          emailEnabled: prefsObj.emailEnabled !== false,
          smsEnabled: prefsObj.smsEnabled || false,
          pushNotifications: prefsObj.pushNotifications !== false,
          smtpServer: prefsObj.smtpServer || '',
          smtpPort: prefsObj.smtpPort || '587',
          smtpUsername: prefsObj.smtpUsername || '',
          smtpSecurity: prefsObj.smtpSecurity || 'tls',
          smsProvider: prefsObj.smsProvider || 'twilio',
          lowStockNotifications: prefsObj.lowStockNotifications !== false,
          orderNotifications: prefsObj.orderNotifications !== false,
          paymentNotifications: prefsObj.paymentNotifications !== false,
          systemNotifications: prefsObj.systemNotifications !== false,
          notificationFrequency: prefsObj.notificationFrequency || 'immediate',
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
        description: 'Failed to update communication setting.',
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
        description: 'Failed to create communication setting.',
        variant: 'destructive',
      });
    },
  });

  const handleChangeSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const fullKey = `communication_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'communication',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Communication setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Communication Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure email, SMS, and notification preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Test Email
          </Button>
          <Button variant="outline" size="sm">
            Test SMS
          </Button>
        </div>
      </div>

      {/* Communication Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Mail className="h-6 w-6 mx-auto text-blue-700 mb-1" />
          <div className="text-sm text-blue-600">Email</div>
          <div className="text-lg font-bold text-blue-700">
            {settings.emailEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <MessageSquare className="h-6 w-6 mx-auto text-green-700 mb-1" />
          <div className="text-sm text-green-600">SMS</div>
          <div className="text-lg font-bold text-green-700">
            {settings.smsEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <Bell className="h-6 w-6 mx-auto text-purple-700 mb-1" />
          <div className="text-sm text-purple-600">Notifications</div>
          <div className="text-lg font-bold text-purple-700">
            {settings.pushNotifications ? 'On' : 'Off'}
          </div>
        </div>
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <Server className="h-6 w-6 mx-auto text-orange-700 mb-1" />
          <div className="text-sm text-orange-600">SMTP</div>
          <div className="text-lg font-bold text-orange-700">
            {settings.smtpServer ? 'Configured' : 'Not Set'}
          </div>
        </div>
      </div>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Email Configuration</CardTitle>
              <CardDescription>Configure SMTP settings for email notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="emailEnabled">Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="emailEnabled"
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => handleChangeSetting('emailEnabled', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="smtpServer">SMTP Server</Label>
              <Input
                id="smtpServer"
                value={settings.smtpServer}
                onChange={(e) => handleChangeSetting('smtpServer', e.target.value)}
                placeholder="mail.example.com"
                disabled={!settings.emailEnabled}
              />
              <p className="text-sm text-muted-foreground">
                SMTP server hostname or IP address
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Select
                value={settings.smtpPort}
                onValueChange={(value) => handleChangeSetting('smtpPort', value)}
                disabled={!settings.emailEnabled}
              >
                <SelectTrigger id="smtpPort">
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 (Standard)</SelectItem>
                  <SelectItem value="587">587 (Submission)</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                  <SelectItem value="2525">2525 (Alternative)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                SMTP server port number
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="smtpUsername">SMTP Username</Label>
              <Input
                id="smtpUsername"
                value={settings.smtpUsername}
                onChange={(e) => handleChangeSetting('smtpUsername', e.target.value)}
                placeholder="username@example.com"
                disabled={!settings.emailEnabled}
              />
              <p className="text-sm text-muted-foreground">
                SMTP authentication username
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="smtpSecurity">Security Protocol</Label>
              <Select
                value={settings.smtpSecurity}
                onValueChange={(value) => handleChangeSetting('smtpSecurity', value)}
                disabled={!settings.emailEnabled}
              >
                <SelectTrigger id="smtpSecurity">
                  <SelectValue placeholder="Select security" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="tls">TLS/STARTTLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Email encryption method
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">SMS Configuration</CardTitle>
              <CardDescription>Configure SMS notifications and alerts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="smsEnabled">Enable SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via SMS
                </p>
              </div>
            </div>
            <Switch
              id="smsEnabled"
              checked={settings.smsEnabled}
              onCheckedChange={(checked) => handleChangeSetting('smsEnabled', checked)}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="smsProvider">SMS Provider</Label>
            <Select
              value={settings.smsProvider}
              onValueChange={(value) => handleChangeSetting('smsProvider', value)}
              disabled={!settings.smsEnabled}
            >
              <SelectTrigger id="smsProvider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="nexmo">Vonage (Nexmo)</SelectItem>
                <SelectItem value="aws">AWS SNS</SelectItem>
                <SelectItem value="clicksend">ClickSend</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              SMS service provider for sending messages
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Configure which notifications to receive and how often</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="notificationFrequency">Notification Frequency</Label>
            <Select
              value={settings.notificationFrequency}
              onValueChange={(value) => handleChangeSetting('notificationFrequency', value)}
            >
              <SelectTrigger id="notificationFrequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Summary</SelectItem>
                <SelectItem value="daily">Daily Summary</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often to send notification summaries
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="lowStockNotifications">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when products reach low stock levels
                  </p>
                </div>
              </div>
              <Switch
                id="lowStockNotifications"
                checked={settings.lowStockNotifications}
                onCheckedChange={(checked) => handleChangeSetting('lowStockNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="orderNotifications">Order Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify about new orders and status changes
                  </p>
                </div>
              </div>
              <Switch
                id="orderNotifications"
                checked={settings.orderNotifications}
                onCheckedChange={(checked) => handleChangeSetting('orderNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="paymentNotifications">Payment Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify about payment receipts and due dates
                  </p>
                </div>
              </div>
              <Switch
                id="paymentNotifications"
                checked={settings.paymentNotifications}
                onCheckedChange={(checked) => handleChangeSetting('paymentNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="systemNotifications">System Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify about system updates and maintenance
                  </p>
                </div>
              </div>
              <Switch
                id="systemNotifications"
                checked={settings.systemNotifications}
                onCheckedChange={(checked) => handleChangeSetting('systemNotifications', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationSettingsTab;