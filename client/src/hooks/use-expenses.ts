import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Expense, UpdateExpenseStatus } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useExpenses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all expenses
  const getAllExpenses = () => {
    return useQuery<Expense[]>({
      queryKey: ['/api/expenses'],
    });
  };

  // Get expenses by status
  const getExpensesByStatus = (status: string) => {
    return useQuery<Expense[]>({
      queryKey: ['/api/expenses', { status }],
      queryFn: async () => {
        const res = await fetch(`/api/expenses?status=${status}`);
        if (!res.ok) throw new Error('Failed to fetch expenses by status');
        return res.json();
      },
    });
  };

  // Get expenses by category
  const getExpensesByCategory = (category: string) => {
    return useQuery<Expense[]>({
      queryKey: ['/api/expenses', { category }],
      queryFn: async () => {
        const res = await fetch(`/api/expenses?category=${category}`);
        if (!res.ok) throw new Error('Failed to fetch expenses by category');
        return res.json();
      },
    });
  };

  // Get a single expense by ID
  const getExpenseById = (id: number) => {
    return useQuery<Expense>({
      queryKey: ['/api/expenses', id],
      queryFn: async () => {
        const res = await fetch(`/api/expenses/${id}`);
        if (!res.ok) throw new Error('Failed to fetch expense details');
        return res.json();
      },
      enabled: !!id,
    });
  };

  // Update expense status (approve/reject)
  const updateExpenseStatus = useMutation({
    mutationFn: async ({ id, status, approvedById, rejectionReason }: { id: number; status: string; approvedById?: number; rejectionReason?: string }) => {
      const updateData: UpdateExpenseStatus = {
        status: status as any,
        approvedById,
        rejectionReason,
      };
      return apiRequest('PATCH', `/api/expenses/${id}/status`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: 'Success',
        description: 'Expense status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update expense status: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete expense
  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: 'Success',
        description: 'Expense has been deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete expense: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    getAllExpenses,
    getExpensesByStatus,
    getExpensesByCategory,
    getExpenseById,
    updateExpenseStatus,
    deleteExpense,
  };
}
