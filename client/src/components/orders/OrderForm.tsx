import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface OrderFormProps {
  orderType: 'production' | 'refining';
  onOrderCreated: () => void;
}

export function OrderForm({ orderType, onOrderCreated }: OrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate order creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: `${orderType} order created successfully`,
      });
      
      onOrderCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create {orderType === 'production' ? 'Production' : 'Refining'} Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advanced">Advanced Pharmaceuticals Ltd</SelectItem>
                  <SelectItem value="biotech">BioTech Innovations</SelectItem>
                  <SelectItem value="purechem">PureChem Industries</SelectItem>
                  <SelectItem value="chemlab">ChemLab Solutions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="product">Final Product</Label>
              <Input id="product" placeholder="Enter final product name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="batch">Batch Number</Label>
              <Input id="batch" placeholder="Auto-generated" disabled />
            </div>
            
            <div>
              <Label htmlFor="cost">Estimated Cost</Label>
              <Input id="cost" type="number" placeholder="0.00" />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : `Create ${orderType} Order`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}