import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BatchNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  orderType: 'production' | 'refining';
  label?: string;
}

const BatchNumberField: React.FC<BatchNumberFieldProps> = ({
  value,
  onChange,
  orderType,
  label = 'Batch Number',
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);
  
  // Generate a new batch number when the component mounts or order type changes
  useEffect(() => {
    if (!value && !isManualEdit) {
      generateBatchNumber();
    }
  }, [orderType]);
  
  const generateBatchNumber = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/orders/latest-batch', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get latest batch number');
      }
      
      const data = await response.json();
      
      // Extract the current batch number format
      // Expected format: PREFIX-YYYYMMDD-XXXX where XXXX is a sequential number
      const latestBatch = data.latestBatch || '';
      const prefix = orderType === 'production' ? 'PRO' : 'REF';
      
      // Get current date in YYYYMMDD format
      const now = new Date();
      const dateStr = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0');
      
      // Extract the sequence number from the latest batch
      let sequenceNum = 1;
      if (latestBatch) {
        const parts = latestBatch.split('-');
        if (parts.length >= 3) {
          const lastDate = parts[1];
          const lastSeq = parseInt(parts[2], 10);
          
          // If the date is the same, increment the sequence
          if (lastDate === dateStr) {
            sequenceNum = lastSeq + 1;
          }
        }
      }
      
      // Format the new batch number
      const newBatchNumber = `${prefix}-${dateStr}-${sequenceNum.toString().padStart(4, '0')}`;
      
      onChange(newBatchNumber);
    } catch (error) {
      console.error('Error generating batch number:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate batch number. Please try again or enter manually.',
        variant: 'destructive',
      });
      
      // Fallback to a generic batch number
      const now = new Date();
      const dateStr = now.getFullYear().toString() + 
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0');
      const prefix = orderType === 'production' ? 'PRO' : 'REF';
      const fallbackBatch = `${prefix}-${dateStr}-0001`;
      
      onChange(fallbackBatch);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualEdit(true);
    onChange(e.target.value);
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
      </label>
      <div className="flex">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder="Batch number"
          className="rounded-r-none"
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-l-none"
          onClick={generateBatchNumber}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Auto-generated based on date and sequence. Click refresh to generate a new one or edit manually.
      </p>
    </div>
  );
};

export default BatchNumberField;