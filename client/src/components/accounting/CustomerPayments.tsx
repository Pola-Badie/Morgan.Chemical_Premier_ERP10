import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PlusCircle, 
  DollarSign, 
  File, 
  Check, 
  Calendar, 
  CreditCard,
  Link,
  Search,
  AlertCircle,
  ArrowRight,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// Interfaces for data models
interface Customer {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  createdAt: string;
}

interface Payment {
  id: number;
  paymentNumber: string;
  customerId: number;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  status: 'completed' | 'pending' | 'failed';
  allocations: PaymentAllocation[];
}

interface PaymentAllocation {
  id: number;
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
}

// Payment form schema
const paymentFormSchema = z.object({
  customerId: z.number({
    required_error: "Customer is required",
  }),
  amount: z.string({
    required_error: "Amount is required",
  }).refine(value => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentDate: z.string({
    required_error: "Payment date is required",
  }),
  paymentMethod: z.string({
    required_error: "Payment method is required",
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
  allocations: z.array(
    z.object({
      invoiceId: z.number({
        required_error: "Invoice is required",
      }),
      invoiceNumber: z.string(),
      amount: z.string().refine(value => !isNaN(parseFloat(value)) && parseFloat(value) >= 0, {
        message: "Amount must be a non-negative number",
      }),
      amountDue: z.number(),
    })
  ).refine(allocations => {
    // Total allocations shouldn't exceed payment amount
    const totalAllocations = allocations.reduce(
      (sum, allocation) => sum + parseFloat(allocation.amount || "0"), 
      0
    );
    return true; // We'll validate this in the component
  }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const CustomerPayments: React.FC = () => {
  const { toast } = useToast();
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentDetailsDialogOpen, setIsPaymentDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending-invoices");
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [expandedPayments, setExpandedPayments] = useState<number[]>([]);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("all");
  // State for local management of payments data
  const [localPayments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  
  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/customers');
        return await res.json();
      } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
    }
  });

  // Fetch unpaid/partial invoices
  const { data: pendingInvoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['/api/accounting/invoices/pending', selectedCustomer],
    queryFn: async () => {
      try {
        const url = selectedCustomer 
          ? `/api/accounting/invoices/pending?customerId=${selectedCustomer}` 
          : '/api/accounting/invoices/pending';
        const res = await apiRequest('GET', url);
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching pending invoices:", error);
        toast({
          title: "Error",
          description: "Could not fetch pending invoices. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  // Fetch payments
  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/accounting/payments', selectedCustomer],
    queryFn: async () => {
      try {
        const url = selectedCustomer 
          ? `/api/accounting/payments?customerId=${selectedCustomer}` 
          : '/api/accounting/payments';
        const res = await apiRequest('GET', url);
        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Error fetching payments:", error);
        toast({
          title: "Error",
          description: "Could not fetch payment records. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });

  // Setup form with validation
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      customerId: 0,
      amount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "",
      reference: "",
      notes: "",
      allocations: [],
    }
  });

  // Setup field array for allocations
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "allocations"
  });

  // Watch form values
  const watchCustomerId = form.watch("customerId");
  const watchAmount = form.watch("amount");
  const watchAllocations = form.watch("allocations");

  // Helper function to calculate allocation stats
  const calculateAllocationStats = () => {
    const paymentAmount = parseFloat(watchAmount || "0");
    const totalAllocated = watchAllocations.reduce(
      (sum, allocation) => sum + parseFloat(allocation.amount || "0"), 
      0
    );
    
    return {
      paymentAmount,
      totalAllocated,
      remaining: paymentAmount - totalAllocated,
      isFullyAllocated: Math.abs(paymentAmount - totalAllocated) < 0.01
    };
  };

  const allocationStats = calculateAllocationStats();

  // Function to handle customer change
  const handleCustomerChange = async (customerId: number) => {
    form.setValue("customerId", customerId);
    
    // Fetch this customer's pending invoices
    try {
      const res = await apiRequest('GET', `/api/accounting/invoices/pending?customerId=${customerId}`);
      const customerInvoices = await res.json();
      
      // Reset allocations
      form.setValue("allocations", []);
      
      // Add customer's invoices as allocation options
      customerInvoices.forEach((invoice: Invoice) => {
        if (invoice.amountDue > 0) {
          append({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: "0",
            amountDue: invoice.amountDue,
          });
        }
      });
    } catch (error) {
      console.error("Error fetching customer invoices:", error);
    }
  };

  // Function to auto-allocate payment amount to invoices
  const autoAllocatePayment = () => {
    const paymentAmount = parseFloat(watchAmount || "0");
    if (isNaN(paymentAmount) || paymentAmount <= 0) return;
    
    let remainingAmount = paymentAmount;
    const newAllocations = [...watchAllocations];
    
    // Sort invoices by date (oldest first)
    newAllocations.sort((a, b) => a.invoiceId - b.invoiceId);
    
    // Allocate to each invoice until payment is fully allocated
    newAllocations.forEach((allocation, index) => {
      if (remainingAmount <= 0) {
        newAllocations[index] = { ...allocation, amount: "0" };
      } else {
        const amountToAllocate = Math.min(remainingAmount, allocation.amountDue);
        newAllocations[index] = { ...allocation, amount: amountToAllocate.toFixed(2) };
        remainingAmount -= amountToAllocate;
      }
    });
    
    // Update the form
    newAllocations.forEach((allocation, index) => {
      update(index, allocation);
    });
  };

  // Function to handle payment to a specific invoice
  const handlePayInvoice = (invoice: Invoice) => {
    form.reset({
      customerId: invoice.customerId,
      amount: invoice.amountDue.toFixed(2),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "",
      reference: `Payment for invoice ${invoice.invoiceNumber}`,
      notes: "",
      allocations: [{
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amountDue.toFixed(2),
        amountDue: invoice.amountDue,
      }],
    });
    
    setIsAddPaymentDialogOpen(true);
  };

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      // Format the data
      const formattedData = {
        ...data,
        amount: parseFloat(data.amount),
        allocations: data.allocations.map(alloc => ({
          ...alloc,
          amount: parseFloat(alloc.amount),
        })),
      };
      
      const res = await apiRequest('POST', '/api/accounting/payments', formattedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/invoices/pending'] });
      setIsAddPaymentDialogOpen(false);
      form.reset({
        customerId: 0,
        amount: "",
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: "",
        reference: "",
        notes: "",
        allocations: [],
      });
      toast({
        title: "Payment recorded",
        description: "The payment has been recorded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle payment details view
  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsPaymentDetailsDialogOpen(true);
  };

  // Function to toggle payment expansion (to show allocations)
  const togglePaymentExpand = (paymentId: number) => {
    if (expandedPayments.includes(paymentId)) {
      setExpandedPayments(expandedPayments.filter(id => id !== paymentId));
    } else {
      setExpandedPayments([...expandedPayments, paymentId]);
    }
  };

  // Helper to get customer name
  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Customer Payments & Settlements</h3>
        <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <DialogHeader>
              <DialogTitle>Record Customer Payment</DialogTitle>
              <DialogDescription>
                Record a payment received from a customer and allocate it to invoices.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createPaymentMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select
                          onValueChange={(value) => handleCustomerChange(parseInt(value))}
                          defaultValue={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer: Customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name} - {customer.company}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-8" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="bankTransfer">Bank Transfer</SelectItem>
                            <SelectItem value="creditCard">Credit Card</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Check #, Transaction ID, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional payment details" className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {watchCustomerId && fields.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Invoice Allocations</h4>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={autoAllocatePayment}
                        disabled={!watchAmount || parseFloat(watchAmount) <= 0}
                      >
                        Auto-Allocate
                      </Button>
                    </div>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium">Payment Amount</p>
                              <p className="text-lg">{formatCurrency(allocationStats.paymentAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Allocated</p>
                              <p className="text-lg">{formatCurrency(allocationStats.totalAllocated)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Remaining</p>
                              <p className={`text-lg ${allocationStats.remaining < 0 ? 'text-red-500' : ''}`}>
                                {formatCurrency(allocationStats.remaining)}
                              </p>
                            </div>
                          </div>
                          
                          {allocationStats.remaining < 0 && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Allocation Error</AlertTitle>
                              <AlertDescription>
                                Total allocations exceed the payment amount. Please adjust the allocations.
                              </AlertDescription>
                            </Alert>
                          )}
                          
                          {allocationStats.remaining > 0 && allocationStats.paymentAmount > 0 && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Partially Allocated</AlertTitle>
                              <AlertDescription>
                                {formatCurrency(allocationStats.remaining)} of the payment is not allocated to any invoice.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead className="text-right">Amount Due</TableHead>
                          <TableHead className="text-right">Amount to Apply</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`allocations.${index}.amount`}
                                render={({ field: { value, onChange } }) => (
                                  <Checkbox
                                    checked={parseFloat(value) > 0}
                                    onCheckedChange={(checked) => {
                                      onChange(checked 
                                        ? watchAllocations[index].amountDue.toFixed(2) 
                                        : "0"
                                      );
                                    }}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>{field.invoiceNumber}</TableCell>
                            <TableCell className="text-right">{formatCurrency(field.amountDue)}</TableCell>
                            <TableCell className="text-right">
                              <FormField
                                control={form.control}
                                name={`allocations.${index}.amount`}
                                render={({ field }) => (
                                  <FormItem className="m-0">
                                    <FormControl>
                                      <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input className="pl-8 w-[120px] ml-auto" {...field} />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : watchCustomerId ? (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertTitle>No Open Invoices</AlertTitle>
                    <AlertDescription>
                      This customer has no unpaid invoices to which this payment can be applied.
                    </AlertDescription>
                  </Alert>
                ) : null}
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddPaymentDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={
                      createPaymentMutation.isPending || 
                      allocationStats.remaining < 0 ||
                      !watchCustomerId
                    }
                  >
                    {createPaymentMutation.isPending ? "Processing..." : "Record Payment"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <Select 
              defaultValue="all"
              value={invoiceStatusFilter}
              onValueChange={(value) => setInvoiceStatusFilter(value)} 
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partially Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="w-[250px]">
            <Select 
              onValueChange={(value) => setSelectedCustomer(value === "all" ? null : parseInt(value))} 
              value={selectedCustomer?.toString() || "all"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer: Customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending-invoices">Pending Invoices</TabsTrigger>
          <TabsTrigger value="payment-history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending-invoices" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>ETA Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvoices ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : pendingInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">No pending invoices found.</TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    // Filter invoices based on customer and status
                    const filteredInvoices = pendingInvoices.filter((invoice: Invoice) => {
                      // Customer filter
                      const customerMatch = selectedCustomer ? invoice.customerId === selectedCustomer : true;
                      
                      // Status filter
                      const statusMatch = invoiceStatusFilter === 'all' ? true : invoice.status === invoiceStatusFilter;
                      
                      return customerMatch && statusMatch;
                    });
                    
                    if (filteredInvoices.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center">
                            No invoices match the selected filters.
                          </TableCell>
                        </TableRow>
                      );
                    }
                    
                    return filteredInvoices.map((invoice: Invoice, index: number) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          ETA{new Date(invoice.dueDate).getFullYear().toString().slice(-2)}{(new Date(invoice.dueDate).getMonth() + 1).toString().padStart(2, '0')}{new Date(invoice.dueDate).getDate().toString().padStart(2, '0')}{(100 + index).toString()}
                        </TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.amountPaid)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.amountDue)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              invoice.status === 'overdue' ? 'destructive' : 
                              invoice.status === 'partial' ? 'warning' : 
                              'outline'
                            }
                          >
                            {invoice.status === 'overdue' ? 'Overdue' : 
                             invoice.status === 'partial' ? 'Partially Paid' : 
                             'Unpaid'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePayInvoice(invoice)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" /> Record Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="payment-history" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Payment #</TableHead>
                  <TableHead>ETA Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPayments ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-4">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <p className="text-muted-foreground">No payments found in the system.</p>
                        <PlusCircle className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Use the "Record Payment" button to add customer payments.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment: Payment, index: number) => (
                    <React.Fragment key={payment.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePaymentExpand(payment.id)}
                          >
                            {expandedPayments.includes(payment.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          ETA{new Date(payment.paymentDate).getFullYear().toString().slice(-2)}{(new Date(payment.paymentDate).getMonth() + 1).toString().padStart(2, '0')}{new Date(payment.paymentDate).getDate().toString().padStart(2, '0')}{(200 + index).toString()}
                        </TableCell>
                        <TableCell>{payment.customerName}</TableCell>
                        <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {payment.paymentMethod === 'bankTransfer' ? 'Bank Transfer' :
                           payment.paymentMethod === 'creditCard' ? 'Credit Card' :
                           payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              payment.status === 'completed' ? 'outline' : 
                              payment.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => viewPaymentDetails(payment)}
                          >
                            <Search className="h-3 w-3 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {expandedPayments.includes(payment.id) && payment.allocations.length > 0 && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={9}>
                            <div className="px-4 py-2">
                              <h4 className="text-sm font-medium mb-2">Payment Allocations</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-t">
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead className="text-right">Amount Applied</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {payment.allocations.map((allocation) => (
                                    <TableRow key={allocation.id}>
                                      <TableCell>{allocation.invoiceNumber}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(allocation.amount)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={isPaymentDetailsDialogOpen} onOpenChange={setIsPaymentDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Payment #{selectedPayment.paymentNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Customer</h4>
                  <p>{selectedPayment.customerName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Amount</h4>
                  <p className="text-lg font-medium">{formatCurrency(selectedPayment.amount)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Payment Date</h4>
                  <p>{format(new Date(selectedPayment.paymentDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Payment Method</h4>
                  <p>
                    {selectedPayment.paymentMethod === 'bankTransfer' ? 'Bank Transfer' :
                     selectedPayment.paymentMethod === 'creditCard' ? 'Credit Card' :
                     selectedPayment.paymentMethod.charAt(0).toUpperCase() + selectedPayment.paymentMethod.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">ETA Number</h4>
                  <p className="text-green-600 font-medium">ETA{new Date(selectedPayment.paymentDate).getFullYear().toString().slice(-2)}{String(new Date(selectedPayment.paymentDate).getMonth() + 1).padStart(2, '0')}{String(new Date(selectedPayment.paymentDate).getDate()).padStart(2, '0')}{String(selectedPayment.id).padStart(3, '0')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Reference</h4>
                  <p>{selectedPayment.reference || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <Badge 
                    variant={
                      selectedPayment.status === 'completed' ? 'outline' : 
                      selectedPayment.status === 'pending' ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                  </Badge>
                </div>
                <div></div>
              </div>
              
              {selectedPayment.notes && (
                <div>
                  <h4 className="text-sm font-medium">Notes</h4>
                  <p>{selectedPayment.notes}</p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Allocations</h4>
                {selectedPayment.allocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No allocations for this payment.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead className="text-right">Amount Applied</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPayment.allocations.map((allocation) => (
                        <TableRow key={allocation.id}>
                          <TableCell>{allocation.invoiceNumber}</TableCell>
                          <TableCell className="text-right">{formatCurrency(allocation.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-medium">Total</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(
                            selectedPayment.allocations.reduce((sum, a) => sum + a.amount, 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsPaymentDetailsDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CustomerPayments;