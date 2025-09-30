import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
export function useBackup() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    // Perform manual backup
    const performBackup = useMutation({
        mutationFn: async (type = 'manual') => {
            return apiRequest('POST', '/api/backups', { type });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/backups'] });
            queryClient.invalidateQueries({ queryKey: ['/api/backups/latest'] });
            toast({
                title: 'Success',
                description: 'Backup has been created successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to create backup: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Restore from backup
    const restoreFromBackup = useMutation({
        mutationFn: async (backupId) => {
            return apiRequest('POST', `/api/backups/${backupId}/restore`, {});
        },
        onSuccess: () => {
            // Invalidate all queries to refresh data after restore
            queryClient.invalidateQueries();
            toast({
                title: 'Success',
                description: 'System has been restored from backup successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to restore from backup: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Update backup settings
    const updateBackupSettings = useMutation({
        mutationFn: async (settings) => {
            return apiRequest('PATCH', '/api/backup-settings', settings);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/backup-settings'] });
            toast({
                title: 'Success',
                description: 'Backup settings have been updated.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update backup settings: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    return {
        performBackup,
        isBackingUp: performBackup.isPending,
        restoreFromBackup,
        isRestoring: restoreFromBackup.isPending,
        updateBackupSettings,
        isUpdatingSettings: updateBackupSettings.isPending,
    };
}
