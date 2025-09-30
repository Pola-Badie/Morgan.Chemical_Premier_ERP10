import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface CustomerDetailsProps {
  customer: any;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer }) => {
  if (!customer) return null;

  return (
    <Card className="mt-4 border border-blue-100">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{customer.name}</h3>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{customer.sector || 'N/A'}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div>
              <span className="font-medium text-gray-600">Company:</span> {customer.company || 'N/A'}
            </div>
            <div>
              <span className="font-medium text-gray-600">Phone:</span> {customer.phone || 'N/A'}
            </div>
            <div>
              <span className="font-medium text-gray-600">Email:</span> {customer.email || 'N/A'}
            </div>
            <div>
              <span className="font-medium text-gray-600">Address:</span> {customer.address || 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerDetails;