import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FinancialIntegrationData {
  status: 'active' | 'error';
  accountingIntegration: 'connected' | 'disconnected';
  lastSync: string | null;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
  timestamp: string;
  features: {
    journalEntries: boolean;
    autoAccounting: boolean;
    reportGeneration: boolean;
  };
  message?: string;
}

const FinancialIntegrationStatus: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: integrationStatus, isLoading, error } = useQuery<FinancialIntegrationData>({
    queryKey: ['/api/financial-integration/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: accountingSummary, isLoading: isAccountingLoading } = useQuery({
    queryKey: ['/api/accounting/summary'],
  });

  // Manual refresh function
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/financial-integration/status'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/accounting/summary'] });
      toast({
        title: "Status Refreshed",
        description: "Financial integration status has been updated.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh integration status.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };



  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Financial Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to check financial integration status. Some features may be limited.
        </AlertDescription>
      </Alert>
    );
  }

  const isConnected = integrationStatus?.status === 'active' && integrationStatus?.accountingIntegration === 'connected';

  return (
    <div className="mb-6 space-y-4">
      {/* Integration Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Financial Integration Status</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Accounting System:</span>
              <p className="font-medium">
                {integrationStatus?.accountingIntegration === 'connected' ? '✓ Connected' : '✗ Disconnected'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Sync:</span>
              <p className="font-medium">
                {integrationStatus?.lastSync ? 
                  new Date(integrationStatus.lastSync).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 
                  'No recent activity'
                }
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Auto Journal Entries:</span>
              <p className="font-medium">
                {integrationStatus?.features?.autoAccounting ? '✓ Enabled' : '✗ Disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Financial Summary */}
      {integrationStatus?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    EGP {integrationStatus.summary.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">
                    EGP {integrationStatus.summary.totalExpenses.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className={`h-8 w-8 ${integrationStatus.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold ${integrationStatus.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    EGP {integrationStatus.summary.netProfit.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integration Status Alert */}
      {integrationStatus?.status === 'active' && integrationStatus?.accountingIntegration === 'connected' ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Financial integration is active. All new invoices, expenses, and payments automatically generate journal entries. 
            Last updated: {integrationStatus.timestamp ? new Date(integrationStatus.timestamp).toLocaleTimeString() : 'Unknown'}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {integrationStatus?.message || 'Financial integration is not fully operational. Some features may be limited.'}
            {integrationStatus?.status === 'error' && ' Please check database connection.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FinancialIntegrationStatus;