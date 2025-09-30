
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  Mail, 
  Bell, 
  Settings, 
  Send, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Users,
  MessageSquare
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'alert' | 'notification' | 'report';
  variables: string[];
}

interface NotificationSettings {
  lowStockAlert: boolean;
  expiryAlert: boolean;
  orderUpdates: boolean;
  invoiceReminders: boolean;
  systemUpdates: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  recipients: string[];
}

export default function EmailNotificationManager() {
  const [settings, setSettings] = useState<NotificationSettings>({
    lowStockAlert: true,
    expiryAlert: true,
    orderUpdates: true,
    invoiceReminders: true,
    systemUpdates: false,
    emailFrequency: 'immediate',
    recipients: []
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [newRecipient, setNewRecipient] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { data: templates, refetch: refetchTemplates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  const { data: notificationHistory } = useQuery({
    queryKey: ['notification-history'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/history');
      if (!response.ok) throw new Error('Failed to fetch notification history');
      return response.json();
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Email notification settings updated successfully",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const addRecipient = () => {
    if (newRecipient && !settings.recipients.includes(newRecipient)) {
      setSettings(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient]
      }));
      setNewRecipient('');
    }
  };

  const removeRecipient = (email: string) => {
    setSettings(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: testEmail,
          templateId: selectedTemplate?.id
        })
      });

      if (response.ok) {
        toast({
          title: "Test email sent",
          description: `Test email sent to ${testEmail}`,
        });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendBulkNotification = async () => {
    if (!selectedTemplate) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipients: settings.recipients
        })
      });

      if (response.ok) {
        toast({
          title: "Bulk notification sent",
          description: `Notification sent to ${settings.recipients.length} recipients`,
        });
      } else {
        throw new Error('Failed to send bulk notification');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send bulk notification",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Notifications</h1>
          <p className="text-muted-foreground">Configure automated email alerts and notifications</p>
        </div>
        <Button onClick={saveSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alert Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="low-stock">Low Stock Alerts</Label>
                    <Switch
                      id="low-stock"
                      checked={settings.lowStockAlert}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, lowStockAlert: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="expiry">Product Expiry Alerts</Label>
                    <Switch
                      id="expiry"
                      checked={settings.expiryAlert}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, expiryAlert: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="orders">Order Updates</Label>
                    <Switch
                      id="orders"
                      checked={settings.orderUpdates}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, orderUpdates: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="invoices">Invoice Reminders</Label>
                    <Switch
                      id="invoices"
                      checked={settings.invoiceReminders}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, invoiceReminders: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system">System Updates</Label>
                    <Switch
                      id="system"
                      checked={settings.systemUpdates}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, systemUpdates: checked }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Frequency</Label>
                  <Select 
                    value={settings.emailFrequency} 
                    onValueChange={(value: any) => 
                      setSettings(prev => ({ ...prev, emailFrequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily Summary</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recipients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Email Recipient</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                    />
                    <Button onClick={addRecipient} variant="outline">
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Recipients</Label>
                  {settings.recipients.length > 0 ? (
                    <div className="space-y-2">
                      {settings.recipients.map((email, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipient(email)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recipients configured</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.map((template: EmailTemplate) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant="outline">{template.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((variable, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Test Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Template</Label>
                  <Select onValueChange={(value) => {
                    const template = templates?.find((t: EmailTemplate) => t.id === value);
                    setSelectedTemplate(template || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template: EmailTemplate) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Test Email Address</Label>
                  <Input
                    type="email"
                    placeholder="Enter test email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>

                <Button
                  onClick={sendTestEmail}
                  disabled={!selectedTemplate || !testEmail || isSending}
                  className="w-full"
                >
                  {isSending ? 'Sending...' : 'Send Test Email'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Bulk Notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will send the selected email template to all configured recipients.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Recipients ({settings.recipients.length})</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {settings.recipients.map((email, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        {email}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={sendBulkNotification}
                  disabled={!selectedTemplate || settings.recipients.length === 0 || isSending}
                  className="w-full"
                >
                  {isSending ? 'Sending...' : 'Send Bulk Notification'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationHistory?.slice(0, 20).map((notification: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        notification.status === 'sent' ? 'bg-green-500' : 
                        notification.status === 'failed' ? 'bg-red-500' : 
                        'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium">{notification.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          To: {notification.recipient} • {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      notification.status === 'sent' ? 'default' :
                      notification.status === 'failed' ? 'destructive' :
                      'secondary'
                    }>
                      {notification.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
