import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

const PageNavigation: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { t, language } = useLanguage();

  // Define the page order for navigation
  const pages = [
    { path: '/', key: 'dashboard', name: 'Dashboard' },
    { path: '/products', key: 'products', name: 'Products' },
    { path: '/customers', key: 'customers', name: 'Customers' },
    { path: '/suppliers', key: 'suppliers', name: 'Suppliers' },
    { path: '/expenses', key: 'expenses', name: 'Expenses' },
    { path: '/accounting', key: 'accounting', name: 'Accounting' },
    { path: '/order-management', key: 'orderManagement', name: 'Order Management' },
    { path: '/orders-history', key: 'ordersHistory', name: 'Orders History' },
    { path: '/quotation-history', key: 'quotationHistory', name: 'Quotation History' },
    { path: '/create-invoice', key: 'createInvoice', name: 'Create Invoice' },
    { path: '/create-quotation', key: 'createQuotation', name: 'Create Quotation' },
    { path: '/invoice-history', key: 'invoiceHistory', name: 'Invoice History' },
    { path: '/user-management', key: 'userManagement', name: 'User Management' },
    { path: '/system-preferences', key: 'systemPreferences', name: 'System Preferences' },
    { path: '/procurement', key: 'procurement', name: 'Procurement' },
    { path: '/reports', key: 'reports', name: 'Reports' }
  ];

  // Find current page index
  const currentIndex = pages.findIndex(page => page.path === location);
  
  // Get previous and next pages
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  // Don't show navigation if we can't find the current page
  if (currentIndex === -1) return null;

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return null;
};

export default PageNavigation;