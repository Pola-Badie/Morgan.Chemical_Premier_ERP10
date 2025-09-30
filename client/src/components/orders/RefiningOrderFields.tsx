import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { useQuery } from '@tanstack/react-query';
import CustomerSearch from './CustomerSearch';
import BatchNumberField from './BatchNumberField';

interface RefiningOrderFieldsProps {
  batchNumber: string;
  onBatchNumberChange: (value: string) => void;
  selectedCustomer: any;
  onCustomerSelect: (customer: any) => void;
  sourceType: string;
  onSourceTypeChange: (value: string) => void;
  selectedProductionOrder: string;
  onProductionOrderSelect: (value: string) => void;
  selectedStockItem: string;
  onStockItemSelect: (value: string) => void;
  refiningSteps: string[];
  onRefiningStepsChange: (steps: string[]) => void;
  expectedOutput: string;
  onExpectedOutputChange: (value: string) => void;
  costAdjustments: string;
  onCostAdjustmentsChange: (value: string) => void;
}

const RefiningOrderFields: React.FC<RefiningOrderFieldsProps> = ({
  batchNumber,
  onBatchNumberChange,
  selectedCustomer,
  onCustomerSelect,
  sourceType,
  onSourceTypeChange,
  selectedProductionOrder,
  onProductionOrderSelect,
  selectedStockItem,
  onStockItemSelect,
  refiningSteps,
  onRefiningStepsChange,
  expectedOutput,
  onExpectedOutputChange,
  costAdjustments,
  onCostAdjustmentsChange,
}) => {
  const [newStep, setNewStep] = useState('');
  
  // Fetch production orders for source selection
  const { data: productionOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch production orders');
      }
      
      const orders = await response.json();
      return orders.filter((order: any) => order.orderType === 'production');
    }
  });
  
  // Fetch semi-finished products for source selection
  const { data: semiFinishedProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['/api/products/semi-finished'],
    queryFn: async () => {
      const response = await fetch('/api/products/semi-finished');
      if (!response.ok) {
        throw new Error('Failed to fetch semi-finished products');
      }
      return response.json();
    }
  });
  
  const handleAddStep = () => {
    if (newStep.trim() === '') return;
    
    onRefiningStepsChange([...refiningSteps, newStep.trim()]);
    setNewStep('');
  };
  
  const handleRemoveStep = (index: number) => {
    const updatedSteps = [...refiningSteps];
    updatedSteps.splice(index, 1);
    onRefiningStepsChange(updatedSteps);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CustomerSearch
          value={selectedCustomer}
          onChange={onCustomerSelect}
        />
        
        <BatchNumberField
          value={batchNumber}
          onChange={onBatchNumberChange}
          orderType="refining"
        />
      </div>
      
      <div className="space-y-4">
        <Label>Source Material</Label>
        <RadioGroup value={sourceType} onValueChange={onSourceTypeChange} className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="production" id="production" />
            <Label htmlFor="production">From Production Order</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="stock" id="stock" />
            <Label htmlFor="stock">From Stock Item</Label>
          </div>
        </RadioGroup>
        
        {sourceType === 'production' ? (
          <div className="space-y-2">
            <Label htmlFor="productionOrder">Select Production Order</Label>
            <Select
              value={selectedProductionOrder}
              onValueChange={onProductionOrderSelect}
            >
              <SelectTrigger id="productionOrder">
                <SelectValue placeholder="Select production order" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingOrders ? (
                  <SelectItem value="loading" disabled>
                    Loading orders...
                  </SelectItem>
                ) : (
                  productionOrders?.map((order: any) => (
                    <SelectItem key={order.id} value={order.id.toString()}>
                      {order.batchNumber || order.orderNumber} - {order.finalProduct || "Unknown product"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="stockItem">Select Stock Item</Label>
            <Select
              value={selectedStockItem}
              onValueChange={onStockItemSelect}
            >
              <SelectTrigger id="stockItem">
                <SelectValue placeholder="Select stock item" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProducts ? (
                  <SelectItem value="loading" disabled>
                    Loading stock items...
                  </SelectItem>
                ) : (
                  semiFinishedProducts?.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - {product.batchNumber || "No batch"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Refining Steps</Label>
        <div className="flex space-x-2">
          <Input
            placeholder="Enter a refining step..."
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            className="flex-1"
          />
          <Button type="button" onClick={handleAddStep}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        
        <div className="border rounded-lg mt-2">
          {refiningSteps.length > 0 ? (
            <ul className="divide-y">
              {refiningSteps.map((step, index) => (
                <li key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center">
                    <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm mr-3">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStep(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No refining steps added yet. Add steps above.
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Expected Output</Label>
        <Textarea
          placeholder="Describe the expected output of the refining process..."
          value={expectedOutput}
          onChange={(e) => onExpectedOutputChange(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Additional Cost Adjustments</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={costAdjustments}
            onChange={(e) => onCostAdjustmentsChange(e.target.value)}
            className="pl-7"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter any additional costs associated with the refining process.
        </p>
      </div>
      
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold">${parseFloat(costAdjustments || '0').toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Refining Steps</p>
              <p className="text-xl font-semibold">{refiningSteps.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefiningOrderFields;