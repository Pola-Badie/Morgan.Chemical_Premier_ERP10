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
import { PlusCircle, Calendar, Lock, Unlock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, parseISO, isAfter } from "date-fns";
import { z } from "zod";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Period form schema
const periodFormSchema = z.object({
  periodName: z.string().min(3, "Period name must be at least 3 characters"),
  startDate: z.string({
    required_error: "Start date is required",
  }),
  endDate: z.string({
    required_error: "End date is required",
  }),
  status: z.enum(["open", "closed"], {
    required_error: "Status is required",
  }).default("open"),
})
.refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return isAfter(end, start);
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

type PeriodFormValues = z.infer<typeof periodFormSchema>;

// Interface for accounting period
interface AccountingPeriod {
  id: number;
  periodName: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed';
  createdAt: string;
}

const AccountingPeriods: React.FC = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ action: 'open' | 'close', periodId: number } | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Fetch accounting periods
  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['/api/accounting-periods'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Setup form with validation
  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodFormSchema),
    defaultValues: {
      periodName: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: "open",
    }
  });

  // Create period mutation
  const createPeriodMutation = useMutation({
    mutationFn: async (data: PeriodFormValues) => {
      const res = await apiRequest('POST', '/api/accounting/periods', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/periods'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Period created",
        description: "The accounting period has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create period",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update period status mutation
  const updatePeriodStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'open' | 'closed' }) => {
      const res = await apiRequest('PATCH', `/api/accounting/periods/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/periods'] });
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
      toast({
        title: "Period updated",
        description: "The accounting period has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update period",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle opening/closing a period
  const handleStatusChange = (periodId: number, action: 'open' | 'close') => {
    setConfirmAction({ action, periodId });
    setIsConfirmDialogOpen(true);
  };

  // Confirm status change
  const confirmStatusChange = () => {
    if (confirmAction) {
      updatePeriodStatusMutation.mutate({
        id: confirmAction.periodId,
        status: confirmAction.action === 'open' ? 'open' : 'closed'
      });
    }
  };

  // Get current period
  const getCurrentPeriod = () => {
    const now = new Date();
    return periods.find((period: AccountingPeriod) => {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      return startDate <= now && now <= endDate;
    });
  };

  const currentPeriod = getCurrentPeriod();
  
  // Check if there are warnings to display
  const hasNoOpenPeriods = periods.length > 0 && !periods.some((p: AccountingPeriod) => p.status === 'open');
  const hasOverlappingPeriods = periods.some((period1: AccountingPeriod, i: number) => {
    const start1 = new Date(period1.startDate);
    const end1 = new Date(period1.endDate);
    return periods.some((period2: AccountingPeriod, j: number) => {
      if (i === j) return false;
      const start2 = new Date(period2.startDate);
      const end2 = new Date(period2.endDate);
      return (
        (start1 <= end2 && start2 <= end1)
      );
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Accounting Periods</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Period
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Accounting Period</DialogTitle>
              <DialogDescription>
                Define a new accounting period for financial reporting.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createPeriodMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="periodName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Q1 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    disabled={createPeriodMutation.isPending}
                  >
                    {createPeriodMutation.isPending ? "Creating..." : "Create Period"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warning alerts */}
      {hasNoOpenPeriods && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            There are no open accounting periods. Transactions may not be recorded properly.
          </AlertDescription>
        </Alert>
      )}
      
      {hasOverlappingPeriods && (
        <Alert className="mb-4 border-yellow-500 text-yellow-600 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            There are overlapping accounting periods. This may cause reporting inconsistencies.
          </AlertDescription>
        </Alert>
      )}

      {/* Current period card */}
      {currentPeriod && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-lg font-medium">Current Period: {currentPeriod.periodName}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(currentPeriod.startDate), 'MMM dd, yyyy')} - {format(new Date(currentPeriod.endDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <Badge variant={currentPeriod.status === 'open' ? 'outline' : 'secondary'}>
                {currentPeriod.status === 'open' ? (
                  <><Unlock className="h-3 w-3 mr-1" /> Open</>
                ) : (
                  <><Lock className="h-3 w-3 mr-1" /> Closed</>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : periods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No accounting periods found. Create one to get started.</TableCell>
              </TableRow>
            ) : (
              periods.map((period: AccountingPeriod) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">{period.periodName}</TableCell>
                  <TableCell>{format(new Date(period.startDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(period.endDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={period.status === 'open' ? 'outline' : 'secondary'}>
                      {period.status === 'open' ? (
                        <><Unlock className="h-3 w-3 mr-1" /> Open</>
                      ) : (
                        <><Lock className="h-3 w-3 mr-1" /> Closed</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {period.status === 'open' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(period.id, 'close')}
                      >
                        <Lock className="h-3 w-3 mr-1" /> Close Period
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(period.id, 'open')}
                      >
                        <Unlock className="h-3 w-3 mr-1" /> Reopen Period
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === 'close' ? 'Close Accounting Period' : 'Reopen Accounting Period'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === 'close' 
                ? 'Closing this period will prevent further transactions from being posted to it. This action can be reversed if needed.'
                : 'Reopening this period will allow transactions to be posted to it again.'}
            </DialogDescription>
          </DialogHeader>
          
          {confirmAction?.action === 'close' && (
            <Alert className="mt-2 border-yellow-500 text-yellow-600 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Make sure all transactions for this period have been recorded before closing.
              </AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant={confirmAction?.action === 'close' ? 'destructive' : 'default'}
              onClick={confirmStatusChange}
              disabled={updatePeriodStatusMutation.isPending}
            >
              {updatePeriodStatusMutation.isPending 
                ? "Processing..." 
                : confirmAction?.action === 'close' 
                  ? "Close Period" 
                  : "Reopen Period"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingPeriods;