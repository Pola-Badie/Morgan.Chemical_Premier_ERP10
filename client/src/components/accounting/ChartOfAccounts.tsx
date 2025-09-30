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
  FormDescription,
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
import { PlusCircle, Edit, ChevronRight, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { Account } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

// Define account categories and types
const accountTypes = [
  { value: "Asset", label: "Asset" },
  { value: "Liability", label: "Liability" },
  { value: "Equity", label: "Equity" },
  { value: "Income", label: "Income" },
  { value: "Expense", label: "Expense" },
];

const accountSubtypes = {
  Asset: [
    { value: "Current Asset", label: "Current Asset" },
    { value: "Fixed Asset", label: "Fixed Asset" },
    { value: "Other Asset", label: "Other Asset" },
  ],
  Liability: [
    { value: "Current Liability", label: "Current Liability" },
    { value: "Long Term Liability", label: "Long Term Liability" },
  ],
  Equity: [
    { value: "Owner's Equity", label: "Owner's Equity" },
    { value: "Retained Earnings", label: "Retained Earnings" },
  ],
  Income: [
    { value: "Operating Revenue", label: "Operating Revenue" },
    { value: "Other Revenue", label: "Other Revenue" },
  ],
  Expense: [
    { value: "Operating Expense", label: "Operating Expense" },
    { value: "Other Expense", label: "Other Expense" },
  ],
};

// Create a form schema
const accountFormSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.string().min(1, "Account type is required"),
  subtype: z.string().optional(),
  description: z.string().optional(),
  parentId: z.number().optional(),
  isActive: z.boolean().default(true),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

const ChartOfAccounts: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<number[]>([]);

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['/api/accounts'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching accounts from /api/accounts...');
        const res = await apiRequest('GET', '/api/accounts');
        console.log('✅ Accounts API response status:', res.status);
        
        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }
        
        const data = await res.json();
        console.log('📊 Accounts data received:', data);
        console.log('📈 Number of accounts:', Array.isArray(data) ? data.length : 'Not an array');
        return data;
      } catch (error) {
        console.error("❌ Error fetching accounts:", error);
        console.error("❌ Error details:", error.message || error);
        return [];
      }
    }
  });

  // Handle form submission
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "",
      subtype: "",
      description: "",
      isActive: true,
    },
  });

  // Set up the edit form
  const editForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "",
      subtype: "",
      description: "",
      isActive: true,
    },
  });

  // Handle account type change to update subtypes
  const watchType = form.watch("type");
  const watchEditType = editForm.watch("type");

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountFormValues) => {
      const res = await apiRequest('POST', '/api/accounts', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Account created",
        description: "The account has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: async (data: AccountFormValues & { id: number }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest('PATCH', `/api/accounts/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Account updated",
        description: "The account has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to toggle account expansion
  const toggleAccountExpand = (accountId: number) => {
    if (expandedAccounts.includes(accountId)) {
      setExpandedAccounts(expandedAccounts.filter(id => id !== accountId));
    } else {
      setExpandedAccounts([...expandedAccounts, accountId]);
    }
  };

  // Handle account edit
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    editForm.reset({
      code: account.code,
      name: account.name,
      type: account.type,
      subtype: account.subtype || undefined,
      description: account.description || undefined,
      parentId: account.parentId || undefined,
      isActive: account.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Find child accounts
  const findChildAccounts = (parentId: number) => {
    return accounts.filter(account => account.parentId === parentId);
  };

  // Get top-level accounts (no parentId)
  const topLevelAccounts = accounts.filter(account => !account.parentId);

  // Recursive function to render account hierarchy
  const renderAccountRows = (accountList: Account[], level = 0) => {
    return accountList.map((account) => {
      const childAccounts = findChildAccounts(account.id);
      const hasChildren = childAccounts.length > 0;
      const isExpanded = expandedAccounts.includes(account.id);

      return (
        <React.Fragment key={account.id}>
          <TableRow 
            className={level > 0 ? `pl-${level * 4}` : ''}
            style={{ backgroundColor: level % 2 === 1 ? 'rgba(0,0,0,0.02)' : 'inherit' }}
          >
            <TableCell className="font-medium">
              <div className="flex items-center">
                {hasChildren && (
                  <button 
                    className="mr-2 focus:outline-none"
                    onClick={() => toggleAccountExpand(account.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                {account.code}
              </div>
            </TableCell>
            <TableCell className="font-medium">
              <div className="flex items-center">
                <span 
                  style={{ 
                    marginLeft: hasChildren ? 0 : 24, 
                    paddingLeft: level > 0 ? `${level * 12}px` : '0'
                  }}
                >
                  {account.name}
                </span>
              </div>
            </TableCell>
            <TableCell>{account.type}</TableCell>
            <TableCell>{account.subtype || '-'}</TableCell>
            <TableCell className="text-right">${account.balance ? parseFloat(account.balance.toString()).toLocaleString() : '0.00'}</TableCell>
            <TableCell>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleEditAccount(account)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
          {hasChildren && isExpanded && renderAccountRows(childAccounts, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{t('chartOfAccounts')}</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              {t('addAccount')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Create a new account in the chart of accounts.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit((data) => createAccountMutation.mutate(data))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Cash" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                    name="subtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtype</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!watchType}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subtype" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {watchType && 
                              accountSubtypes[watchType as keyof typeof accountSubtypes]?.map((subtype) => (
                                <SelectItem key={subtype.value} value={subtype.value}>
                                  {subtype.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Account (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value !== "none" ? parseInt(value) : undefined)}
                        defaultValue={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No parent (top level)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No parent (top level)</SelectItem>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.code} - {account.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Account description" {...field} />
                      </FormControl>
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
                    disabled={createAccountMutation.isPending}
                  >
                    {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Account Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>
                Update account information.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form 
                onSubmit={editForm.handleSubmit((data) => {
                  if (selectedAccount) {
                    updateAccountMutation.mutate({ ...data, id: selectedAccount.id });
                  }
                })}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Cash" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="subtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtype</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!watchEditType}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subtype" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {watchEditType && 
                              accountSubtypes[watchEditType as keyof typeof accountSubtypes]?.map((subtype) => (
                                <SelectItem key={subtype.value} value={subtype.value}>
                                  {subtype.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Account (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value !== "none" ? parseInt(value) : undefined)}
                        defaultValue={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="No parent (top level)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No parent (top level)</SelectItem>
                          {accounts
                            .filter(account => account.id !== selectedAccount?.id)
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id.toString()}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Account description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Inactive accounts are hidden from transaction forms
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateAccountMutation.isPending}
                  >
                    {updateAccountMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-muted/30 p-8 rounded-lg border border-dashed flex flex-col items-center justify-center text-center">
          <div className="h-10 w-10 text-muted-foreground mb-2">
            <PlusCircle className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium">No accounts created yet</h3>
          <p className="text-muted-foreground">Create accounts to organize your financial transactions</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">{t('code')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('accountType')}</TableHead>
                <TableHead>{t('subtype')}</TableHead>
                <TableHead className="text-right">{t('balance')}</TableHead>
                <TableHead className="w-[60px]">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderAccountRows(topLevelAccounts)}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccounts;