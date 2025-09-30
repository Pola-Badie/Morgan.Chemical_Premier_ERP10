import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Material {
  id: number;
  name: string;
  quantity: number;
  unitPrice: string;
  unitOfMeasure?: string;
}

interface MaterialsSelectionProps {
  value: Material[];
  onChange: (materials: Material[]) => void;
}

const MaterialsSelection: React.FC<MaterialsSelectionProps> = ({ value, onChange }) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string | number>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<string>('0.00');
  
  // Fetch raw materials
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['/api/products/raw-materials'],
    queryFn: async () => {
      const response = await fetch('/api/products/raw-materials');
      if (!response.ok) {
        throw new Error('Failed to fetch raw materials');
      }
      return response.json();
    }
  });
  
  const handleAddMaterial = () => {
    if (!selectedMaterial) {
      toast({
        title: 'Missing Material',
        description: 'Please select a material',
        variant: 'destructive',
      });
      return;
    }
    
    if (quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Quantity must be greater than 0',
        variant: 'destructive',
      });
      return;
    }
    
    if (parseFloat(unitPrice) <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Unit price must be greater than 0',
        variant: 'destructive',
      });
      return;
    }
    
    // Find the selected material from the materials list
    const selectedMaterialObj = materials?.find((m: any) => m.id === Number(selectedMaterial));
    if (!selectedMaterialObj) {
      toast({
        title: 'Invalid Material',
        description: 'Selected material not found',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if material already exists in the list
    const existingIndex = value.findIndex(m => m.id === Number(selectedMaterial));
    if (existingIndex >= 0) {
      // Update existing material
      const updatedMaterials = [...value];
      updatedMaterials[existingIndex] = {
        ...updatedMaterials[existingIndex],
        quantity: updatedMaterials[existingIndex].quantity + quantity,
      };
      onChange(updatedMaterials);
    } else {
      // Add new material
      const newMaterial: Material = {
        id: Number(selectedMaterial),
        name: selectedMaterialObj.name,
        quantity,
        unitPrice,
        unitOfMeasure: selectedMaterialObj.unitOfMeasure || 'pcs',
      };
      onChange([...value, newMaterial]);
    }
    
    // Reset form
    setSelectedMaterial('');
    setQuantity(1);
    setUnitPrice('0.00');
    setIsDialogOpen(false);
  };
  
  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = [...value];
    updatedMaterials.splice(index, 1);
    onChange(updatedMaterials);
  };
  
  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updatedMaterials = [...value];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      quantity: newQuantity,
    };
    onChange(updatedMaterials);
  };
  
  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Materials</Label>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Material</DialogTitle>
              <DialogDescription>
                Select a raw material to add to the production order.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Select
                  value={selectedMaterial.toString()}
                  onValueChange={setSelectedMaterial}
                >
                  <SelectTrigger id="material">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingMaterials ? (
                      <SelectItem value="loading" disabled>
                        Loading materials...
                      </SelectItem>
                    ) : (
                      materials?.map((material: any) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMaterial}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {value.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {value.map((material, index) => (
                <TableRow key={`${material.id}-${index}`}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        value={material.quantity}
                        onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-xs text-muted-foreground">
                        {material.unitOfMeasure}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>${formatPrice(material.unitPrice)}</TableCell>
                  <TableCell>
                    ${formatPrice((Number(material.quantity) * parseFloat(material.unitPrice)).toString())}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMaterial(index)}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Remove</span>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex items-center justify-center border rounded-md p-4">
          <p className="text-muted-foreground">No materials added yet. Click "Add Material" to add some.</p>
        </div>
      )}
    </div>
  );
};

export default MaterialsSelection;