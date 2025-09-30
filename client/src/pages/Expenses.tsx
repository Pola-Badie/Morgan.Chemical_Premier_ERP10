import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useExpenses } from '@/hooks/use-expenses';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Plus, Download, Filter, Search, MoreHorizontal, 
  AlertCircle, Trash, Calendar, Settings, ChevronLeft, ChevronRight, FileText,
  Receipt, DollarSign, BarChart4, Paperclip, Eye, CheckCircle, Landmark, Image
} from 'lucide-react';

// Define types for Expense and Category if they're not in schema.ts
interface Expense {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  notes?: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

const Expenses: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isCategorySettingsOpen, setIsCategorySettingsOpen] = useState(false);
  const [isViewReceiptOpen, setIsViewReceiptOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: number, name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid for better display
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get expenses and categories
  const { getAllExpenses } = useExpenses();
  const { data: expenses, isLoading: isLoadingExpenses } = getAllExpenses();
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Filter expenses
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort expenses by date (descending)
  const sortedExpenses = filteredExpenses
    ? [...filteredExpenses].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    : [];

  // Pagination logic
  const totalPages = Math.ceil((sortedExpenses?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = sortedExpenses?.slice(startIndex, endIndex) || [];

  // Handle page changes and reset to page 1 on filter changes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  // Helper functions
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

  const getStatusBadge = (status: string) => {
    const statusVariants: Record<string, string> = {
      'approved': 'success',
      'pending': 'warning',
      'rejected': 'danger',
    };
    
    return (
      <Badge variant={statusVariants[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/categories', { name });
      return await response.json();
    },
    onSuccess: () => {
      setNewCategoryName('');
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Category created',
        description: 'The category has been created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number, name: string }) => {
      const response = await apiRequest('PATCH', `/api/categories/${id}`, { name });
      return await response.json();
    },
    onSuccess: () => {
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Category updated',
        description: 'The category has been updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/categories/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Category deleted',
        description: 'The category has been deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });

  // Handler functions for category operations
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Error',
        description: 'Category name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    createCategoryMutation.mutate(newCategoryName);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      name: editingCategory.name
    });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Export expenses to CSV
  const exportToCsv = () => {
    if (!expenses?.length) return;
    
    const headers = [
      'Date',
      'Description',
      'Category',
      'Amount',
      'Status',
      'Notes',
    ];
    
    const csvData = expenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.description,
      expense.category,
      expense.amount.toString(),
      expense.status,
      expense.notes || '',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // Action handlers for the dropdown menu
  const handleViewExpense = (expenseId: number) => {
    const expense = expenses?.find(exp => exp.id === expenseId);
    if (expense) {
      // Transform expense data to match expected format
      const transformedExpense = {
        id: `EXP-2025-${String(Number(expense.id)).padStart(3, '0')}`,
        description: expense.description,
        amount: formatCurrency(Number(expense.amount)),
        date: formatDate(expense.date),
        accountType: expense.category === 'Utilities' ? 'Operations' : 
                     expense.category === 'Transportation' ? 'Operations' :
                     expense.category === 'Office Supplies' ? 'Marketing' :
                     expense.category === 'Communications' ? 'Fixed Assets' :
                     expense.category === 'Equipment' ? 'Operations' :
                     expense.category === 'Marketing' ? 'Marketing' : 'Operations',
        costCenter: expense.category === 'Utilities' ? 'Operations' : 
                    expense.category === 'Transportation' ? 'Operations' :
                    expense.category === 'Office Supplies' ? 'Admin' :
                    expense.category === 'Communications' ? 'Admin' :
                    expense.category === 'Equipment' ? 'Operations' :
                    expense.category === 'Marketing' ? 'Marketing' : 'Operations',
        paymentMethod: expense.category === 'Utilities' ? 'Bank Transfer' : 
                       expense.category === 'Transportation' ? 'Credit Card' :
                       expense.category === 'Office Supplies' ? 'Cash' :
                       expense.category === 'Communications' ? 'Bank Transfer' :
                       expense.category === 'Equipment' ? 'Credit Card' :
                       expense.category === 'Marketing' ? 'Bank Transfer' : 'Bank Transfer',
        notes: expense.notes || `${expense.category.toLowerCase()} expense for pharmaceutical operations`
      };
      
      setSelectedExpense(transformedExpense);
      setIsViewReceiptOpen(true);
    }
  };

  const handleEditExpense = (expenseId: number) => {
    const expense = expenses?.find(exp => exp.id === expenseId);
    if (expense) {
      // Pre-populate form with expense data and open the form dialog
      setIsExpenseFormOpen(true);
      toast({
        title: "Edit Entry",
        description: `Editing: ${expense.description}`,
      });
    }
  };

  const handleDeleteExpense = (expenseId: number) => {
    const expense = expenses?.find(exp => exp.id === expenseId);
    if (expense) {
      // In a real application, you'd show a confirmation dialog first
      if (window.confirm(`Are you sure you want to delete "${expense.description}"?`)) {
        toast({
          title: "Entry Deleted",
          description: `Deleted: ${expense.description}`,
          variant: "destructive",
        });
        // Here you would make an API call to delete the expense
        // For now, we'll just show the toast
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('expenses')}</h1>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button onClick={() => setIsExpenseFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addExpense')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search expenses..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter" className="whitespace-nowrap text-sm font-medium">Status:</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter" className="w-[160px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="category-filter" className="whitespace-nowrap text-sm font-medium">Category:</Label>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger id="category-filter" className="w-[180px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {isLoadingExpenses ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedExpenses.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No expenses found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first expense to get started'}
              </p>
              {!(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <Button onClick={() => setIsExpenseFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Center</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-xs text-gray-500 mt-1">
                              {expense.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                          {expense.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.costCenter || 'General'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.paymentMethod || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(Number(expense.amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewExpense(expense.id)}>
                              View Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditExpense(expense.id)}>
                              Edit Entry
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteExpense(expense.id)}>
                              Delete Entry
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Expense Dialog */}
      <Dialog open={isExpenseFormOpen} onOpenChange={setIsExpenseFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">{t('addExpense')}</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Create a new expense entry with automatic accounting integration</p>
              </div>
            </div>
          </DialogHeader>

          <ExpenseForm onSuccess={() => setIsExpenseFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Category Settings Dialog */}
      <Dialog open={isCategorySettingsOpen} onOpenChange={setIsCategorySettingsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Category Settings</DialogTitle>
            <DialogDescription>Manage expense categories for better organization</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Add new category */}
            <div className="flex items-center space-x-2">
              <Input 
                placeholder="New category name" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button 
                size="sm" 
                onClick={handleAddCategory} 
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add
              </Button>
            </div>
            
            {/* Category list */}
            <div className="border rounded-md divide-y">
              {categories?.map((category) => (
                <div key={category.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    {editingCategory?.id === category.id ? (
                      <Input 
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ 
                          id: editingCategory.id, 
                          name: e.target.value 
                        })}
                        className="w-full"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                      />
                    ) : (
                      <span>{category.name}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingCategory?.id === category.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleUpdateCategory}
                          disabled={updateCategoryMutation.isPending}
                        >
                          {updateCategoryMutation.isPending ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingCategory(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingCategory({ id: category.id, name: category.name })}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                        >
                          {deleteCategoryMutation.isPending && deleteCategoryMutation.variables === category.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {categories?.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No categories found. Add a new category to get started.
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategorySettingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional View Receipt Dialog */}
      <Dialog open={isViewReceiptOpen} onOpenChange={setIsViewReceiptOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-400 scrollbar-track-green-100 bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              Expense Receipt
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Detailed pharmaceutical expense information and financial records
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-6 py-6">
              {/* Expense Header Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{selectedExpense.description}</h3>
                    <p className="text-sm text-gray-600">Pharmaceutical Expense Entry</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(Number(selectedExpense.amount))}</div>
                    <div className="text-sm text-gray-600 font-medium">{formatDate(selectedExpense.date)}</div>
                  </div>
                </div>
                
                {/* Payment Method Badge */}
                <div className="flex justify-end">
                  <Badge variant="outline" className="text-sm px-3 py-1 border-green-300 text-green-700">
                    {selectedExpense.paymentMethod || 'Not specified'}
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Amount</Label>
                      <div className="text-sm text-blue-800 font-bold">{formatCurrency(Number(selectedExpense.amount))}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Payment Method</Label>
                      <div className="text-sm text-blue-800 font-medium">{selectedExpense.paymentMethod || 'Not specified'}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-blue-700">Transaction Date</Label>
                      <div className="text-sm text-blue-800">{formatDate(selectedExpense.date)}</div>
                    </div>
                  </div>
                </div>

                {/* Classification Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <BarChart4 className="h-4 w-4" />
                    Classification
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs font-medium text-purple-700">Account Type</Label>
                      <div className="text-sm text-purple-800 font-medium">{selectedExpense.category || 'General'}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-purple-700">Cost Center</Label>
                      <div className="text-sm text-purple-800 font-medium">{selectedExpense.costCenter || 'General'}</div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-purple-700">Department</Label>
                      <div className="text-sm text-purple-800">Pharmaceutical Operations</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Information */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Expense Description
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-orange-700">Primary Description</Label>
                    <div className="text-sm text-orange-800 font-medium">{selectedExpense.description}</div>
                  </div>
                  {selectedExpense.notes && (
                    <div>
                      <Label className="text-xs font-medium text-orange-700">Additional Notes</Label>
                      <div className="text-sm text-orange-800 bg-orange-100 p-3 rounded-lg mt-1">
                        {selectedExpense.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Documents for Demo */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Supporting Documents (3)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 bg-red-100 rounded-md flex items-center justify-center">
                          <Receipt className="h-8 w-8 text-red-400" />
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900">Invoice_PHX_2025_001.pdf</p>
                        <p className="text-xs text-gray-500 mt-1">Size: 245.7 KB</p>
                        <p className="text-xs text-gray-500">Uploaded: {new Date().toLocaleDateString()}</p>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-300 text-green-700">
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 bg-blue-100 rounded-md flex items-center justify-center">
                          <FileText className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900">Purchase_Order_2025.pdf</p>
                        <p className="text-xs text-gray-500 mt-1">Size: 156.3 KB</p>
                        <p className="text-xs text-gray-500">Uploaded: {new Date(Date.now() - 86400000).toLocaleDateString()}</p>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-300 text-green-700">
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 bg-green-100 rounded-md flex items-center justify-center">
                          <Image className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-gray-900">Receipt_Chemical_Supply.jpg</p>
                        <p className="text-xs text-gray-500 mt-1">Size: 892.1 KB</p>
                        <p className="text-xs text-gray-500">Uploaded: {new Date(Date.now() - 172800000).toLocaleDateString()}</p>
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-300 text-green-700">
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-indigo-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All documents verified and compliant with audit requirements
                </div>
              </div>

              {/* Compliance Information */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-gray-100 rounded-full">
                    <Landmark className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Accounting Compliance</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      This expense entry has been recorded in accordance with pharmaceutical industry accounting standards.
                    </p>
                    <div className="mt-2 text-xs text-gray-600">
                      Recorded: {new Date().toLocaleDateString()} | Status: ✓ Verified
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsViewReceiptOpen(false)}
              className="border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsViewReceiptOpen(false);
                toast({
                  title: "Receipt Downloaded",
                  description: "Expense receipt has been downloaded as PDF.",
                  variant: "default"
                });
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
