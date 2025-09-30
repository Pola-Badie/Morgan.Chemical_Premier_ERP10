import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Expense } from '@shared/schema';
import { formatCurrency, getPeriodLabel } from '@/lib/utils';

const ExpenseTrends: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  // Fetch expenses data
  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  const prepareChartData = () => {
    if (!expenses || expenses.length === 0) return [];
    
    // Group data by period
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let groupedData: Record<string, Record<string, number>> = {};
    let labels: string[] = [];
    
    // Prepare labels and empty groups based on the selected period
    switch (period) {
      case 'week':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const label = date.toLocaleDateString('en-US', { weekday: 'short' });
          labels.push(label);
          groupedData[label] = {};
        }
        break;
      case 'month':
        // Current month days
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const label = i.toString();
          labels.push(label);
          groupedData[label] = {};
        }
        break;
      case 'quarter':
        // Last 3 months
        for (let i = 2; i >= 0; i--) {
          const monthIdx = (currentMonth - i + 12) % 12;
          const label = new Date(currentYear, monthIdx, 1).toLocaleDateString('en-US', { month: 'short' });
          labels.push(label);
          groupedData[label] = {};
        }
        break;
      case 'year':
        // All months in current year
        for (let i = 0; i < 12; i++) {
          const label = new Date(currentYear, i, 1).toLocaleDateString('en-US', { month: 'short' });
          labels.push(label);
          groupedData[label] = {};
        }
        break;
    }
    
    // Categorize expenses
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      let label = '';
      
      switch (period) {
        case 'week':
          // Skip if not in the last 7 days
          const weekDiff = Math.floor((now.getTime() - expenseDate.getTime()) / (24 * 60 * 60 * 1000));
          if (weekDiff > 6) return;
          label = expenseDate.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'month':
          // Skip if not in current month
          if (expenseDate.getMonth() !== currentMonth || expenseDate.getFullYear() !== currentYear) return;
          label = expenseDate.getDate().toString();
          break;
        case 'quarter':
          // Skip if not in last 3 months
          const monthDiff = (currentMonth - expenseDate.getMonth() + 12) % 12;
          if (monthDiff > 2 || expenseDate.getFullYear() < currentYear) return;
          label = expenseDate.toLocaleDateString('en-US', { month: 'short' });
          break;
        case 'year':
          // Skip if not in current year
          if (expenseDate.getFullYear() !== currentYear) return;
          label = expenseDate.toLocaleDateString('en-US', { month: 'short' });
          break;
      }
      
      if (!groupedData[label]) {
        groupedData[label] = {};
      }
      
      if (!groupedData[label][expense.category]) {
        groupedData[label][expense.category] = 0;
      }
      
      groupedData[label][expense.category] += expense.amount;
    });
    
    // Convert to chart data format
    return labels.map(label => {
      return {
        name: label,
        ...groupedData[label],
      };
    });
  };

  const chartData = prepareChartData();
  
  // Extract unique categories for chart colors
  const categories = expenses 
    ? [...new Set(expenses.map(expense => expense.category))]
    : [];
  
  // Define colors for categories
  const categoryColors: Record<string, string> = {
    'Marketing': '#8b5cf6',
    'Travel': '#f59e0b',
    'Office Supplies': '#10b981',
    'Client Entertainment': '#3b82f6',
    'Software': '#0ea5e9',
    'Administrative': '#6b7280',
  };
  
  // Fallback colors
  const fallbackColors = [
    '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', 
    '#0ea5e9', '#6b7280', '#ec4899', '#ef4444'
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Expense Trends</h2>
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Button 
              variant={period === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPeriod('week')}
            >
              Week
            </Button>
            <Button 
              variant={period === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPeriod('month')}
            >
              Month
            </Button>
            <Button 
              variant={period === 'quarter' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPeriod('quarter')}
            >
              Quarter
            </Button>
            <Button 
              variant={period === 'year' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPeriod('year')}
            >
              Year
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="h-72 w-full flex items-center justify-center bg-slate-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-primary"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
          </div>
        ) : (
          chartData.length === 0 ? (
            <div className="h-72 w-full flex flex-col items-center justify-center bg-slate-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-3"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
              <p className="text-slate-500">No expense data available for the selected period</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    {categories.map((category, index) => (
                      <linearGradient key={category} id={`color-${category}`} x1="0" y1="0" x2="0" y2="1">
                        <stop 
                          offset="5%" 
                          stopColor={categoryColors[category] || fallbackColors[index % fallbackColors.length]} 
                          stopOpacity={0.8}
                        />
                        <stop 
                          offset="95%" 
                          stopColor={categoryColors[category] || fallbackColors[index % fallbackColors.length]} 
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${formatCurrency(value as number)}`, '']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  {categories.map((category, index) => (
                    <Area
                      key={category}
                      type="monotone"
                      dataKey={category}
                      name={category}
                      stroke={categoryColors[category] || fallbackColors[index % fallbackColors.length]}
                      fillOpacity={1}
                      fill={`url(#color-${category})`}
                      stackId="1"
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseTrends;
