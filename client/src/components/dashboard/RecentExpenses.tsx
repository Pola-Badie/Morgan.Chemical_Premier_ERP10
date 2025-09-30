import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { Expense } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

const RecentExpenses: React.FC = () => {
  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  // Sort expenses by date descending and take the most recent 5
  const recentExpenses = expenses
    ? [...expenses].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5)
    : [];

  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'Marketing': 'purple',
      'Travel': 'orange',
      'Office Supplies': 'info',
      'Client Entertainment': 'info',
      'Software': 'teal',
      'Administrative': 'gray',
    };
    
    return categoryColors[category] || 'gray';
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Expenses</h2>
          <Link href="/expenses">
            <a className="text-sm text-primary hover:text-primary-700 font-medium">View All</a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300 mb-3">
              <rect width="8" height="14" x="8" y="5" rx="1"></rect>
              <path d="M19 8h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1"></path>
              <path d="M5 8H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1"></path>
            </svg>
            <p className="text-slate-500">No expenses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-2 py-3 text-left font-medium text-slate-500">Date</th>
                  <th className="px-2 py-3 text-left font-medium text-slate-500">Description</th>
                  <th className="px-2 py-3 text-left font-medium text-slate-500">Category</th>
                  <th className="px-2 py-3 text-left font-medium text-slate-500">Amount</th>
                  <th className="px-2 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-2 py-3 text-left font-medium text-slate-500"></th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-3">{formatDate(expense.date)}</td>
                    <td className="px-2 py-3">{expense.description}</td>
                    <td className="px-2 py-3">
                      <Badge variant={getCategoryColor(expense.category)}>
                        {expense.category}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 font-medium">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-2 py-3">
                      {getStatusBadge(expense.status)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button className="text-slate-500 hover:text-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1"></circle>
                          <circle cx="12" cy="5" r="1"></circle>
                          <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentExpenses;
