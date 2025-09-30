import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  UsersIcon,
  PackageIcon,
  DollarSignIcon,
  ShieldIcon,
  MessageSquareIcon,
  CloudIcon,
  FileTextIcon,
  SettingsIcon,
  ReceiptIcon,
  FileDownIcon,
  Building2Icon,
  TagIcon
} from 'lucide-react';

// Import tab components
import CompanyInfoTab from '@/components/system-preferences/CompanyInfoTab';
import UserManagementTab from '@/components/system-preferences/UserManagementTab-new';
import InventorySettingsTab from '@/components/system-preferences/InventorySettingsTab';
import FinancialConfigurationTab from '@/components/system-preferences/FinancialConfigurationTab';
import SecuritySettingsTab from '@/components/system-preferences/SecuritySettingsTab';
import CommunicationSettingsTab from '@/components/system-preferences/CommunicationSettingsTab';
import BackupTab from '@/components/system-preferences/BackupTab';
import ETAIntegrationTab from '@/components/system-preferences/ETAIntegrationTab';
import QuotationPreviewSettingsTab from '@/components/system-preferences/QuotationPreviewSettingsTab';
import InvoicePreviewSettingsTab from '@/components/system-preferences/InvoicePreviewSettingsTab';
import ModuleConfigurationTab from '@/components/system-preferences/ModuleConfigurationTab';
import OrderStatusTab from '@/components/system-preferences/OrderStatusTab';

const SystemPreferences: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('company');

  // Fetch system preferences
  const { data: preferences, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/system-preferences'],
    refetchOnWindowFocus: false,
  });

  const renderTabIcon = (tabValue: string) => {
    const activeClass = activeTab === tabValue ? 'text-primary' : 'text-muted-foreground';
    
    switch (tabValue) {
      case 'company':
        return <Building2Icon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'users':
        return <UsersIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'inventory':
        return <PackageIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'financial':
        return <DollarSignIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'security':
        return <ShieldIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'communication':
        return <MessageSquareIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'backup':
        return <CloudIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'eta':
        return <FileTextIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'quotation-preview':
        return <FileDownIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'invoice-preview':
        return <ReceiptIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'modules':
        return <SettingsIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      case 'order-status':
        return <TagIcon className={`h-5 w-5 mr-2 ${activeClass}`} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Failed to load system preferences. Please try again or contact support.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('systemPreferencesTitle')}</h1>
        <p className="text-muted-foreground">
          {t('systemPreferencesDescription') || 'Configure system-wide settings and preferences for your Premier ERP'}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs 
            defaultValue="users" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 border-b rounded-none h-auto gap-1">
              <TabsTrigger 
                value="company" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('company')}
                <span className="hidden sm:inline ml-1 truncate">Company</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('users')}
                <span className="hidden sm:inline ml-1 truncate">Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="inventory" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('inventory')}
                <span className="hidden sm:inline ml-1 truncate">Inventory</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financial" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('financial')}
                <span className="hidden sm:inline ml-1 truncate">Financial</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('security')}
                <span className="hidden sm:inline ml-1 truncate">Security</span>
              </TabsTrigger>
              <TabsTrigger 
                value="communication" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('communication')}
                <span className="hidden lg:inline ml-1 truncate">Comm</span>
              </TabsTrigger>
              <TabsTrigger 
                value="backup" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('backup')}
                <span className="hidden lg:inline ml-1 truncate">Backup</span>
              </TabsTrigger>
              <TabsTrigger 
                value="eta" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('eta')}
                <span className="hidden lg:inline ml-1 truncate">ETA</span>
              </TabsTrigger>
              <TabsTrigger 
                value="quotation-preview" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('quotation-preview')}
                <span className="hidden lg:inline ml-1 truncate">Quote</span>
              </TabsTrigger>
              <TabsTrigger 
                value="invoice-preview" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('invoice-preview')}
                <span className="hidden lg:inline ml-1 truncate">Invoice</span>
              </TabsTrigger>
              <TabsTrigger 
                value="modules" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('modules')}
                <span className="hidden lg:inline ml-1 truncate">Modules</span>
              </TabsTrigger>
              <TabsTrigger 
                value="order-status" 
                className="flex items-center justify-center py-3 px-1 text-xs lg:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none min-w-0"
              >
                {renderTabIcon('order-status')}
                <span className="hidden lg:inline ml-1 truncate">Status</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="company" className="mt-0">
                <CompanyInfoTab preferences={preferences as any[] || []} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="users" className="mt-0">
                <UserManagementTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="inventory" className="mt-0">
                <InventorySettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="financial" className="mt-0">
                <FinancialConfigurationTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="security" className="mt-0">
                <SecuritySettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="communication" className="mt-0">
                <CommunicationSettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="backup" className="mt-0">
                <BackupTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="eta" className="mt-0">
                <ETAIntegrationTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="quotation-preview" className="mt-0">
                <QuotationPreviewSettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="invoice-preview" className="mt-0">
                <InvoicePreviewSettingsTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="modules" className="mt-0">
                <ModuleConfigurationTab preferences={preferences} refetch={refetch} />
              </TabsContent>
              
              <TabsContent value="order-status" className="mt-0">
                <OrderStatusTab preferences={preferences} refetch={refetch} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPreferences;