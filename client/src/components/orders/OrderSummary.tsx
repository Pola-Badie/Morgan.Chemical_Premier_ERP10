import React from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';

interface OrderSummaryProps {
  materialCost: string;
  feesTotal: string;
  totalCost: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  materialCost,
  feesTotal,
  totalCost
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>
          Review the total cost of this order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Materials Cost:</span>
            <span>${materialCost}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">Additional Fees:</span>
            <span>${feesTotal}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="font-bold text-lg">Total Order Cost:</span>
            <span className="font-bold text-lg">${totalCost}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;