import React from 'react';
import { Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderCard } from './OrderCard';

interface OrdersListProps {
  orders: any[];
  isLoading: boolean;
  title: string;
  onViewDetails: (order: any) => void;
  onCreateInvoice: (order: any) => void;
  onDelete: (orderId: number) => void;
  onExport: () => void;
}

export function OrdersList({ 
  orders, 
  isLoading, 
  title, 
  onViewDetails, 
  onCreateInvoice, 
  onDelete, 
  onExport 
}: OrdersListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button 
          onClick={onExport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileDown className="w-4 h-4" />
          Export
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={onViewDetails}
              onCreateInvoice={onCreateInvoice}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}