import React from 'react';
import { useUserPermissions } from '@/contexts/UserPermissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PermissionGuardProps {
  moduleName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  moduleName, 
  children, 
  fallback 
}) => {
  const { hasPermission, isLoading } = useUserPermissions();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has permission
  if (!hasPermission(moduleName)) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <Alert className="max-w-md border-red-200 bg-red-50">
            <ShieldOff className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-medium">{t('accessDenied')}</p>
                <p className="text-sm">{t('noPermissionForModule')}</p>
                <p className="text-xs text-red-600">
                  {t('contactAdminForAccess')}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    );
  }

  return <>{children}</>;
};

// Hook for checking permissions in components
export const usePermissionCheck = (moduleName: string) => {
  const { hasPermission } = useUserPermissions();
  return hasPermission(moduleName);
};