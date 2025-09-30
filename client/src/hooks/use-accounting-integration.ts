import { useQuery } from '@tanstack/react-query';

// Unified Accounting Dashboard Hook
export function useUnifiedAccountingDashboard() {
  return useQuery({
    queryKey: ['/api/accounting/unified-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/accounting/unified-dashboard');
      if (!res.ok) throw new Error('Failed to fetch unified dashboard data');
      return res.json();
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });
}

// Expenses from Accounting Module
export function useAccountingExpenses() {
  return useQuery({
    queryKey: ['/api/accounting/expenses'],
    queryFn: async () => {
      const res = await fetch('/api/accounting/expenses');
      if (!res.ok) throw new Error('Failed to fetch expenses');
      return res.json();
    }
  });
}

// Pending Purchases from Procurement
export function usePendingPurchases() {
  return useQuery({
    queryKey: ['/api/accounting/pending-purchases'],
    queryFn: async () => {
      const res = await fetch('/api/accounting/pending-purchases');
      if (!res.ok) throw new Error('Failed to fetch pending purchases');
      return res.json();
    }
  });
}

// Approved Purchases from Procurement
export function useApprovedPurchases() {
  return useQuery({
    queryKey: ['/api/accounting/purchases'],
    queryFn: async () => {
      const res = await fetch('/api/accounting/purchases');
      if (!res.ok) throw new Error('Failed to fetch approved purchases');
      return res.json();
    }
  });
}

// Outstanding Invoices
export function useOutstandingInvoices() {
  return useQuery({
    queryKey: ['/api/accounting/invoices-due'],
    queryFn: async () => {
      const res = await fetch('/api/accounting/invoices-due');
      if (!res.ok) throw new Error('Failed to fetch outstanding invoices');
      return res.json();
    }
  });
}

// Revenue Summary
export function useRevenueSummary(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  return useQuery({
    queryKey: ['/api/accounting/revenue', { startDate, endDate }],
    queryFn: async () => {
      const url = `/api/accounting/revenue${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch revenue summary');
      return res.json();
    }
  });
}

// Sync Status
export function useSyncStatus() {
  return useQuery({
    queryKey: ['/api/accounting/sync-status'],
    queryFn: async () => {
      const res = await fetch('/api/accounting/sync-status');
      if (!res.ok) throw new Error('Failed to fetch sync status');
      return res.json();
    },
    refetchInterval: 60000 // Check every minute
  });
}