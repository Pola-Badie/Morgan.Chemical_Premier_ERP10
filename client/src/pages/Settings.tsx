import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useBackup } from '@/hooks/use-backup';
import { BackupSettings } from '@shared/schema';
import { Clock, Settings as SettingsIcon, Bell, Shield, UserCog, Database } from 'lucide-react';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch backup settings
  const { data: backupSettings, isLoading: isLoadingSettings } = useQuery<BackupSettings>({
    queryKey: ['/api/backup-settings'],
  });
  
  // Backup settings state
  const [formSettings, setFormSettings] = useState<Partial<BackupSettings>>({
    dailyBackup: true,
    weeklyBackup: true,
    monthlyBackup: true,
    backupTime: '02:00',
    retentionDays: 30,
  });
  
  // Update form when data loads
  React.useEffect(() => {
    if (backupSettings) {
      setFormSettings({
        dailyBackup: backupSettings.dailyBackup,
        weeklyBackup: backupSettings.weeklyBackup,
        monthlyBackup: backupSettings.monthlyBackup,
        backupTime: backupSettings.backupTime,
        retentionDays: backupSettings.retentionDays,
      });
    }
  }, [backupSettings]);
  
  // Update backup settings mutation
  const { updateBackupSettings, isUpdatingSettings } = useBackup();
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBackupSettings.mutate(formSettings as BackupSettings);
  };
  
  // Handle form changes
  const handleChange = (field: keyof BackupSettings, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Settings</h1>
          <p className="text-sm text-slate-500">Manage your application preferences</p>
        </div>
      </div>

      <Tabs defaultValue="backup">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="backup">
              <Database className="h-4 w-4 mr-2" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="account">
              <UserCog className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="backup">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Database className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-lg font-semibold text-slate-900">Backup Settings</h2>
              </div>
              
              {isLoadingSettings ? (
                <div className="space-y-4">
                  <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
                  <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
                  <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-3">Backup Schedule</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            <div>
                              <span className="text-sm font-medium">Daily Backup</span>
                              <p className="text-xs text-slate-500">Backup your data once every day</p>
                            </div>
                          </div>
                          <Switch 
                            checked={formSettings.dailyBackup} 
                            onCheckedChange={(value) => handleChange('dailyBackup', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            <div>
                              <span className="text-sm font-medium">Weekly Backup</span>
                              <p className="text-xs text-slate-500">Backup your data once every week</p>
                            </div>
                          </div>
                          <Switch 
                            checked={formSettings.weeklyBackup} 
                            onCheckedChange={(value) => handleChange('weeklyBackup', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            <div>
                              <span className="text-sm font-medium">Monthly Backup</span>
                              <p className="text-xs text-slate-500">Backup your data once every month</p>
                            </div>
                          </div>
                          <Switch 
                            checked={formSettings.monthlyBackup} 
                            onCheckedChange={(value) => handleChange('monthlyBackup', value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-2">Backup Time</h3>
                        <Select 
                          value={formSettings.backupTime} 
                          onValueChange={(value) => handleChange('backupTime', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select backup time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="00:00">12:00 AM</SelectItem>
                            <SelectItem value="01:00">1:00 AM</SelectItem>
                            <SelectItem value="02:00">2:00 AM</SelectItem>
                            <SelectItem value="03:00">3:00 AM</SelectItem>
                            <SelectItem value="04:00">4:00 AM</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 mt-1">
                          Scheduled backups will run at this time (server time)
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-2">Retention Period</h3>
                        <Select 
                          value={formSettings.retentionDays?.toString()} 
                          onValueChange={(value) => handleChange('retentionDays', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select retention period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 mt-1">
                          Backups older than this will be automatically deleted
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdatingSettings}
                      >
                        {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Bell className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-lg font-semibold text-slate-900">Notification Settings</h2>
              </div>
              
              <div className="text-center py-8">
                <div className="bg-slate-100 inline-flex items-center justify-center rounded-full p-3 mb-4">
                  <SettingsIcon className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="text-md font-medium text-slate-800 mb-2">Coming Soon</h3>
                <p className="text-slate-500">
                  Notification settings will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <UserCog className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-lg font-semibold text-slate-900">Account Settings</h2>
              </div>
              
              <div className="text-center py-8">
                <div className="bg-slate-100 inline-flex items-center justify-center rounded-full p-3 mb-4">
                  <SettingsIcon className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="text-md font-medium text-slate-800 mb-2">Coming Soon</h3>
                <p className="text-slate-500">
                  Account settings will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>
              </div>
              
              <div className="text-center py-8">
                <div className="bg-slate-100 inline-flex items-center justify-center rounded-full p-3 mb-4">
                  <SettingsIcon className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="text-md font-medium text-slate-800 mb-2">Coming Soon</h3>
                <p className="text-slate-500">
                  Security settings will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
