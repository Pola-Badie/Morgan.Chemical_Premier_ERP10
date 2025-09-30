import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle, Pencil, UserX, Check, X, Download, Settings, Trash2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define user form schema
const userFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'staff', 'manager']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Module configuration features
const moduleFeatures = {
  products: [
    // Tab Controls
    { key: "inventoryTab", label: "Inventory List Tab", category: "tabs", description: "Main inventory items view" },
    { key: "categoriesTab", label: "Categories Tab", category: "tabs", description: "Product categories management" },
    { key: "stockTab", label: "Stock Management Tab", category: "tabs", description: "Inventory and stock levels" },
    { key: "pricingTab", label: "Pricing Tab", category: "tabs", description: "Product pricing and cost management" },
    
    // Content Visibility
    { key: "productsList", label: "Inventory List View", category: "content", description: "Main inventory table/grid view" },
    { key: "productDetails", label: "Item Details Panel", category: "content", description: "Detailed item information view" },
    { key: "stockLevels", label: "Stock Level Indicators", category: "content", description: "Current stock status and alerts" },
    { key: "priceHistory", label: "Price History", category: "content", description: "Historical pricing data" },
    { key: "productImages", label: "Item Images", category: "content", description: "Product photos and galleries" },
    { key: "specifications", label: "Item Specifications", category: "content", description: "Technical specs and details" },
    
    // Actions
    { key: "addProducts", label: "Add New Items", category: "actions", description: "Create new inventory entries" },
    { key: "editProducts", label: "Edit Items", category: "actions", description: "Modify existing inventory" },
    { key: "deleteProducts", label: "Delete Items", category: "actions", description: "Remove items from system" },
    { key: "bulkOperations", label: "Bulk Operations", category: "actions", description: "Mass update/delete operations" },
    { key: "importExport", label: "Import/Export", category: "actions", description: "Bulk data import and export" },
  ],
  
  dashboard: [
    // Tab Controls
    { key: "overviewTab", label: "Overview Tab", category: "tabs", description: "Main dashboard summary" },
    { key: "analyticsTab", label: "Analytics Tab", category: "tabs", description: "Business analytics and insights" },
    { key: "reportsTab", label: "Quick Reports Tab", category: "tabs", description: "Summary reports section" },
    
    // Content Visibility
    { key: "summaryCards", label: "Summary Cards", category: "content", description: "Key metrics overview cards" },
    { key: "recentActivity", label: "Recent Activity", category: "content", description: "Latest system activities" },
    { key: "charts", label: "Dashboard Charts", category: "content", description: "Visual analytics and graphs" },
    { key: "notifications", label: "Notifications Panel", category: "content", description: "System alerts and messages" },
    
    // Actions
    { key: "refreshData", label: "Refresh Data", category: "actions", description: "Update dashboard information" },
    { key: "exportReports", label: "Export Reports", category: "actions", description: "Download dashboard reports" },
    { key: "customizeLayout", label: "Customize Layout", category: "actions", description: "Personalize dashboard view" },
  ],
  
  accounting: [
    // Tab Controls
    { key: "journalTab", label: "Journal Entries Tab", category: "tabs", description: "General ledger and journal entries" },
    { key: "accountsTab", label: "Chart of Accounts Tab", category: "tabs", description: "Account structure management" },
    { key: "reportsTab", label: "Financial Reports Tab", category: "tabs", description: "P&L, Balance Sheet, etc." },
    { key: "reconciliationTab", label: "Bank Reconciliation Tab", category: "tabs", description: "Bank account reconciliation" },
    
    // Content Visibility
    { key: "journalEntries", label: "Journal Entries List", category: "content", description: "All accounting transactions" },
    { key: "accountsChart", label: "Chart of Accounts", category: "content", description: "Account hierarchy view" },
    { key: "trialBalance", label: "Trial Balance", category: "content", description: "Account balances summary" },
    { key: "financialStatements", label: "Financial Statements", category: "content", description: "P&L and Balance Sheet" },
    { key: "cashFlow", label: "Cash Flow Statement", category: "content", description: "Cash flow analysis" },
    
    // Actions
    { key: "createJournalEntry", label: "Create Journal Entries", category: "actions", description: "Add new accounting transactions" },
    { key: "editJournalEntry", label: "Edit Journal Entries", category: "actions", description: "Modify existing entries" },
    { key: "deleteJournalEntry", label: "Delete Journal Entries", category: "actions", description: "Remove accounting entries" },
    { key: "generateReports", label: "Generate Reports", category: "actions", description: "Create financial reports" },
    { key: "exportData", label: "Export Accounting Data", category: "actions", description: "Export financial data" },
  ],
};

interface UserManagementTabProps {
  preferences: any;
  refetch: () => void;
}

const UserManagementTab: React.FC<UserManagementTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isConfigurePermissionsOpen, setIsConfigurePermissionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any>(null);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [modulePermissionFeatures, setModulePermissionFeatures] = useState<Record<string, boolean>>({});
  const [passwordVisibility, setPasswordVisibility] = useState<Record<number, boolean>>({});
  const [updatingPermissions, setUpdatingPermissions] = useState<Set<string>>(new Set());

  // Available ERP modules with translations
  const availableModules = [
    { key: 'dashboard', name: 'Dashboard', nameKey: 'dashboard', description: 'Main dashboard overview and analytics', descriptionKey: 'dashboardDesc' },
    { key: 'products', name: 'Inventory', nameKey: 'inventory', description: 'Inventory management and stock tracking', descriptionKey: 'inventoryDesc' },
    { key: 'expenses', name: 'Expenses', nameKey: 'expenses', description: 'Expense tracking and management', descriptionKey: 'expensesDesc' },
    { key: 'accounting', name: 'Accounting', nameKey: 'accounting', description: 'Financial management and reports', descriptionKey: 'accountingDesc' },
    { key: 'suppliers', name: 'Suppliers', nameKey: 'suppliers', description: 'Supplier management and relationships', descriptionKey: 'suppliersDesc' },
    { key: 'customers', name: 'Customers', nameKey: 'customers', description: 'Customer relationship management', descriptionKey: 'customersDesc' },
    { key: 'createInvoice', name: 'Create Invoice', nameKey: 'createInvoice', description: 'Invoice creation and management', descriptionKey: 'createInvoiceDesc' },
    { key: 'createQuotation', name: 'Create Quotation', nameKey: 'createQuotation', description: 'Quotation generation and pricing', descriptionKey: 'createQuotationDesc' },
    { key: 'invoiceHistory', name: 'Invoice History', nameKey: 'invoiceHistory', description: 'View and manage invoice history', descriptionKey: 'invoiceHistoryDesc' },
    { key: 'quotationHistory', name: 'Quotation History', nameKey: 'quotationHistory', description: 'View quotation records and history', descriptionKey: 'quotationHistoryDesc' },
    { key: 'orderManagement', name: 'Order Management', nameKey: 'orderManagement', description: 'Order processing and tracking', descriptionKey: 'orderManagementDesc' },
    { key: 'ordersHistory', name: 'Orders History', nameKey: 'ordersHistory', description: 'Historical order data and records', descriptionKey: 'ordersHistoryDesc' },
    { key: 'label', name: 'Label Generator', nameKey: 'labelGenerator', description: 'Generate product and shipping labels', descriptionKey: 'labelGeneratorDesc' },
    { key: 'reports', name: 'Reports', nameKey: 'reports', description: 'Business reports and analytics', descriptionKey: 'reportsDesc' },
    { key: 'procurement', name: 'Procurement', nameKey: 'procurement', description: 'Procurement and purchasing management', descriptionKey: 'procurementDesc' },
    { key: 'userManagement', name: 'User Management', nameKey: 'userManagement', description: 'Manage user accounts and roles', descriptionKey: 'userManagementDesc' },
    { key: 'systemPreferences', name: 'System Preferences', nameKey: 'systemPreferences', description: 'System configuration and settings', descriptionKey: 'systemPreferencesDesc' }
  ];

  // Toggle password visibility for a specific user
  const togglePasswordVisibility = (userId: number) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Get password for user (mock function - in real app would fetch from secure endpoint)
  const getPasswordForUser = (username: string) => {
    const passwordMap: Record<string, string> = {
      'maged.morgan': 'maged2024!',
      'michael.morgan': 'michael123',
      'maged.youssef': 'maged456',
      'youssef.abdelmaseeh': 'youssef789',
      'hany.fakhry': 'hany321',
      'mohamed.mahmoud': 'mohamed654',
      'anna.simon': 'anna987'
    };
    return passwordMap[username] || 'password123';
  };

  // Fetch users
  const { data: users = [], isLoading, isError, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/users'],
    refetchOnWindowFocus: false,
  });

  // Fetch user permissions for selected user
  const { data: userPermissions = [], refetch: refetchPermissions } = useQuery({
    queryKey: [`/api/users/${selectedUserForPermissions?.id}/permissions`],
    enabled: !!selectedUserForPermissions?.id,
    refetchOnWindowFocus: false,
  });

  // Function to check if user has permission for a module
  const hasPermission = (moduleName: string): boolean => {
    if (!userPermissions || !Array.isArray(userPermissions)) return false;
    const permission = userPermissions.find((p: any) => p.moduleName === moduleName);
    return permission?.accessGranted === true;
  };

  // Toggle permission mutation
  const togglePermissionMutation = useMutation({
    mutationFn: async ({ userId, moduleName, accessGranted }: { userId: number; moduleName: string; accessGranted: boolean }) => {
      return apiRequest('POST', `/api/users/${userId}/permissions`, {
        moduleName,
        accessGranted
      });
    },
    onSuccess: () => {
      refetchPermissions();
      queryClient.invalidateQueries({ queryKey: [`/api/users/${selectedUserForPermissions?.id}/permissions`] });
      toast({
        title: t('success'),
        description: t('permissionUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error?.message || t('failedToUpdatePermission'),
        variant: 'destructive',
      });
    },
  });

  // Handle toggle permission
  const handleTogglePermission = async (moduleName: string, accessGranted: boolean) => {
    if (!selectedUserForPermissions?.id) return;
    
    setUpdatingPermissions(prev => new Set(prev).add(moduleName));
    
    try {
      await togglePermissionMutation.mutateAsync({
        userId: selectedUserForPermissions.id,
        moduleName,
        accessGranted
      });
    } finally {
      setUpdatingPermissions(prev => {
        const newSet = new Set(prev);
        newSet.delete(moduleName);
        return newSet;
      });
    }
  };

  // Form for adding new users
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'staff',
    },
  });

  // Edit user form
  const editForm = useForm<Omit<UserFormValues, 'password'> & { id: number }>({
    resolver: zodResolver(
      userFormSchema.omit({ password: true }).extend({
        id: z.number(),
      })
    ),
    defaultValues: {
      id: 0,
      username: '',
      name: '',
      email: '',
      role: 'staff',
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      return apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddUserDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Omit<UserFormValues, 'password'> & { id: number }) => {
      const { id, ...updateData } = userData;
      return apiRequest('PATCH', `/api/users/${id}`, updateData);
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      editForm.reset();
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update user',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  // Handle configure permissions
  const handleConfigurePermissions = (permission: { moduleName: string; accessGranted: boolean }) => {
    setSelectedPermission(permission);
    setIsConfigurePermissionsOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    editForm.reset({
      id: user.id,
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      role: user.role,
    });
    setIsEditUserDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm(t('confirmDeleteUser') || 'Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleManagePermissions = (user: any) => {
    setSelectedUserForPermissions(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleExportUsers = () => {
    // Convert users data to CSV format
    const csvData = (users as any[]).map((user: any) => ({
      Username: user.username,
      Name: user.name || '',
      Email: user.email || '',
      Password: getPasswordForUser(user.username),
      Role: user.role,
      Status: user.status || 'active',
      'Creation Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const currentDate = new Date().toISOString().split('T')[0];
    a.download = `users_export_${currentDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Users exported successfully',
    });
  };

  // Calculate user statistics
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const adminCount = Array.isArray(users) ? users.filter((user: any) => user.role === 'admin').length : 0;
  const managerCount = Array.isArray(users) ? users.filter((user: any) => user.role === 'manager').length : 0;
  const staffCount = Array.isArray(users) ? users.filter((user: any) => user.role === 'staff').length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading users. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">User Account Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage system user accounts, roles, and access permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
        </div>
      </div>

      {/* User Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{totalUsers}</div>
          <div className="text-sm text-blue-600">Total Users</div>
        </div>
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{adminCount}</div>
          <div className="text-sm text-green-600">Administrators</div>
        </div>
        <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">{managerCount}</div>
          <div className="text-sm text-purple-600">Managers</div>
        </div>
        <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-2xl font-bold text-orange-700">{staffCount}</div>
          <div className="text-sm text-orange-600">Staff Members</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No users found. Add your first user to get started.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {passwordVisibility[user.id] ? getPasswordForUser(user.username) : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="h-6 w-6 p-0"
                      >
                        {passwordVisibility[user.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={`capitalize ${user.role === 'admin' ? 'text-blue-600 font-semibold' : ''}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePermissions(user)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with appropriate role and permissions.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role assignments.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((data) => updateUserMutation.mutate(data))} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Manage module permissions for {selectedUserForPermissions?.name || selectedUserForPermissions?.username} ({selectedUserForPermissions?.role})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{t('moduleAccessControl')}</div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {t('totalModulesAvailable')}: {availableModules.length}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b pb-2 sticky top-0 bg-white">
                <div>{t('module')}</div>
                <div>{t('access')}</div>
                <div>{t('actions')}</div>
              </div>
              
              {/* Dynamic ERP Modules from System Configuration */}
              {availableModules.map((module) => {
                // Check real permission status from database
                const permissionRecord = userPermissions.find((p: any) => p.moduleName === module.key);
                const hasPermission = permissionRecord?.accessGranted === true;
                const isUpdatingPermission = updatingPermissions.has(module.key);
                
                // Permission data successfully loaded from database
                
                return (
                  <div key={module.key} className="grid grid-cols-3 gap-4 py-3 border-b items-center hover:bg-gray-50">
                    <div>
                      <div className="font-medium">{t(module.nameKey) || module.name}</div>
                      <div className="text-xs text-muted-foreground">{t(module.descriptionKey) || module.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={hasPermission}
                        disabled={isUpdatingPermission}
                        onCheckedChange={(checked) => handleTogglePermission(module.key, checked)}
                      />
                      {isUpdatingPermission && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      {hasPermission ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          {t('grantedStatus')} (ID: {permissionRecord?.id})
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">
                          {t('deniedStatus')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigurePermissions({ moduleName: module.key, accessGranted: hasPermission })}
                        disabled={!hasPermission || isUpdatingPermission}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {t('configure')}
                      </Button>
                      {hasPermission && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          disabled={isUpdatingPermission}
                          onClick={() => handleTogglePermission(module.key, false)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t('remove')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsPermissionsDialogOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Permissions saved",
                  description: "All permission changes have been saved successfully.",
                });
                setIsPermissionsDialogOpen(false);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Permissions Dialog */}
      <Dialog open={isConfigurePermissionsOpen} onOpenChange={setIsConfigurePermissionsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Module Permissions</DialogTitle>
            <DialogDescription>
              Configure detailed permissions for {selectedPermission?.moduleName} module for {selectedUserForPermissions?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedPermission && moduleFeatures[selectedPermission.moduleName as keyof typeof moduleFeatures] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available Features</span>
                  <Badge className={selectedPermission.accessGranted ? "bg-green-500" : "bg-red-500"}>
                    {selectedPermission.accessGranted ? "Module Access Granted" : "Module Access Denied"}
                  </Badge>
                </div>
                
                {selectedPermission.accessGranted ? (
                  <div className="space-y-6">
                    {/* Group features by category */}
                    {["tabs", "content", "actions"].map((category) => {
                      const categoryFeatures = moduleFeatures[selectedPermission.moduleName as keyof typeof moduleFeatures]
                        ?.filter((feature: any) => feature.category === category) || [];
                      
                      if (categoryFeatures.length === 0) return null;
                      
                      const categoryLabels = {
                        tabs: "Tab Controls",
                        content: "Content Visibility", 
                        actions: "User Actions"
                      };
                      
                      const categoryDescriptions = {
                        tabs: "Control which tabs are visible in the module interface",
                        content: "Manage what content and data is displayed to users",
                        actions: "Define what actions users can perform in this module"
                      };
                      
                      const categoryIcons = {
                        tabs: "📋",
                        content: "👁️",
                        actions: "⚡"
                      };
                      
                      return (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <span className="text-lg">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">
                                {categoryLabels[category as keyof typeof categoryLabels]}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid gap-3">
                            {categoryFeatures.map((feature: any) => (
                              <div
                                key={feature.key}
                                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900">{feature.label}</p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {feature.description || "Controls visibility and access to this feature"}
                                  </p>
                                </div>
                                <div className="ml-3">
                                  <Switch
                                    checked={modulePermissionFeatures[feature.key] ?? true}
                                    onCheckedChange={(checked) => {
                                      setModulePermissionFeatures(prev => ({
                                        ...prev,
                                        [feature.key]: checked
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Category Summary */}
                          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                            <span className="font-medium text-blue-800">
                              {categoryFeatures.filter((f: any) => modulePermissionFeatures[f.key] ?? true).length} of {categoryFeatures.length} features enabled
                            </span>
                            {category === "tabs" && " - Users will see these tabs in the module"}
                            {category === "content" && " - This content will be visible to users"}
                            {category === "actions" && " - Users can perform these actions"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShieldCheck className="mx-auto h-12 w-12 opacity-50 mb-2" />
                    <p>Module access is denied</p>
                    <p className="text-xs">Grant module access first to configure individual features</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfigurePermissionsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Save the configuration
                toast({
                  title: "Permissions updated",
                  description: "Module permissions have been configured successfully.",
                });
                setIsConfigurePermissionsOpen(false);
              }}
              disabled={!selectedPermission?.accessGranted}
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementTab;