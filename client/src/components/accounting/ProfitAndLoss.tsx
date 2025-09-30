import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, Download, FileText, RefreshCw, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PnLData {
  revenue: {
    accounts: { name: string; amount: number }[];
    total: number;
  };
  expenses: {
    accounts: { name: string; amount: number }[];
    total: number;
  };
  netIncome: number;
  profitMargin: number;
  reportPeriod: {
    start: string;
    end: string;
  };
}

const ProfitAndLoss: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = useState<PnLData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [periodType, setPeriodType] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  // Handle date range change
  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle period type change and auto-adjust dates
  const handlePeriodTypeChange = (value: "monthly" | "quarterly" | "yearly") => {
    setPeriodType(value);
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (value) {
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      console.log('Generating P&L report with params:', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await fetch(`/api/reports/profit-loss?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profit & loss data');
      }
      
      const reportData = await response.json();
      console.log('P&L report data received:', reportData);
      
      if (reportData) {
        setData(reportData);
        toast({
          title: "Report Generated",
          description: "Profit & Loss report has been generated successfully.",
        });
      }
    } catch (error) {
      console.error('Error fetching P&L data:', error);
      toast({
        title: "Error",
        description: "Failed to generate Profit & Loss report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const element = document.getElementById('pnl-report');
      if (!element) {
        throw new Error('Report element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`profit-loss-statement-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: "Profit & Loss statement has been saved as PDF.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Profit & Loss Statement
          </CardTitle>
          <CardDescription>
            Generate comprehensive profit and loss reports for specified periods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-40">
              <label className="text-sm font-medium">Period Type</label>
              <Select value={periodType} onValueChange={handlePeriodTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={handleGenerateReport} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
            {data && (
              <Button onClick={handlePrint} disabled={isPrinting} variant="outline">
                <Download className={`h-4 w-4 mr-2 ${isPrinting ? 'animate-spin' : ''}`} />
                {isPrinting ? 'Saving...' : 'Download PDF'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !data ? (
        <div className="bg-muted/30 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
          <div className="h-10 w-10 text-muted-foreground mb-2">
            <FileText className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium">No P&L data available</h3>
          <p className="text-muted-foreground">Select a date range and generate the report</p>
        </div>
      ) : (
        <Card className="w-full" id="pnl-report">
          <CardHeader className="bg-navy-700 text-white text-center py-4">
            <CardTitle className="text-xl">Premier ERP System</CardTitle>
            <CardDescription className="text-white text-md font-medium">
              Profit & Loss Statement
            </CardDescription>
            <CardDescription className="text-white">
              {format(new Date(data.reportPeriod.start), 'MMMM dd, yyyy')} to {format(new Date(data.reportPeriod.end), 'MMMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-3/5">Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Revenue Section */}
                <TableRow className="bg-gray-100 font-medium">
                  <TableCell colSpan={2}>REVENUE</TableCell>
                </TableRow>
                
                {data.revenue.accounts.map((account, index) => (
                  <TableRow key={index}>
                    <TableCell className="pl-6">{account.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(account.amount)}</TableCell>
                  </TableRow>
                ))}
                
                <TableRow className="bg-blue-50 font-medium">
                  <TableCell>Total Revenue</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.revenue.total)}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                
                {/* Expenses Section */}
                <TableRow className="bg-gray-100 font-medium">
                  <TableCell colSpan={2}>EXPENSES</TableCell>
                </TableRow>
                
                {data.expenses.accounts.map((expense, index) => (
                  <TableRow key={index}>
                    <TableCell className="pl-6">{expense.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
                
                <TableRow className="bg-blue-50 font-medium">
                  <TableCell>Total Expenses</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.expenses.total)}</TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                
                {/* Net Income */}
                <TableRow className="bg-navy-700/10 font-bold text-lg">
                  <TableCell>NET {data.netIncome >= 0 ? 'INCOME' : 'LOSS'}</TableCell>
                  <TableCell className={`text-right ${data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.netIncome)}
                  </TableCell>
                </TableRow>
                
                {/* Profit Margin */}
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell>Profit Margin</TableCell>
                  <TableCell className={`text-right ${data.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.profitMargin.toFixed(2)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfitAndLoss;