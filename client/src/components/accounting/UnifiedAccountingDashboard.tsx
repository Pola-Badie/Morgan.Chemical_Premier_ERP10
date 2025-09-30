import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  ShoppingCart, 
  FileText, 
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { 
  useUnifiedAccountingDashboard,
  useAccountingExpenses,
  usePendingPurchases,
  useOutstandingInvoices,
  useSyncStatus
} from "@/hooks/use-accounting-integration";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export function UnifiedAccountingDashboard() {
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useUnifiedAccountingDashboard();
  const { data: expenses, isLoading: expensesLoading } = useAccountingExpenses();
  const { data: pendingPurchases, isLoading: purchasesLoading } = usePendingPurchases();
  const { data: outstandingInvoices, isLoading: invoicesLoading } = useOutstandingInvoices();
  const { data: syncStatus } = useSyncStatus();

  const handleRefresh = async () => {
    await refetchDashboard();
  };

  if (dashboardLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Status Bar */}
      {syncStatus && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Module Integration Status</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                className="h-8"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(syncStatus.modules || {}).map(([module, status]: [string, any]) => (
                <div key={module} className="flex items-center gap-2">
                  {status.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm capitalize">{module}</span>
                  <Badge variant="outline" className="text-xs">
                    {status.recordCount || 0}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboard?.revenueThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {dashboard?.invoiceCount || 0} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expenses This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(dashboard?.expensesThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(dashboard?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(dashboard?.netProfit || 0)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {(dashboard?.netProfit || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className="text-xs text-muted-foreground">This month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(dashboard?.outstandingInvoices || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Module Integration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Integrated Module Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expenses">
                <DollarSign className="h-4 w-4 mr-1" />
                Expenses
              </TabsTrigger>
              <TabsTrigger value="purchases">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Pending Purchases
              </TabsTrigger>
              <TabsTrigger value="invoices">
                <FileText className="h-4 w-4 mr-1" />
                Outstanding Invoices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="mt-4">
              {expensesLoading ? (
                <div className="text-center py-4">Loading expenses...</div>
              ) : (
                <div className="space-y-2">
                  {expenses?.slice(0, 5).map((expense: any) => (
                    <div key={expense.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.category} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                        <Badge variant={expense.status === 'Paid' ? 'default' : 'secondary'}>
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!expenses || expenses.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No expenses found</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchases" className="mt-4">
              {purchasesLoading ? (
                <div className="text-center py-4">Loading purchases...</div>
              ) : (
                <div className="space-y-2">
                  {pendingPurchases?.slice(0, 5).map((purchase: any) => (
                    <div key={purchase.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{purchase.poNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {purchase.supplier} • Due: {format(new Date(purchase.expectedDeliveryDate), 'MMM dd')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(purchase.totalAmount)}</p>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!pendingPurchases || pendingPurchases.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No pending purchases</p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-4">
              {invoicesLoading ? (
                <div className="text-center py-4">Loading invoices...</div>
              ) : (
                <div className="space-y-2">
                  {outstandingInvoices?.slice(0, 5).map((invoice: any) => (
                    <div key={invoice.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.customer} • Due: {format(new Date(invoice.dueDate), 'MMM dd')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{formatCurrency(invoice.totalAmount)}</p>
                        {invoice.daysOverdue > 0 && (
                          <Badge variant="destructive">
                            {invoice.daysOverdue} days overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!outstandingInvoices || outstandingInvoices.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No outstanding invoices</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}