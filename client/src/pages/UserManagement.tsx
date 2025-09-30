import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPermissions } from '@/contexts/UserPermissionsContext';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, UserPlus, Shield, ShieldCheck, ShieldX, Users, Settings, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define available modules
const AVAILABLE_MODULES = [
  { key: 'dashboard', name: 'Dashboard', icon: '📊' },
  { key: 'inventory', name: 'Inventory Management', icon: '📦' },
  { key: 'expenses', name: 'Expense Tracking', icon: '💰' },
  { key: 'accounting', name: 'Accounting', icon: '🏦' },
  { key: 'createInvoice', name: 'Create Invoice', icon: '📝' },
  { key: 'invoiceHistory', name: 'Invoice History', icon: '📋' },
  { key: 'createQuotation', name: 'Create Quotation', icon: '📄' },
  { key: 'quotationHistory', name: 'Quotation History', icon: '📑' },
  { key: 'suppliers', name: 'Supplier Management', icon: '🚚' },
  { key: 'procurement', name: 'Procurement', icon: '🛒' },
  { key: 'customers', name: 'Customer Management', icon: '👥' },
  { key: 'orderManagement', name: 'Order Management', icon: '🏭' },
  { key: 'ordersHistory', name: 'Orders History', icon: '📜' },
  { key: 'reports', name: 'Reports & Analytics', icon: '📈' },
  { key: 'userManagement', name: 'User Management', icon: '👤' },
  { key: 'systemPreferences', name: 'System Preferences', icon: '⚙️' },
  { key: 'label', name: 'Label Generator', icon: '🏷️' },
  { key: 'backup', name: 'Backup & Restore', icon: '💾' },
  { key: 'settings', name: 'Settings', icon: '🔧' },
  { key: 'notifications', name: 'Notifications', icon: '🔔' },
  { key: 'payroll', name: 'Payroll', icon: '💼' },
];

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'staff', 'accountant', 'inventory_manager', 'sales_rep']),
  status: z.enum(['active', 'inactive', 'suspended']),
});

type UserFormData = z.infer<typeof userSchema>;

const UserManagement: React.FC = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { refreshPermissions } = useUserPermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'staff',
      status: 'active',
    },
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return await response.json();
    },
  });

  // Fetch user permissions using REAL permission API
  const { data: userPermissions = [], refetch: refetchPermissions } = useQuery({
    queryKey: ['/api/permissions/users', selectedUser?.id, 'complete'],
    queryFn: async () => {
      const data = await apiRequest('GET', `/api/permissions/users/${selectedUser.id}/complete`);
      
      if (data.success) {
        console.log('🔐 REAL user permissions data:', data.data);
        // Return the comprehensive permission data including explicit, role-based, and effective
        return data.data;
      } else {
        console.error('Permission API error:', data.error);
        return { explicit: [], roleBased: [], effective: [] };
      }
    },
    enabled: !!selectedUser?.id,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: UserFormData) => apiRequest('POST', '/api/users', userData),
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('userCreatedSuccessfully'),
      });
      setShowCreateDialog(false);
      form.reset();
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToCreateUser'),
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => apiRequest('DELETE', `/api/users/${userId}`),
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('userDeletedSuccessfully'),
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToDeleteUser'),
        variant: 'destructive',
      });
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: string }) =>
      apiRequest('PATCH', `/api/users/${userId}/status`, { status }),
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('userStatusUpdatedSuccessfully'),
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToUpdateUserStatus'),
        variant: 'destructive',
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiRequest('PATCH', `/api/users/${userId}/role`, { role }),
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('userRoleUpdatedSuccessfully'),
      });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToUpdateUserRole'),
        variant: 'destructive',
      });
    },
  });

  // Update user permission mutation
  // Update permission using REAL permission API
  const updatePermissionMutation = useMutation({
    mutationFn: ({ userId, moduleName, accessGranted }: { userId: number; moduleName: string; accessGranted: boolean }) =>
      apiRequest('POST', `/api/permissions/users/${userId}/modules/${moduleName}`, { accessGranted }),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: t('success'),
          description: data.message || t('permissionUpdatedSuccessfully'),
        });
        refetchPermissions();
        refreshPermissions();
      } else {
        throw new Error(data.error);
      }
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToUpdatePermission'),
        variant: 'destructive',
      });
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: (permissionId: number) => apiRequest('DELETE', `/api/permissions/${permissionId}`),
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('permissionRemovedSuccessfully'),
      });
      refetchPermissions();
      refreshPermissions();
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToRemovePermission'),
        variant: 'destructive',
      });
    },
  });

  const handleCreateUser = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleDeleteUser = (userId: number) => {
    if (userId === currentUser?.id) {
      toast({
        title: t('error'),
        description: t('cannotDeleteYourself'),
        variant: 'destructive',
      });
      return;
    }
    deleteUserMutation.mutate(userId);
  };

  const handleStatusChange = (userId: number, status: string) => {
    updateUserStatusMutation.mutate({ userId, status });
  };

  const handleRoleChange = (userId: number, role: string) => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  const handlePermissionToggle = (moduleName: string, accessGranted: boolean) => {
    if (!selectedUser) return;
    updatePermissionMutation.mutate({
      userId: selectedUser.id,
      moduleName,
      accessGranted,
    });
  };

  const handleGrantAllPermissions = () => {
    if (!selectedUser) return;
    AVAILABLE_MODULES.forEach(module => {
      updatePermissionMutation.mutate({
        userId: selectedUser.id,
        moduleName: module.key,
        accessGranted: true,
      });
    });
  };

  const handleRevokeAllPermissions = () => {
    if (!selectedUser) return;
    AVAILABLE_MODULES.forEach(module => {
      updatePermissionMutation.mutate({
        userId: selectedUser.id,
        moduleName: module.key,
        accessGranted: false,
      });
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'accountant': return 'bg-green-100 text-green-800';
      case 'inventory_manager': return 'bg-purple-100 text-purple-800';
      case 'sales_rep': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasPermission = (moduleName: string) => {
    return userPermissions.some((p: any) => p.moduleName === moduleName && p.accessGranted);
  };

  const getPermissionCount = (userId: number) => {
    const userPerms = userPermissions.filter((p: any) => p.userId === userId && p.accessGranted);
    return userPerms.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('userManagement')}</h1>
          <p className="text-gray-600 mt-2">{t('manageSystemUsers')}</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              {t('createUser')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('createNewUser')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <div>
                <Label htmlFor="username">{t('username')}</Label>
                <Input
                  id="username"
                  {...form.register('username')}
                  placeholder={t('enterUsername')}
                />
                {form.formState.errors.username && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name">{t('fullName')}</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder={t('enterFullName')}
                />
                {form.formState.errors.name && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder={t('enterEmail')}
                />
                {form.formState.errors.email && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                  placeholder={t('enterPassword')}
                />
                {form.formState.errors.password && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role">{t('role')}</Label>
                <Select onValueChange={(value) => form.setValue('role', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('admin')}</SelectItem>
                    <SelectItem value="manager">{t('manager')}</SelectItem>
                    <SelectItem value="staff">{t('staff')}</SelectItem>
                    <SelectItem value="accountant">{t('accountant')}</SelectItem>
                    <SelectItem value="inventory_manager">{t('inventoryManager')}</SelectItem>
                    <SelectItem value="sales_rep">{t('salesRep')}</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.role.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">{t('status')}</Label>
                <Select onValueChange={(value) => form.setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive')}</SelectItem>
                    <SelectItem value="suspended">{t('suspended')}</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.status && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.status.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? t('creating') : t('create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            {t('systemUsers')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('user')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('permissions')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {t(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {t(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {user.role === 'admin' ? t('allModules') : `${getPermissionCount(user.id)} ${t('modules')}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPermissionsDialog(true);
                          }}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          {t('permissions')}
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {t('delete')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              {t('managePermissions')} - {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Permission Controls */}
              <div className="flex space-x-4 p-4 bg-gray-50 rounded-lg">
                <Button
                  variant="outline"
                  onClick={handleGrantAllPermissions}
                  disabled={updatePermissionMutation.isPending}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {t('grantAllPermissions')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRevokeAllPermissions}
                  disabled={updatePermissionMutation.isPending}
                >
                  <ShieldX className="w-4 h-4 mr-2" />
                  {t('revokeAllPermissions')}
                </Button>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_MODULES.map(module => (
                  <Card key={module.key} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{module.icon}</span>
                        <div>
                          <h4 className="font-medium">{module.name}</h4>
                          <p className="text-sm text-gray-500">{t(module.key)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedUser.role === 'admin' || hasPermission(module.key)}
                          disabled={selectedUser.role === 'admin' || updatePermissionMutation.isPending}
                          onCheckedChange={(checked) => handlePermissionToggle(module.key, checked)}
                        />
                        {selectedUser.role === 'admin' ? (
                          <Badge className="bg-green-100 text-green-800">
                            {t('adminAccess')}
                          </Badge>
                        ) : hasPermission(module.key) ? (
                          <Badge className="bg-green-100 text-green-800">
                            {t('granted')}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            {t('denied')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;