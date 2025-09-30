import React from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface CustomerSelectorProps {
  customers: any[];
  orders: any[];
  selectedCustomer: any;
  searchTerm: string;
  isOpen: boolean;
  onCustomerSelect: (customer: any) => void;
  onSearchChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  label?: string;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  orders,
  selectedCustomer,
  searchTerm,
  isOpen,
  onCustomerSelect,
  onSearchChange,
  onOpenChange,
  placeholder = "Select customer...",
  label = "Customer"
}) => {
  // Filter and enrich customers with order history
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    
    return customers.filter((customer: any) => {
      const term = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(term) ||
        customer.company?.toLowerCase().includes(term) ||
        customer.sector?.toLowerCase().includes(term)
      );
    }).map((customer: any) => {
      // Find recent orders for this customer
      const customerOrders = orders?.filter((order: any) => 
        order.customerName === customer.name || 
        order.customerId === customer.id
      ) || [];
      
      // Get the most recent order
      const recentOrder = customerOrders.sort((a: any, b: any) => 
        new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()
      )[0];
      
      return {
        ...customer,
        orderCount: customerOrders.length,
        lastOrderDate: recentOrder?.createdAt || recentOrder?.orderDate,
        lastOrderProduct: recentOrder?.finalProduct || recentOrder?.targetProduct,
        lastOrderValue: recentOrder?.totalCost || recentOrder?.totalAmount
      };
    });
  }, [customers, searchTerm, orders]);

  return (
    <div>
      <Label>{label}</Label>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            {selectedCustomer ? selectedCustomer.name : placeholder}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Search customers..." 
              value={searchTerm}
              onValueChange={onSearchChange}
            />
            <CommandList>
              <CommandEmpty>No customer found.</CommandEmpty>
              <CommandGroup>
                {filteredCustomers.map((customer: any) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => {
                      onCustomerSelect(customer);
                      onOpenChange(false);
                    }}
                  >
                    <div className="flex flex-col w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{customer.name}</span>
                        {customer.orderCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {customer.orderCount} orders
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {customer.company} • {customer.sector}
                      </span>
                      {customer.lastOrderProduct && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Last: {customer.lastOrderProduct} • ${customer.lastOrderValue}
                          {customer.lastOrderDate && (
                            <span className="ml-2">
                              ({format(new Date(customer.lastOrderDate), 'MMM dd')})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCustomer && (
        <div className="mt-2 p-3 bg-muted rounded-md">
          <p className="font-medium">{selectedCustomer.name}</p>
          <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
          <p className="text-sm text-muted-foreground">{selectedCustomer.sector}</p>
          {selectedCustomer.orderCount > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Previous orders: {selectedCustomer.orderCount}
              {selectedCustomer.lastOrderDate && (
                <span className="ml-2">
                  | Last order: {format(new Date(selectedCustomer.lastOrderDate), 'MMM dd, yyyy')}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;