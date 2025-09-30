import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  SettingsIcon, 
  ShoppingCartIcon, 
  UsersIcon, 
  PackageIcon, 
  DollarSignIcon, 
  FileTextIcon,
  BarChart3Icon,
  TruckIcon,
  ShieldCheckIcon,
  BellIcon,
  CalendarIcon,
  TagIcon,
  CreditCardIcon,
  UserCheckIcon,
  DatabaseIcon,
  GlobeIcon,
  ChevronDownIcon
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ModuleConfigurationTabProps {
  preferences: any;
  refetch: () => void;
}

const ModuleConfigurationTab: React.FC<ModuleConfigurationTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  
  const [moduleSettings, setModuleSettings] = useState({
    dashboard: { enabled: true, visible: true, permissions: ['view', 'edit'] },
    products: { enabled: true, visible: true, permissions: ['view', 'create', 'edit', 'delete'] },
    customers: { enabled: true, visible: true, permissions: ['view', 'create', 'edit'] },
    suppliers: { enabled: true, visible: true, permissions: ['view', 'create', 'edit'] },
    sales: { enabled: true, visible: true, permissions: ['view', 'create', 'edit'] },
    purchases: { enabled: true, visible: true, permissions: ['view', 'create', 'edit'] },
    inventory: { enabled: true, visible: true, permissions: ['view', 'edit'] },
    accounting: { enabled: true, visible: true, permissions: ['view', 'create', 'edit'] },
    reports: { enabled: true, visible: true, permissions: ['view', 'export'] },
    userManagement: { enabled: true, visible: true, permissions: ['view', 'create', 'edit', 'delete'] },
    systemPreferences: { enabled: true, visible: true, permissions: ['view', 'edit'] },
    notifications: { enabled: true, visible: true, permissions: ['view', 'manage'] },
    backup: { enabled: true, visible: true, permissions: ['view', 'manage'] },
    security: { enabled: true, visible: true, permissions: ['view', 'manage'] },
    integration: { enabled: false, visible: false, permissions: ['view', 'manage'] },
    analytics: { enabled: false, visible: false, permissions: ['view'] },
    workflow: { enabled: false, visible: false, permissions: ['view', 'manage'] }
  });

  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const modules = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Main overview and analytics dashboard',
      icon: BarChart3Icon,
      category: 'Core',
      features: ['Overview Cards', 'Charts & Graphs', 'Quick Actions', 'Recent Activity']
    },
    {
      id: 'products',
      name: 'Product Management',
      description: 'Manage products, categories, and inventory',
      icon: PackageIcon,
      category: 'Core',
      features: ['Product Catalog', 'Categories', 'Stock Management', 'Pricing', 'Images']
    },
    {
      id: 'customers',
      name: 'Customer Management',
      description: 'Manage customer information and relationships',
      icon: UsersIcon,
      category: 'Core',
      features: ['Customer Database', 'Contact Management', 'Credit Limits', 'Order History']
    },
    {
      id: 'suppliers',
      name: 'Supplier Management',
      description: 'Manage supplier information and relationships',
      icon: TruckIcon,
      category: 'Core',
      features: ['Supplier Database', 'Contact Management', 'Purchase History', 'Performance Tracking']
    },
    {
      id: 'sales',
      name: 'Sales Management',
      description: 'Handle sales orders, invoices, and quotations',
      icon: ShoppingCartIcon,
      category: 'Sales',
      features: ['Order Processing', 'Invoice Generation', 'Quotations', 'Payment Tracking']
    },
    {
      id: 'purchases',
      name: 'Purchase Management',
      description: 'Manage purchase orders and vendor relationships',
      icon: CreditCardIcon,
      category: 'Purchasing',
      features: ['Purchase Orders', 'Vendor Management', 'Receiving', 'Cost Tracking']
    },
    {
      id: 'inventory',
      name: 'Inventory Control',
      description: 'Track stock levels and warehouse management',
      icon: DatabaseIcon,
      category: 'Operations',
      features: ['Stock Tracking', 'Warehouse Management', 'Stock Alerts', 'Transfers']
    },
    {
      id: 'accounting',
      name: 'Financial Management',
      description: 'Complete accounting and financial reporting',
      icon: DollarSignIcon,
      category: 'Finance',
      features: ['General Ledger', 'Accounts Payable/Receivable', 'Financial Reports', 'Tax Management']
    },
    {
      id: 'reports',
      name: 'Reporting & Analytics',
      description: 'Generate comprehensive business reports',
      icon: FileTextIcon,
      category: 'Analytics',
      features: ['Standard Reports', 'Custom Reports', 'Data Export', 'Scheduled Reports']
    },
    {
      id: 'userManagement',
      name: 'User Management',
      description: 'Manage system users and permissions',
      icon: UserCheckIcon,
      category: 'Administration',
      features: ['User Accounts', 'Role Management', 'Permission Control', 'Access Logs']
    },
    {
      id: 'systemPreferences',
      name: 'System Configuration',
      description: 'Configure system settings and preferences',
      icon: SettingsIcon,
      category: 'Administration',
      features: ['General Settings', 'Security Settings', 'Integration Settings', 'Backup Configuration']
    },
    {
      id: 'notifications',
      name: 'Notification System',
      description: 'Manage system notifications and alerts',
      icon: BellIcon,
      category: 'Communication',
      features: ['Email Notifications', 'SMS Alerts', 'System Messages', 'Notification Templates']
    },
    {
      id: 'backup',
      name: 'Backup & Recovery',
      description: 'Data backup and disaster recovery',
      icon: ShieldCheckIcon,
      category: 'Security',
      features: ['Automated Backups', 'Data Recovery', 'Cloud Storage', 'Backup Scheduling']
    },
    {
      id: 'security',
      name: 'Security Management',
      description: 'System security and access control',
      icon: ShieldCheckIcon,
      category: 'Security',
      features: ['Access Control', 'Audit Logs', 'Security Policies', 'Two-Factor Authentication']
    },
    {
      id: 'integration',
      name: 'Third-party Integration',
      description: 'Connect with external systems and APIs',
      icon: GlobeIcon,
      category: 'Integration',
      features: ['API Management', 'Webhook Support', 'Data Synchronization', 'External Connectors']
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      description: 'Business intelligence and advanced reporting',
      icon: BarChart3Icon,
      category: 'Analytics',
      features: ['Business Intelligence', 'Predictive Analytics', 'Data Visualization', 'KPI Dashboards']
    },
    {
      id: 'workflow',
      name: 'Workflow Automation',
      description: 'Automate business processes and workflows',
      icon: CalendarIcon,
      category: 'Automation',
      features: ['Process Automation', 'Workflow Designer', 'Task Management', 'Approval Workflows']
    }
  ];

  useEffect(() => {
    if (preferences) {
      const modulePrefs = preferences.filter((pref: any) => pref.category === 'modules');
      if (modulePrefs.length) {
        const newModuleSettings = { ...moduleSettings };
        modulePrefs.forEach((pref: any) => {
          const moduleId = pref.key.replace('module_', '').replace('_enabled', '').replace('_visible', '').replace('_permissions', '');
          if (!newModuleSettings[moduleId]) {
            newModuleSettings[moduleId] = { enabled: true, visible: true, permissions: [] };
          }
          
          if (pref.key.includes('_enabled')) {
            newModuleSettings[moduleId].enabled = pref.value;
          } else if (pref.key.includes('_visible')) {
            newModuleSettings[moduleId].visible = pref.value;
          } else if (pref.key.includes('_permissions')) {
            newModuleSettings[moduleId].permissions = pref.value || [];
          }
        });
        setModuleSettings(newModuleSettings);
      }
    }
  }, [preferences]);

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      return apiRequest('PATCH', `/api/system-preferences/${key}`, { value });
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update module setting.',
        variant: 'destructive',
      });
    },
  });

  const createPreferenceMutation = useMutation({
    mutationFn: async (preference: any) => {
      return apiRequest('POST', `/api/system-preferences`, preference);
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create module setting.',
        variant: 'destructive',
      });
    },
  });

  const handleModuleToggle = (moduleId: string, setting: 'enabled' | 'visible', value: boolean) => {
    setModuleSettings(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [setting]: value
      }
    }));

    const fullKey = `module_${moduleId}_${setting}`;
    const existingPref = preferences?.find((pref: any) => pref.key === fullKey);

    if (existingPref) {
      updatePreferenceMutation.mutate({ key: fullKey, value });
    } else {
      createPreferenceMutation.mutate({
        key: fullKey,
        value,
        category: 'modules',
        label: `${moduleId} ${setting}`,
        description: `Module ${setting} setting for ${moduleId}`,
        dataType: 'boolean',
      });
    }
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const categories = [...new Set(modules.map(m => m.category))];

  const getModuleStats = () => {
    const enabled = Object.values(moduleSettings).filter(m => m.enabled).length;
    const visible = Object.values(moduleSettings).filter(m => m.visible).length;
    const total = modules.length;
    
    return { enabled, visible, total };
  };

  const stats = getModuleStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Module Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure which modules are enabled and visible in your system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Config
          </Button>
          <Button variant="outline" size="sm">
            Import Config
          </Button>
        </div>
      </div>

      {/* Module Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
          <div className="text-sm text-blue-600">Total Modules</div>
        </div>
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{stats.enabled}</div>
          <div className="text-sm text-green-600">Enabled</div>
        </div>
        <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">{stats.visible}</div>
          <div className="text-sm text-purple-600">Visible</div>
        </div>
      </div>

      {/* Module Categories */}
      {categories.map(category => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              {category} Modules
            </CardTitle>
            <CardDescription>
              Configure {category.toLowerCase()} related modules and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modules
                .filter(module => module.category === category)
                .map(module => {
                  const IconComponent = module.icon;
                  const isExpanded = expandedModules.includes(module.id);
                  const settings = moduleSettings[module.id] || { enabled: false, visible: false, permissions: [] };
                  
                  return (
                    <div key={module.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{module.name}</h4>
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`${module.id}-visible`} className="text-sm">Visible</Label>
                            <Switch
                              id={`${module.id}-visible`}
                              checked={settings.visible}
                              onCheckedChange={(checked) => handleModuleToggle(module.id, 'visible', checked)}
                              disabled={!settings.enabled}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`${module.id}-enabled`} className="text-sm">Enabled</Label>
                            <Switch
                              id={`${module.id}-enabled`}
                              checked={settings.enabled}
                              onCheckedChange={(checked) => handleModuleToggle(module.id, 'enabled', checked)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleModuleExpansion(module.id)}
                          >
                            <ChevronDownIcon 
                              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                          </Button>
                        </div>
                      </div>
                      
                      <Collapsible open={isExpanded}>
                        <CollapsibleContent className="mt-4">
                          <div className="pl-9 space-y-3">
                            <div>
                              <h5 className="font-medium text-sm mb-2">Features</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {module.features.map(feature => (
                                  <div key={feature} className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    {feature}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-sm mb-2">Access Control</h5>
                              <p className="text-xs text-muted-foreground">
                                Module permissions are managed through the User Management section.
                                Current permissions: {settings.permissions.join(', ') || 'None'}
                              </p>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ModuleConfigurationTab;