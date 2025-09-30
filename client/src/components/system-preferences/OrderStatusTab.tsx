import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, RotateCcw, Palette, Settings as SettingsIcon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface OrderStatus {
  key: string;
  label: string;
  color: string;
  textColor: string;
  borderColor: string;
}

interface OrderStatusTabProps {
  preferences: any[];
  refetch: () => void;
}

const OrderStatusTab: React.FC<OrderStatusTabProps> = ({ preferences, refetch }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([
    {
      key: 'pending',
      label: 'Pending',
      color: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300'
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      color: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300'
    },
    {
      key: 'completed',
      label: 'Completed',
      color: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300'
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      color: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300'
    }
  ]);

  // Load existing preferences
  useEffect(() => {
    const statusPreference = preferences?.find(pref => pref.key === 'order_status_config');
    if (statusPreference?.value) {
      setOrderStatuses(statusPreference.value);
    }
  }, [preferences]);

  // Save mutation
  const saveStatusMutation = useMutation({
    mutationFn: async (statusConfig: OrderStatus[]) => {
      return await apiRequest('/api/system-preferences/order_status_config', {
        method: 'PATCH',
        body: JSON.stringify({
          value: statusConfig
        })
      });
    },
    onSuccess: () => {
      toast({
        title: 'Settings Saved',
        description: 'Order status configuration has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-preferences'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save order status configuration.',
        variant: 'destructive',
      });
    }
  });

  // Initialize system preference if it doesn't exist
  const initializeStatusMutation = useMutation({
    mutationFn: async (statusConfig: OrderStatus[]) => {
      return await apiRequest('/api/system-preferences', {
        method: 'POST',
        body: JSON.stringify({
          key: 'order_status_config',
          value: statusConfig,
          category: 'orders',
          label: 'Order Status Configuration',
          description: 'Configurable labels and colors for order statuses',
          dataType: 'json'
        })
      });
    },
    onSuccess: () => {
      toast({
        title: 'Configuration Initialized',
        description: 'Order status configuration has been set up.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/system-preferences'] });
      refetch();
    }
  });

  const handleStatusChange = (index: number, field: keyof OrderStatus, value: string) => {
    const updatedStatuses = [...orderStatuses];
    updatedStatuses[index] = { ...updatedStatuses[index], [field]: value };
    setOrderStatuses(updatedStatuses);
  };

  const handleSave = () => {
    const statusPreference = preferences?.find(pref => pref.key === 'order_status_config');
    
    if (statusPreference) {
      saveStatusMutation.mutate(orderStatuses);
    } else {
      initializeStatusMutation.mutate(orderStatuses);
    }
  };

  const handleReset = () => {
    const defaultStatuses: OrderStatus[] = [
      {
        key: 'pending',
        label: 'Pending',
        color: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300'
      },
      {
        key: 'in_progress',
        label: 'In Progress',
        color: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300'
      },
      {
        key: 'completed',
        label: 'Completed',
        color: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300'
      },
      {
        key: 'cancelled',
        label: 'Cancelled',
        color: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300'
      }
    ];
    setOrderStatuses(defaultStatuses);
  };

  const colorPresets = [
    { name: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    { name: 'Blue', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    { name: 'Green', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    { name: 'Red', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    { name: 'Purple', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    { name: 'Orange', bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    { name: 'Pink', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
    { name: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Order Status Configuration</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            disabled={saveStatusMutation.isPending || initializeStatusMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset to Default
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            disabled={saveStatusMutation.isPending || initializeStatusMutation.isPending}
          >
            <Save className="h-4 w-4 mr-1" />
            {saveStatusMutation.isPending || initializeStatusMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Status Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {orderStatuses.map((status, index) => (
            <div key={status.key} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium capitalize">{status.key.replace('_', ' ')} Status</h4>
                  <Badge className={`${status.color} ${status.textColor} ${status.borderColor} border px-2 py-1 text-xs font-medium`}>
                    {status.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`label-${status.key}`}>Display Label</Label>
                  <Input
                    id={`label-${status.key}`}
                    value={status.label}
                    onChange={(e) => handleStatusChange(index, 'label', e.target.value)}
                    placeholder="Status label"
                  />
                </div>

                <div>
                  <Label>Color Preset</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          handleStatusChange(index, 'color', preset.bg);
                          handleStatusChange(index, 'textColor', preset.text);
                          handleStatusChange(index, 'borderColor', preset.border);
                        }}
                        className={`px-3 py-1 rounded text-xs font-medium border ${preset.bg} ${preset.text} ${preset.border} hover:opacity-80 transition-opacity`}
                        title={`Apply ${preset.name} color scheme`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`bg-${status.key}`}>Background Class</Label>
                  <Input
                    id={`bg-${status.key}`}
                    value={status.color}
                    onChange={(e) => handleStatusChange(index, 'color', e.target.value)}
                    placeholder="bg-yellow-100"
                  />
                </div>
                <div>
                  <Label htmlFor={`text-${status.key}`}>Text Color Class</Label>
                  <Input
                    id={`text-${status.key}`}
                    value={status.textColor}
                    onChange={(e) => handleStatusChange(index, 'textColor', e.target.value)}
                    placeholder="text-yellow-800"
                  />
                </div>
                <div>
                  <Label htmlFor={`border-${status.key}`}>Border Class</Label>
                  <Input
                    id={`border-${status.key}`}
                    value={status.borderColor}
                    onChange={(e) => handleStatusChange(index, 'borderColor', e.target.value)}
                    placeholder="border-yellow-300"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {orderStatuses.map((status) => (
              <Badge 
                key={status.key} 
                className={`${status.color} ${status.textColor} ${status.borderColor} border px-2 py-1 text-xs font-medium`}
              >
                {status.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderStatusTab;