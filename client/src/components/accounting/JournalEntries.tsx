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
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Plus, Trash2, FileText, Check, X, DollarSign } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { z } from "zod";
import { JournalEntry, Account } from "@shared/schema";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Journal entry form schema
const journalLineSchema = z.object({
  accountId: z.number({
    required_error: "Please select an account",
  }),
  description: z.string().optional(),
  debit: z.string().optional().default("0"),
  credit: z.string().optional().default("0"),
});

const journalEntrySchema = z.object({
  date: z.string({
    required_error: "Date is required",
  }),
  reference: z.string().optional(),
  description: z.string().min(3, {
    message: "Description must be at least 3 characters.",
  }),
  lines: z.array(journalLineSchema)
    .min(2, {
      message: "Journal entry must have at least 2 lines",
    })
    .refine(
      (lines) => {
        // Calculate total debits and total credits
        const totalDebits = lines.reduce(
          (sum, line) => sum + parseFloat(line.debit || "0"), 
          0
        );
        const totalCredits = lines.reduce(
          (sum, line) => sum + parseFloat(line.credit || "0"), 
          0
        );
        
        // Check if they are equal (balanced)
        return Math.abs(totalDebits - totalCredits) < 0.01;
      },
      {
        message: "Journal entry must be balanced (total debits = total credits)",
      }
    ),
});

interface JournalEntryDetailsDialogProps {
  entry: any;
  onClose: () => void;
}

const JournalEntryDetailsDialog: React.FC<JournalEntryDetailsDialogProps> = ({ entry, onClose }) => {
  return (
    <Dialog open={!!entry} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Journal Entry Details - #{entry?.id}</DialogTitle>
          <DialogDescription>
            View detailed information about this journal entry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <p className="text-sm text-muted-foreground">
                {entry && format(parseISO(entry.date), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Reference</label>
              <p className="text-sm text-muted-foreground">{entry?.reference || '-'}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <p className="text-sm text-muted-foreground">{entry?.description}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Journal Lines</label>
            <div className="border rounded-md mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Sample Account</TableCell>
                    <TableCell>Sample line item</TableCell>
                    <TableCell className="text-right">${entry?.totalDebit}</TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Sample Account 2</TableCell>
                    <TableCell>Sample line item 2</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">${entry?.totalCredit}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const JournalEntries = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '2025-04-30',
    endDate: '2025-05-24'
  });

  // Fetch journal entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["/api/journal-entries", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const response = await fetch(`/api/journal-entries?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      return response.json();
    },
  });

  // Fetch accounts for the form
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch('/api/accounts');
      return response.json();
    },
  });

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc: any, account: any) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {});

  const form = useForm({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: 0, description: '', debit: '', credit: '' },
        { accountId: 0, description: '', debit: '', credit: '' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines"
  });

  const createJournalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/journal-entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      setIsAddDialogOpen(false);
      form.reset();
    },
  });

  const watchedLines = form.watch("lines");
  
  // Calculate totals and check if balanced
  const totals = React.useMemo(() => {
    const totalDebits = watchedLines.reduce(
      (sum, line) => sum + parseFloat(line.debit || "0"), 
      0
    );
    const totalCredits = watchedLines.reduce(
      (sum, line) => sum + parseFloat(line.credit || "0"), 
      0
    );
    const difference = Math.abs(totalDebits - totalCredits);
    const isBalanced = difference < 0.01;
    
    return {
      totalDebits,
      totalCredits,
      difference,
      isBalanced
    };
  }, [watchedLines]);

  const viewEntryDetails = (entryId: number) => {
    const entry = entries.find((e: any) => e.id === entryId);
    setSelectedEntry(entry);
  };

  const handleDateRangeChange = (field: string, value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6 h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Journal Entries</h3>
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Journal Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
                <DialogDescription>
                  Create a new journal entry to record financial transactions.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createJournalMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="INV-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Description of the journal entry" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Journal Lines</h4>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => append({ accountId: 0, description: '', debit: '', credit: '' })}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Line
                      </Button>
                    </div>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.accountId`}
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <Select
                                        onValueChange={(value) => field.onChange(parseInt(value))}
                                        defaultValue={field.value ? field.value.toString() : undefined}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select account" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-[200px]">
                                          {Object.entries(groupedAccounts).map(([type, accs]: [string, any]) => (
                                            <React.Fragment key={type}>
                                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                                {type}
                                              </div>
                                              {accs.map((account: any) => (
                                                <SelectItem 
                                                  key={account.id} 
                                                  value={account.id.toString()}
                                                >
                                                  {account.code} - {account.name}
                                                </SelectItem>
                                              ))}
                                              <Separator className="my-1" />
                                            </React.Fragment>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <Input placeholder="Description" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.debit`}
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <div className="relative">
                                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input 
                                            placeholder="0.00" 
                                            className="pl-8 text-right" 
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...field}
                                            onChange={(e) => {
                                              field.onChange(e);
                                              if (e.target.value) {
                                                form.setValue(`lines.${index}.credit`, '');
                                              }
                                            }}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`lines.${index}.credit`}
                                  render={({ field }) => (
                                    <FormItem className="m-0">
                                      <FormControl>
                                        <div className="relative">
                                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                          <Input 
                                            placeholder="0.00" 
                                            className="pl-8 text-right" 
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...field}
                                            onChange={(e) => {
                                              field.onChange(e);
                                              if (e.target.value) {
                                                form.setValue(`lines.${index}.debit`, '');
                                              }
                                            }}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                {fields.length > 2 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={2} className="font-medium">Total</TableCell>
                            <TableCell className="text-right font-medium">${totals.totalDebits.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">${totals.totalCredits.toFixed(2)}</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex justify-end mt-2">
                      {totals.isBalanced ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Balanced
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                          <X className="h-3.5 w-3.5 mr-1" />
                          Difference: ${totals.difference.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createJournalMutation.isPending || !totals.isBalanced}
                    >
                      {createJournalMutation.isPending ? "Creating..." : "Create Entry"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-md">Filter</CardTitle>
          <CardDescription>Filter journal entries by date range</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex space-x-4">
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-muted/30 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
          <div className="h-10 w-10 text-muted-foreground mb-2">
            <FileText className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium">No journal entries found</h3>
          <p className="text-muted-foreground">Create a new journal entry to record financial transactions</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit Total</TableHead>
                <TableHead className="text-right">Credit Total</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.id}</TableCell>
                  <TableCell>{format(parseISO(entry.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{entry.reference || '-'}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-right">${parseFloat(entry.totalDebit).toFixed(2)}</TableCell>
                  <TableCell className="text-right">${parseFloat(entry.totalCredit).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => viewEntryDetails(entry.id)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedEntry && (
        <JournalEntryDetailsDialog 
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
};

export default JournalEntries;