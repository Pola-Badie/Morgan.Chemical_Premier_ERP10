import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useExpenses } from '@/hooks/use-expenses';
import { AlertCircle, CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import { Expense } from '@shared/schema';

const Approvals: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const { getExpensesByStatus, updateExpenseStatus } = useExpenses();
  const { data: pendingExpenses, isLoading } = getExpensesByStatus('pending');
  
  // Filter expenses based on search term
  const filteredExpenses = pendingExpenses?.filter(expense => 
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle approve expense
  const handleApprove = (expense: Expense) => {
    updateExpenseStatus.mutate({
      id: expense.id,
      status: 'approved',
      approvedById: 1, // Using ID 1 for demo purposes
    });
  };

  // Handle reject expense (open dialog)
  const handleRejectClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowRejectDialog(true);
  };

  // Handle confirm rejection
  const handleConfirmReject = () => {
    if (selectedExpense) {
      updateExpenseStatus.mutate({
        id: selectedExpense.id,
        status: 'rejected',
        rejectionReason,
      });
      setShowRejectDialog(false);
      setRejectionReason('');
    }
  };

  // Helper function to get category badge
  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      'Marketing': 'purple',
      'Travel': 'orange',
      'Office Supplies': 'info',
      'Client Entertainment': 'info',
      'Software': 'teal',
      'Administrative': 'gray',
    };
    
    return (
      <Badge variant={categoryColors[category] as any || 'default'}>
        {category}
      </Badge>
    );
  };

  // View expense receipt
  const viewReceipt = (expense: Expense) => {
    // In a real application, this would open the receipt in a modal or new tab
    if (expense.receiptPath) {
      alert(`Viewing receipt: ${expense.receiptPath}`);
      // window.open(expense.receiptPath, '_blank');
    } else {
      alert('No receipt available for this expense');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Approvals</h1>
          <p className="text-sm text-slate-500">Review and approve pending expense requests</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search expenses..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !filteredExpenses?.length ? (
            <div className="p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No pending approvals</h3>
              <p className="text-slate-500">
                All expenses have been reviewed. Great job!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Receipt</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses?.map((expense) => (
                    <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        <div className="font-medium">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-xs text-slate-500 mt-1 truncate">{expense.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getCategoryBadge(expense.category)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {expense.receiptPath ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewReceipt(expense)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-500">No receipt</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleRejectClick(expense)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            className="text-white"
                            onClick={() => handleApprove(expense)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejecting this expense:
            </p>
            {selectedExpense && (
              <div className="bg-slate-50 p-3 rounded-md mb-4">
                <div className="text-sm">
                  <span className="font-medium">Description:</span> {selectedExpense.description}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Amount:</span> {formatCurrency(selectedExpense.amount)}
                </div>
              </div>
            )}
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approvals;
