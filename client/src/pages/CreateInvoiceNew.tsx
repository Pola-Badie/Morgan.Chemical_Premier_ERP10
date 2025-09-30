import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFinancialPreferences } from '@/hooks/use-financial-preferences';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash,
  Loader2,
  FileText,
  User,
  Calendar,
  Package,
} from "lucide-react";

// Form schema
const invoiceItemSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  total: z.number().min(0, "Total must be positive"),
});

const invoiceFormSchema = z.object({
  customer: z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
  }),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  subtotal: z.number().min(0),
  discountType: z.enum(["none", "percentage", "amount"]),
  discountValue: z.number().min(0).optional(),
  discountAmount: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().min(0),
  grandTotal: z.number().min(0),
  paymentStatus: z.enum(["paid", "unpaid", "partial"]),
  paymentMethod: z.string().optional(),
  paymentTerms: z.string(),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// Dynamic default form values based on system preferences  
const getDefaultFormValues = (financialPrefs: any): InvoiceFormValues => ({
  customer: {
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  },
  items: [],
  subtotal: 0,
  discountType: "none",
  discountValue: 0,
  discountAmount: 0,
  taxRate: financialPrefs.taxRate || 14,
  taxAmount: 0,
  grandTotal: 0,
  paymentStatus: "unpaid",
  paymentMethod: "",
  paymentTerms: "30",
  notes: "",
});

export default function CreateInvoice() {
  const { toast } = useToast();
  const { preferences: financialPrefs, formatCurrency } = useFinancialPreferences();
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showQuotationSelector, setShowQuotationSelector] = useState(false);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: getDefaultFormValues(financialPrefs),
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  // Watch form values for calculations
  const watchItems = form.watch("items");
  const watchTaxRate = form.watch("taxRate");
  const watchDiscountType = form.watch("discountType");
  const watchDiscountValue = form.watch("discountValue");

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch quotations
  const { data: quotations = [] } = useQuery({
    queryKey: ["/api/quotations"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders/production-history"],
    staleTime: 5 * 60 * 1000,
  });

  // Calculate totals when items or rates change
  useEffect(() => {
    const items = watchItems || [];
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    
    // Calculate discount
    let discountAmount = 0;
    if (watchDiscountType === "percentage" && watchDiscountValue) {
      discountAmount = (subtotal * watchDiscountValue) / 100;
    } else if (watchDiscountType === "amount" && watchDiscountValue) {
      discountAmount = watchDiscountValue;
    }
    
    // Calculate tax on discounted amount
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (watchTaxRate || 0)) / 100;
    const grandTotal = taxableAmount + taxAmount;

    form.setValue("subtotal", subtotal);
    form.setValue("discountAmount", discountAmount);
    form.setValue("taxAmount", taxAmount);
    form.setValue("grandTotal", grandTotal);
  }, [watchItems, watchTaxRate, watchDiscountType, watchDiscountValue, form]);

  // Add product row
  const addProductRow = () => {
    append({
      productId: 0,
      productName: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    });
  };

  // Handle product selection
  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p: any) => p.id === parseInt(productId));
    if (product) {
      form.setValue(`items.${index}.productId`, product.id);
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.unitPrice`, product.price || 0);
      
      const quantity = form.getValues(`items.${index}.quantity`) || 1;
      const total = quantity * (product.price || 0);
      form.setValue(`items.${index}.total`, total);
    }
  };

  // Handle quantity/price changes
  const handleItemChange = (index: number, field: "quantity" | "unitPrice", value: number) => {
    form.setValue(`items.${index}.${field}`, value);
    
    const quantity = field === "quantity" ? value : form.getValues(`items.${index}.quantity`);
    const unitPrice = field === "unitPrice" ? value : form.getValues(`items.${index}.unitPrice`);
    const total = quantity * unitPrice;
    
    form.setValue(`items.${index}.total`, total);
  };

  // Handle quotation selection
  const handleQuotationSelection = (quotation: any) => {
    // Import customer data
    if (quotation.customerName) {
      form.setValue("customer.name", quotation.customerName);
      form.setValue("customer.email", quotation.customerEmail || "");
      form.setValue("customer.company", quotation.customerCompany || "");
    }

    // Import items
    if (quotation.items && quotation.items.length > 0) {
      form.setValue("items", quotation.items.map((item: any) => ({
        productId: item.productId || 0,
        productName: item.productName || item.name,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        total: item.total || (item.quantity * item.unitPrice) || 0,
      })));
    }

    setShowQuotationSelector(false);
    toast({
      title: "Quotation Imported",
      description: "Customer and item data has been imported from the quotation.",
    });
  };

  // Handle order selection
  const handleOrderSelection = (order: any) => {
    // Import customer data
    if (order.customerName) {
      form.setValue("customer.name", order.customerName);
      form.setValue("customer.email", order.customerEmail || "");
      form.setValue("customer.company", order.customerCompany || "");
    }

    // Import items from order
    if (order.items && order.items.length > 0) {
      form.setValue("items", order.items.map((item: any) => ({
        productId: item.productId || 0,
        productName: item.productName || item.name,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        total: item.total || (item.quantity * item.unitPrice) || 0,
      })));
    }

    setShowOrderSelector(false);
    toast({
      title: "Order Imported",
      description: "Customer and item data has been imported from the order.",
    });
  };

  // Submit form
  const onSubmit = async (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/sales", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          type: "invoice",
          date: new Date().toISOString(),
          invoiceNumber: `INV-${Date.now()}`,
        }),
      });

      toast({
        title: "Invoice Created",
        description: "Your invoice has been created successfully.",
      });

      setShowInvoicePreview(true);
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add initial item if none exist
  useEffect(() => {
    if (fields.length === 0) {
      addProductRow();
    }
  }, [fields.length]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Create Invoice</h1>
          <p className="text-muted-foreground">
            Create a new invoice for your customers
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowQuotationSelector(true)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Select from Quotations
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowOrderSelector(true)}
          >
            <Package className="mr-2 h-4 w-4" />
            Select from Order History
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  {...form.register("customer.name")}
                  placeholder="Enter customer name"
                />
                {form.formState.errors.customer?.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.customer.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  {...form.register("customer.email")}
                  placeholder="Enter customer email"
                />
                {form.formState.errors.customer?.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.customer.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="customerCompany">Company</Label>
                <Input
                  id="customerCompany"
                  {...form.register("customer.company")}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  {...form.register("customer.phone")}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerAddress">Address</Label>
              <Textarea
                id="customerAddress"
                {...form.register("customer.address")}
                placeholder="Enter customer address"
                rows={3}
              />
            </div>

            <Separator />

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Invoice Items</h3>
                <Button type="button" onClick={addProductRow} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select
                          value={form.watch(`items.${index}.productId`)?.toString() || ""}
                          onValueChange={(value) => handleProductSelect(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product: any) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={form.watch(`items.${index}.quantity`) || 1}
                          onChange={(e) => 
                            handleItemChange(index, "quantity", parseInt(e.target.value) || 1)
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.watch(`items.${index}.unitPrice`) || 0}
                          onChange={(e) => 
                            handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        {formatCurrency(form.watch(`items.${index}.total`) || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Payment and Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Payment Details</h3>
                <div>
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={form.watch("paymentStatus")}
                    onValueChange={(value: any) => form.setValue("paymentStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select
                    value={form.watch("paymentTerms")}
                    onValueChange={(value) => form.setValue("paymentTerms", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Due Immediately</SelectItem>
                      <SelectItem value="15">Net 15</SelectItem>
                      <SelectItem value="30">Net 30</SelectItem>
                      <SelectItem value="60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Order Summary</h3>
                <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(form.watch("subtotal") || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Discount</span>
                    <div className="flex space-x-2">
                      <Select
                        value={form.watch("discountType")}
                        onValueChange={(value: any) => form.setValue("discountType", value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="amount">{financialPrefs.baseCurrency || 'USD'}</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.watch("discountType") !== "none" && (
                        <Input
                          type="number"
                          min="0"
                          className="w-20"
                          {...form.register("discountValue", { valueAsNumber: true })}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Tax Rate (%)</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="w-20"
                      {...form.register("taxRate", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="flex justify-between">
                    <span>Tax Amount</span>
                    <span>{formatCurrency(form.watch("taxAmount") || 0)}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(form.watch("grandTotal") || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Quotation Selector Dialog */}
      <Dialog open={showQuotationSelector} onOpenChange={setShowQuotationSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select from Quotations</DialogTitle>
            <DialogDescription>
              Choose a quotation to import its data into this invoice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {quotations.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Quotations Found</h3>
                <p className="text-muted-foreground">
                  There are no quotations available to import.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quotations.map((quotation: any) => (
                  <Card
                    key={quotation.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleQuotationSelection(quotation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium">{quotation.quotationNumber}</h3>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{quotation.customerName || "No Customer"}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(quotation.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Selector Dialog */}
      <Dialog open={showOrderSelector} onOpenChange={setShowOrderSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select from Order History</DialogTitle>
            <DialogDescription>
              Choose an order to import its data into this invoice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
                <p className="text-muted-foreground">
                  There are no orders available to import.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order: any) => (
                  <Card
                    key={order.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOrderSelection(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium">{order.orderNumber}</h3>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>{order.customerName || "No Customer"}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invoice Created</DialogTitle>
            <DialogDescription>
              Your invoice has been created successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => window.location.href = "/invoices"}>
              View All Invoices
            </Button>
            <Button
              onClick={() => {
                setShowInvoicePreview(false);
                form.reset(getDefaultFormValues(financialPrefs));
              }}
            >
              Create Another Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}