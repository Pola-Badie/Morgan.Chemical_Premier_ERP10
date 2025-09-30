import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import CustomerSearch from './CustomerSearch';
import BatchNumberField from './BatchNumberField';
import MaterialsSelection from './MaterialsSelection';

interface Material {
  id: number;
  name: string;
  quantity: number;
  unitPrice: string;
  unitOfMeasure?: string;
}

interface ProductionOrderFieldsProps {
  batchNumber: string;
  onBatchNumberChange: (value: string) => void;
  selectedCustomer: any;
  onCustomerSelect: (customer: any) => void;
  selectedMaterials: Material[];
  onMaterialsChange: (materials: Material[]) => void;
  productDescription: string;
  onProductDescriptionChange: (value: string) => void;
  totalPrice: string;
}

const ProductionOrderFields: React.FC<ProductionOrderFieldsProps> = ({
  batchNumber,
  onBatchNumberChange,
  selectedCustomer,
  onCustomerSelect,
  selectedMaterials,
  onMaterialsChange,
  productDescription,
  onProductDescriptionChange,
  totalPrice
}) => {
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
          orderType="production"
        />
      </div>
      
      <MaterialsSelection 
        value={selectedMaterials}
        onChange={onMaterialsChange}
      />
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Target Product Description</label>
        <Textarea
          placeholder="Describe the product to be produced..."
          value={productDescription}
          onChange={(e) => onProductDescriptionChange(e.target.value)}
          className="min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground">
          Include details about the final product specifications, concentrations, and intended use.
        </p>
      </div>
      
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Materials Cost</p>
              <p className="text-2xl font-bold">${totalPrice}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Number of Materials</p>
              <p className="text-xl font-semibold">{selectedMaterials.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionOrderFields;