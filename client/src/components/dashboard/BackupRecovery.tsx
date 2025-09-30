import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatDateTime, formatFileSize, getTimeSince } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Backup, BackupSettings } from '@shared/schema';
import { useBackup } from '@/hooks/use-backup';

const BackupRecovery: React.FC = () => {
  const { data: latestBackup, isLoading: isLoadingBackup } = useQuery<Backup>({
    queryKey: ['/api/backups/latest'],
    queryFn: async () => {
      const res = await fetch('/api/backups/latest');
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch latest backup');
      }
      return res.json();
    },
  });

  const { data: backupSettings, isLoading: isLoadingSettings } = useQuery<BackupSettings>({
    queryKey: ['/api/backup-settings'],
  });

  const { performBackup, isBackingUp, restoreFromBackup, isRestoring } = useBackup();

  const handleRestoreFromLatest = () => {
    if (latestBackup) {
      restoreFromBackup(latestBackup.id);
    }
  };

  const handleViewBackupHistory = () => {
    window.location.href = '/backup';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Backup & Recovery</h2>
        
        {/* Last Backup Info */}
        <div className="bg-slate-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-slate-700">Last Backup</h3>
            {isLoadingBackup ? (
              <div className="h-5 w-20 bg-slate-200 animate-pulse rounded"></div>
            ) : latestBackup ? (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                {latestBackup.status}
              </span>
            ) : (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                No backups
              </span>
            )}
          </div>
          
          {isLoadingBackup ? (
            <div className="space-y-2">
              <div className="h-5 w-full bg-slate-200 animate-pulse rounded"></div>
              <div className="h-5 w-2/3 bg-slate-200 animate-pulse rounded"></div>
            </div>
          ) : latestBackup ? (
            <>
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span className="text-sm text-slate-600">
                  {formatDateTime(latestBackup.timestamp)}
                </span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span className="text-sm text-slate-600">{formatFileSize(latestBackup.size)}</span>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-600">
              No backups have been created yet. Create your first backup using the button below.
            </div>
          )}
        </div>
        
        {/* Backup Schedule */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Backup Schedule</h3>
          {isLoadingSettings ? (
            <div className="space-y-2">
              <div className="h-10 w-full bg-slate-200 animate-pulse rounded"></div>
              <div className="h-10 w-full bg-slate-200 animate-pulse rounded"></div>
              <div className="h-10 w-full bg-slate-200 animate-pulse rounded"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg mb-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="text-sm">Daily Backup</span>
                </div>
                <Switch checked={backupSettings?.dailyBackup || false} disabled />
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg mb-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="text-sm">Weekly Backup</span>
                </div>
                <Switch checked={backupSettings?.weeklyBackup || false} disabled />
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="text-sm">Monthly Backup</span>
                </div>
                <Switch checked={backupSettings?.monthlyBackup || false} disabled />
              </div>
            </>
          )}
        </div>
        
        {/* Recovery Options */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Recovery Options</h3>
          <Button 
            className="w-full mb-2" 
            onClick={handleRestoreFromLatest}
            disabled={!latestBackup || isRestoring}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 21h5v-5"></path>
            </svg>
            {isRestoring ? 'Restoring...' : 'Restore from Backup'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleViewBackupHistory}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M3 3v5h5"></path>
              <path d="M3 3 21 21"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 3 3 21"></path>
            </svg>
            View Backup History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupRecovery;
