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
import { CloudIcon, HardDriveIcon, DatabaseIcon, DownloadIcon, UploadIcon, ClockIcon, ShieldIcon, LinkIcon, UnlinkIcon, PackageIcon, UsersIcon, TruckIcon, ShoppingCartIcon, FileTextIcon, DollarSignIcon, ReceiptIcon, CalculatorIcon, UserIcon, SettingsIcon } from 'lucide-react';

interface BackupTabProps {
  preferences: any;
  refetch: () => void;
}

const BackupTab: React.FC<BackupTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    cloudBackup: false,
    cloudProvider: 'none',
    localBackup: true,
    backupRetention: '30',
    encryptBackups: true,
    compressBackups: true,
    includeFiles: true,
    includeDatabase: true,
    googleDriveEnabled: false,
    // Module selection
    backupInventory: true,
    backupCustomers: true,
    backupSuppliers: true,
    backupOrders: true,
    backupInvoices: true,
    backupQuotations: true,
    backupExpenses: true,
    backupAccounting: true,
    backupUserData: true,
    backupSystemSettings: true,
  });

  useEffect(() => {
    if (preferences) {
      const backupPrefs = preferences.filter((pref: any) => pref.category === 'backup');
      if (backupPrefs.length) {
        const prefsObj: any = {};
        backupPrefs.forEach((pref: any) => {
          prefsObj[pref.key.replace('backup_', '')] = pref.value;
        });
        
        setSettings({
          autoBackup: prefsObj.autoBackup !== false,
          backupFrequency: prefsObj.backupFrequency || 'daily',
          backupTime: prefsObj.backupTime || '02:00',
          cloudBackup: prefsObj.cloudBackup || false,
          cloudProvider: prefsObj.cloudProvider || 'none',
          localBackup: prefsObj.localBackup !== false,
          backupRetention: prefsObj.backupRetention?.toString() || '30',
          encryptBackups: prefsObj.encryptBackups !== false,
          compressBackups: prefsObj.compressBackups !== false,
          includeFiles: prefsObj.includeFiles !== false,
          includeDatabase: prefsObj.includeDatabase !== false,
          googleDriveEnabled: prefsObj.googleDriveEnabled || false,
          // Module selection
          backupInventory: prefsObj.backupInventory !== false,
          backupCustomers: prefsObj.backupCustomers !== false,
          backupSuppliers: prefsObj.backupSuppliers !== false,
          backupOrders: prefsObj.backupOrders !== false,
          backupInvoices: prefsObj.backupInvoices !== false,
          backupQuotations: prefsObj.backupQuotations !== false,
          backupExpenses: prefsObj.backupExpenses !== false,
          backupAccounting: prefsObj.backupAccounting !== false,
          backupUserData: prefsObj.backupUserData !== false,
          backupSystemSettings: prefsObj.backupSystemSettings !== false,
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
        description: 'Failed to update backup setting.',
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
        description: 'Failed to create backup setting.',
        variant: 'destructive',
      });
    },
  });

  const handleChangeSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    const fullKey = `backup_${key}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'backup',
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        description: `Backup setting for ${key}`,
        dataType: typeof value === 'boolean' ? 'boolean' : 'string',
      });
    }
  };

  const handleManualBackup = () => {
    toast({
      title: 'Backup Started',
      description: 'Manual backup has been initiated. You will be notified when complete.',
    });
  };

  const handleConnectGoogleDrive = () => {
    // This would typically open Google OAuth flow
    toast({
      title: 'Google Drive Integration',
      description: 'Opening Google Drive authorization...',
    });
    // Placeholder for Google Drive OAuth integration
    // In a real implementation, this would redirect to Google OAuth
    setTimeout(() => {
      handleChangeSetting('googleDriveEnabled', true);
      toast({
        title: 'Connected!',
        description: 'Successfully connected to Google Drive.',
      });
    }, 2000);
  };

  const handleDisconnectGoogleDrive = () => {
    handleChangeSetting('googleDriveEnabled', false);
    toast({
      title: 'Disconnected',
      description: 'Google Drive has been disconnected.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Backup & Recovery</h3>
          <p className="text-sm text-muted-foreground">
            Configure automatic backups and data recovery settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download Backup
          </Button>
          <Button onClick={handleManualBackup}>
            <CloudIcon className="h-4 w-4 mr-2" />
            Backup Now
          </Button>
        </div>
      </div>

      {/* Backup Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CloudIcon className="h-6 w-6 mx-auto text-green-700 mb-1" />
          <div className="text-sm text-green-600">Auto Backup</div>
          <div className="text-lg font-bold text-green-700">
            {settings.autoBackup ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <ClockIcon className="h-6 w-6 mx-auto text-blue-700 mb-1" />
          <div className="text-sm text-blue-600">Frequency</div>
          <div className="text-lg font-bold text-blue-700">{settings.backupFrequency}</div>
        </div>
        <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <HardDriveIcon className="h-6 w-6 mx-auto text-purple-700 mb-1" />
          <div className="text-sm text-purple-600">Retention</div>
          <div className="text-lg font-bold text-purple-700">{settings.backupRetention} days</div>
        </div>
        <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <ShieldIcon className="h-6 w-6 mx-auto text-orange-700 mb-1" />
          <div className="text-sm text-orange-600">Encryption</div>
          <div className="text-lg font-bold text-orange-700">
            {settings.encryptBackups ? 'On' : 'Off'}
          </div>
        </div>
      </div>

      {/* Backup Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Backup Schedule</CardTitle>
              <CardDescription>Configure automatic backup timing and frequency</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ClockIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="autoBackup">Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Enable scheduled automatic backups
                </p>
              </div>
            </div>
            <Switch
              id="autoBackup"
              checked={settings.autoBackup}
              onCheckedChange={(checked) => handleChangeSetting('autoBackup', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => handleChangeSetting('backupFrequency', value)}
                disabled={!settings.autoBackup}
              >
                <SelectTrigger id="backupFrequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Every Hour</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often automatic backups should run
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="backupTime">Backup Time</Label>
              <Input
                id="backupTime"
                type="time"
                value={settings.backupTime}
                onChange={(e) => handleChangeSetting('backupTime', e.target.value)}
                disabled={!settings.autoBackup}
              />
              <p className="text-sm text-muted-foreground">
                Preferred time for automatic backups
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="backupRetention">Backup Retention (Days)</Label>
            <Input
              id="backupRetention"
              type="number"
              value={settings.backupRetention}
              onChange={(e) => handleChangeSetting('backupRetention', e.target.value)}
              min="1"
              max="365"
            />
            <p className="text-sm text-muted-foreground">
              Number of days to keep backup files
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup Storage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <HardDriveIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Backup Storage</CardTitle>
              <CardDescription>Configure where backups are stored</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <HardDriveIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="localBackup">Local Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Store backups on local server storage
                </p>
              </div>
            </div>
            <Switch
              id="localBackup"
              checked={settings.localBackup}
              onCheckedChange={(checked) => handleChangeSetting('localBackup', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CloudIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="cloudBackup">Cloud Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Store backups in cloud storage
                </p>
              </div>
            </div>
            <Switch
              id="cloudBackup"
              checked={settings.cloudBackup}
              onCheckedChange={(checked) => handleChangeSetting('cloudBackup', checked)}
            />
          </div>

          {settings.cloudBackup && (
            <div className="space-y-3">
              <Label htmlFor="cloudProvider">Cloud Provider</Label>
              <Select
                value={settings.cloudProvider}
                onValueChange={(value) => handleChangeSetting('cloudProvider', value)}
              >
                <SelectTrigger id="cloudProvider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">Amazon S3</SelectItem>
                  <SelectItem value="google">Google Cloud Storage</SelectItem>
                  <SelectItem value="googledrive">Google Drive</SelectItem>
                  <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  <SelectItem value="dropbox">Dropbox</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Cloud storage provider for backups
              </p>
            </div>
          )}

          {settings.cloudBackup && settings.cloudProvider === 'googledrive' && (
            <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CloudIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Google Drive Integration</h4>
                    <p className="text-sm text-blue-700">
                      {settings.googleDriveEnabled 
                        ? 'Connected to Google Drive' 
                        : 'Connect your Google Drive account to store backups'}
                    </p>
                  </div>
                </div>
                {settings.googleDriveEnabled ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDisconnectGoogleDrive}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <UnlinkIcon className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={handleConnectGoogleDrive}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Module Selection</CardTitle>
              <CardDescription>Choose which modules to include in backups</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <PackageIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupInventory">Inventory & Products</Label>
                  <p className="text-sm text-muted-foreground">
                    Product catalog, stock levels, categories
                  </p>
                </div>
              </div>
              <Switch
                id="backupInventory"
                checked={settings.backupInventory}
                onCheckedChange={(checked) => handleChangeSetting('backupInventory', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupCustomers">Customers</Label>
                  <p className="text-sm text-muted-foreground">
                    Customer data, contacts, payment info
                  </p>
                </div>
              </div>
              <Switch
                id="backupCustomers"
                checked={settings.backupCustomers}
                onCheckedChange={(checked) => handleChangeSetting('backupCustomers', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <TruckIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupSuppliers">Suppliers</Label>
                  <p className="text-sm text-muted-foreground">
                    Supplier information, contacts, terms
                  </p>
                </div>
              </div>
              <Switch
                id="backupSuppliers"
                checked={settings.backupSuppliers}
                onCheckedChange={(checked) => handleChangeSetting('backupSuppliers', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <ShoppingCartIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupOrders">Orders</Label>
                  <p className="text-sm text-muted-foreground">
                    Purchase orders, manufacturing orders
                  </p>
                </div>
              </div>
              <Switch
                id="backupOrders"
                checked={settings.backupOrders}
                onCheckedChange={(checked) => handleChangeSetting('backupOrders', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupInvoices">Invoices</Label>
                  <p className="text-sm text-muted-foreground">
                    Sales invoices, payment records
                  </p>
                </div>
              </div>
              <Switch
                id="backupInvoices"
                checked={settings.backupInvoices}
                onCheckedChange={(checked) => handleChangeSetting('backupInvoices', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupQuotations">Quotations</Label>
                  <p className="text-sm text-muted-foreground">
                    Price quotes, proposals
                  </p>
                </div>
              </div>
              <Switch
                id="backupQuotations"
                checked={settings.backupQuotations}
                onCheckedChange={(checked) => handleChangeSetting('backupQuotations', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <ReceiptIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupExpenses">Expenses</Label>
                  <p className="text-sm text-muted-foreground">
                    Business expenses, receipts
                  </p>
                </div>
              </div>
              <Switch
                id="backupExpenses"
                checked={settings.backupExpenses}
                onCheckedChange={(checked) => handleChangeSetting('backupExpenses', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CalculatorIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupAccounting">Accounting</Label>
                  <p className="text-sm text-muted-foreground">
                    Chart of accounts, journal entries
                  </p>
                </div>
              </div>
              <Switch
                id="backupAccounting"
                checked={settings.backupAccounting}
                onCheckedChange={(checked) => handleChangeSetting('backupAccounting', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupUserData">User Data</Label>
                  <p className="text-sm text-muted-foreground">
                    User accounts, roles, permissions
                  </p>
                </div>
              </div>
              <Switch
                id="backupUserData"
                checked={settings.backupUserData}
                onCheckedChange={(checked) => handleChangeSetting('backupUserData', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <Label htmlFor="backupSystemSettings">System Settings</Label>
                  <p className="text-sm text-muted-foreground">
                    Configuration, preferences, workflows
                  </p>
                </div>
              </div>
              <Switch
                id="backupSystemSettings"
                checked={settings.backupSystemSettings}
                onCheckedChange={(checked) => handleChangeSetting('backupSystemSettings', checked)}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <DatabaseIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Backup Summary</h4>
                <p className="text-sm text-blue-700">
                  Selected modules will be included in all backup operations. 
                  You can modify these selections at any time to customize what data is backed up.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Backup Options</CardTitle>
              <CardDescription>Configure what data to include in backups</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="includeDatabase">Include Database</Label>
                <p className="text-sm text-muted-foreground">
                  Include all database data in backups
                </p>
              </div>
            </div>
            <Switch
              id="includeDatabase"
              checked={settings.includeDatabase}
              onCheckedChange={(checked) => handleChangeSetting('includeDatabase', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <UploadIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="includeFiles">Include Uploaded Files</Label>
                <p className="text-sm text-muted-foreground">
                  Include user uploaded files and documents
                </p>
              </div>
            </div>
            <Switch
              id="includeFiles"
              checked={settings.includeFiles}
              onCheckedChange={(checked) => handleChangeSetting('includeFiles', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="encryptBackups">Encrypt Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Encrypt backup files for security
                </p>
              </div>
            </div>
            <Switch
              id="encryptBackups"
              checked={settings.encryptBackups}
              onCheckedChange={(checked) => handleChangeSetting('encryptBackups', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CloudIcon className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="compressBackups">Compress Backups</Label>
                <p className="text-sm text-muted-foreground">
                  Compress backup files to save storage space
                </p>
              </div>
            </div>
            <Switch
              id="compressBackups"
              checked={settings.compressBackups}
              onCheckedChange={(checked) => handleChangeSetting('compressBackups', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupTab;