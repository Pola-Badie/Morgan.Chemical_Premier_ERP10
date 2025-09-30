import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDateTime, formatFileSize } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Backup, BackupSettings } from '@shared/schema';
import { useBackup } from '@/hooks/use-backup';
import { Database, Clock, HardDrive, Upload, RotateCcw, AlertTriangle } from 'lucide-react';

const BackupRestore: React.FC = () => {
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  
  // Fetch backups and settings
  const { data: backups, isLoading: isLoadingBackups } = useQuery<Backup[]>({
    queryKey: ['/api/backups'],
  });
  
  const { data: backupSettings, isLoading: isLoadingSettings } = useQuery<BackupSettings>({
    queryKey: ['/api/backup-settings'],
  });
  
  // Backup and restore operations
  const { 
    performBackup, 
    isBackingUp, 
    restoreFromBackup, 
    isRestoring,
    updateBackupSettings, 
    isUpdatingSettings 
  } = useBackup();
  
  // Handle manual backup
  const handleManualBackup = () => {
    performBackup.mutate('manual');
  };
  
  // Open restore dialog
  const openRestoreDialog = (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };
  
  // Handle restore from backup
  const handleRestore = () => {
    if (selectedBackup) {
      restoreFromBackup.mutate(selectedBackup.id);
      setRestoreDialogOpen(false);
    }
  };
  
  // Update backup settings
  const handleToggleBackupSetting = (setting: 'dailyBackup' | 'weeklyBackup' | 'monthlyBackup') => {
    if (!backupSettings) return;
    
    const updatedSettings = {
      ...backupSettings,
      [setting]: !backupSettings[setting]
    };
    
    updateBackupSettings.mutate(updatedSettings);
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };
  
  // Get backup type label
  const getBackupTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Daily Automated';
      case 'weekly':
        return 'Weekly Automated';
      case 'monthly':
        return 'Monthly Automated';
      case 'manual':
        return 'Manual Backup';
      default:
        return type;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Backup & Recovery</h1>
          <p className="text-sm text-slate-500">Manage your data backup and recovery options</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleManualBackup} disabled={isBackingUp}>
            {isBackingUp ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Backing Up...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Create Backup Now
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Database className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-slate-900">Backup History</h2>
            </div>
            
            {isLoadingBackups ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !backups?.length ? (
              <div className="text-center py-6">
                <div className="bg-slate-100 inline-flex items-center justify-center rounded-full p-3 mb-4">
                  <Database className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="text-md font-medium text-slate-800 mb-2">No backups found</h3>
                <p className="text-slate-500 mb-4">
                  Create your first backup to protect your expense data.
                </p>
                <Button onClick={handleManualBackup} disabled={isBackingUp}>
                  Create First Backup
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <div 
                    key={backup.id} 
                    className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-slate-800">
                            {getBackupTypeLabel(backup.type)}
                          </span>
                          <span 
                            className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusColor(backup.status)}`}
                          >
                            {backup.status}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-slate-500 mb-2">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDateTime(backup.timestamp)}
                        </div>
                        <div className="flex items-center text-sm text-slate-500">
                          <HardDrive className="h-4 w-4 mr-1" />
                          {formatFileSize(backup.size)}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openRestoreDialog(backup)}
                        disabled={isRestoring || backup.status !== 'completed'}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <h2 className="text-lg font-semibold text-slate-900">Backup Schedule</h2>
            </div>
            
            {isLoadingSettings ? (
              <div className="space-y-4">
                <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
                <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
                <div className="h-12 bg-slate-100 animate-pulse rounded"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Daily Backup</span>
                  </div>
                  <Switch 
                    checked={backupSettings?.dailyBackup || false} 
                    onCheckedChange={() => handleToggleBackupSetting('dailyBackup')}
                    disabled={isUpdatingSettings}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Weekly Backup</span>
                  </div>
                  <Switch 
                    checked={backupSettings?.weeklyBackup || false} 
                    onCheckedChange={() => handleToggleBackupSetting('weeklyBackup')}
                    disabled={isUpdatingSettings}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm font-medium">Monthly Backup</span>
                  </div>
                  <Switch 
                    checked={backupSettings?.monthlyBackup || false} 
                    onCheckedChange={() => handleToggleBackupSetting('monthlyBackup')}
                    disabled={isUpdatingSettings}
                  />
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Backup Time</h3>
                  <div className="p-3 border rounded-lg bg-slate-50">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-slate-500" />
                      <span className="text-sm">{backupSettings?.backupTime || '02:00'} (Server Time)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Automated backups run at the specified time each day.
                  </p>
                </div>
                
                <div className="mt-2">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Retention Policy</h3>
                  <div className="p-3 border rounded-lg bg-slate-50">
                    <div className="flex items-center">
                      <HardDrive className="h-4 w-4 mr-2 text-slate-500" />
                      <span className="text-sm">Keep backups for {backupSettings?.retentionDays || 30} days</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Older backups will be automatically deleted.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Data Recovery</h2>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800 mb-1">Important Information</h3>
                <p className="text-sm text-amber-700">
                  Restoring from a backup will replace all current data with the data from the selected backup.
                  This action cannot be undone. Make sure to create a new backup before restoring if you want to keep your current data.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleManualBackup}
              disabled={isBackingUp}
            >
              <Upload className="h-4 w-4 mr-2" />
              Create New Backup
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              This will replace all current data with the data from the selected backup.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="py-4">
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <div className="flex items-center mb-2">
                  <Database className="h-4 w-4 mr-2 text-primary" />
                  <span className="font-medium">{getBackupTypeLabel(selectedBackup.type)}</span>
                </div>
                <div className="text-sm text-slate-600 mb-1">
                  <span className="text-slate-500">Created:</span> {formatDateTime(selectedBackup.timestamp)}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="text-slate-500">Size:</span> {formatFileSize(selectedBackup.size)}
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Are you sure you want to restore from this backup? All current data will be replaced.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? 'Restoring...' : 'Confirm Restore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupRestore;
