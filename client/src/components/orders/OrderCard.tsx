import React from 'react';
import { format } from 'date-fns';
import { Eye, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface OrderCardProps {
  order: any;
  onViewDetails: (order: any) => void;
  onCreateInvoice: (order: any) => void;
  onDelete: (orderId: number) => void;
}

export function OrderCard({ order, onViewDetails, onCreateInvoice, onDelete }: OrderCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: 'Pending' },
      in_progress: { variant: 'default', label: 'In Progress' },
      completed: { variant: 'outline', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant as any} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const getOrderTypeColor = (type: string) => {
    return type === 'production' ? 'border-l-blue-500' : 'border-l-green-500';
  };

  return (
    <Card className={`hover:shadow-md transition-shadow border-l-4 ${getOrderTypeColor(order.orderType)}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{order.customerName}</h3>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Batch: <span className="font-mono">{order.batchNumber}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">${order.totalCost}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-sm mb-1">Final Product</p>
            <p className="text-sm text-muted-foreground">{order.finalProduct}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(order)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={() => onCreateInvoice(order)}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-1" />
              Create Invoice
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(order.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}