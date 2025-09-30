import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Trash, PlusCircle } from 'lucide-react';

interface AdditionalFeesSectionProps {
  additionalFees: any[];
  setAdditionalFees: React.Dispatch<React.SetStateAction<any[]>>;
}

const AdditionalFeesSection: React.FC<AdditionalFeesSectionProps> = ({
  additionalFees,
  setAdditionalFees
}) => {
  const [feeLabel, setFeeLabel] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<string>('');
  const { toast } = useToast();

  // Add fee to order
  const handleAddFee = () => {
    if (!feeLabel || !feeAmount) {
      toast({
        title: 'Incomplete fee',
        description: 'Please enter both a label and amount for the fee',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(feeAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a positive number for the fee amount',
        variant: 'destructive',
      });
      return;
    }

    const newFee = {
      label: feeLabel,
      amount: amount.toFixed(2),
    };

    setAdditionalFees([...additionalFees, newFee]);
    setFeeLabel('');
    setFeeAmount('');
  };

  // Remove fee from order
  const handleRemoveFee = (index: number) => {
    const updatedFees = [...additionalFees];
    updatedFees.splice(index, 1);
    setAdditionalFees(updatedFees);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Fees</CardTitle>
        <CardDescription>
          Add any additional processing fees, labor costs, or other charges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="feeLabel">Fee Description</Label>
            <Input
              id="feeLabel"
              placeholder="e.g., Labor, Energy, Packaging"
              value={feeLabel}
              onChange={(e) => setFeeLabel(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="feeAmount">Amount</Label>
            <Input
              id="feeAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddFee} className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Fee
            </Button>
          </div>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {additionalFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    No additional fees added
                  </TableCell>
                </TableRow>
              ) : (
                additionalFees.map((fee, index) => (
                  <TableRow key={index}>
                    <TableCell>{fee.label}</TableCell>
                    <TableCell>${fee.amount}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFee(index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdditionalFeesSection;