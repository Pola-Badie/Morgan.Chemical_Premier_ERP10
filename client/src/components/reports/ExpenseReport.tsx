import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense } from '@shared/schema';

interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}
import { formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useQuery } from '@tanstack/react-query';

interface ExpenseReportProps {
  period: string;
}

const ExpenseReport: React.FC<ExpenseReportProps> = ({ period }) => {
  const [reportData, setReportData] = useState<{ name: string; value: number; color: string }[]>([]);
  
  // Fetch expenses
  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ['/api/expenses'],
  });

  // Fetch expense categories
  const { data: expenseCategories } = useQuery<ExpenseCategory[]>({
    queryKey: ['/api/expense-categories'],
  });

  // Generate consistent colors for categories
  const generateCategoryColor = (categoryName: string): string => {
    const colors = [
      '#8b5cf6', // purple
      '#f59e0b', // amber
      '#10b981', // green
      '#3b82f6', // blue
      '#0ea5e9', // sky
      '#ec4899', // pink
      '#ef4444', // red
      '#14b8a6', // teal
      '#f97316', // orange
      '#6b7280', // gray
      '#84cc16', // lime
      '#f43f5e', // rose
      '#a855f7', // violet
      '#06b6d4', // cyan
      '#eab308', // yellow
    ];
    
    // Generate consistent hash from category name
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      const char = categoryName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Function to prepare chart data
  useEffect(() => {
    if (!expenses) return;

    const now = new Date();
    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      
      switch (period) {
        case 'month':
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear();
        case 'quarter':
          const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          return expenseDate.getMonth() >= quarterStartMonth && 
                 expenseDate.getMonth() < quarterStartMonth + 3 &&
                 expenseDate.getFullYear() === now.getFullYear();
        case 'year':
          return expenseDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Group by category
    const categories: Record<string, number> = {};
    filtered.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    // Convert to chart data with consistent colors
    const data = Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      color: generateCategoryColor(name),
    }));

    setReportData(data);
  }, [expenses, period]);

  // Calculate total expenses
  const totalExpenses = reportData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip component for the PieChart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p>{formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-slate-500">
            {((payload[0].value / totalExpenses) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Function to generate and download PDF report
  const generatePdfReport = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Expense Report', 105, 15, { align: 'center' });
    
    // Add period
    doc.setFontSize(12);
    const periodText = `Period: ${getPeriodText(period)}`;
    doc.text(periodText, 105, 25, { align: 'center' });
    
    // Add generation date
    const dateText = `Generated on: ${new Date().toLocaleDateString()}`;
    doc.text(dateText, 105, 32, { align: 'center' });
    
    // Add total
    doc.setFontSize(14);
    const totalText = `Total Expenses: ${formatCurrency(totalExpenses)}`;
    doc.text(totalText, 105, 42, { align: 'center' });
    
    // Create table data
    const tableData = reportData.map(item => [
      item.name,
      formatCurrency(item.value),
      `${((item.value / totalExpenses) * 100).toFixed(1)}%`
    ]);
    
    // Add table
    (doc as any).autoTable({
      head: [['Category', 'Amount', 'Percentage']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
    });
    
    // Save PDF
    doc.save(`expense-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Helper function to get period text
  const getPeriodText = (period: string): string => {
    const now = new Date();
    switch (period) {
      case 'month':
        return now.toLocaleDateString('default', { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
      case 'year':
        return now.getFullYear().toString();
      default:
        return 'All Time';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Expense Breakdown</h2>
          <Button onClick={generatePdfReport} disabled={isLoading || reportData.length === 0}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF Report
          </Button>
        </div>
        
        {isLoading ? (
          <div className="h-72 w-full flex items-center justify-center bg-slate-50 rounded-lg">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="animate-spin text-primary"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          </div>
        ) : !expenseCategories ? (
          <div className="h-72 w-full flex items-center justify-center bg-slate-50 rounded-lg">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="animate-spin text-primary"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <span className="ml-2 text-slate-500">Loading categories...</span>
          </div>
        ) : reportData.length === 0 ? (
          <div className="h-72 w-full flex flex-col items-center justify-center bg-slate-50 rounded-lg">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-slate-300 mb-3"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p className="text-slate-500">No expense data available for this period</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-slate-800 mb-2">Summary</h3>
                <p className="font-bold text-2xl mb-2">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-slate-500">
                  Total expenses for {getPeriodText(period)}
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-slate-800">Category Breakdown</h3>
                {reportData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                      <span className="text-xs text-slate-500">
                        ({((item.value / totalExpenses) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpenseReport;
