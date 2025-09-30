import React, { useState, useEffect } from 'react';
import { Search, X, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface CustomerSearchProps {
  value: any;
  onChange: (customer: any) => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ value, onChange }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/v1/customers'],
    queryFn: async () => {
      const response = await fetch('/api/v1/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return response.json();
    }
  });
  
  // Filter customers based on search term
  const filteredCustomers = customers ? customers.filter((customer: any) => {
    const term = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(term) ||
      customer.company?.toLowerCase().includes(term) ||
      customer.sector?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term)
    );
  }) : [];
  
  const handleSelect = (customer: any) => {
    onChange(customer);
    setOpen(false);
  };
  
  const clearSelection = () => {
    onChange(null);
  };
  
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center">
        <label className="text-sm font-medium">Customer</label>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 ml-2"
            onClick={clearSelection}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      {value ? (
        <div className="flex items-start gap-2 border rounded-md p-3 relative">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-medium">{value.name}</p>
            <p className="text-sm text-muted-foreground">{value.company}</p>
            {value.sector && (
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {value.sector}
              </span>
            )}
          </div>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value ? value.name : "Select customer..."}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search customers..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Loading..." : "No customers found."}
                </CommandEmpty>
                <CommandGroup>
                  {filteredCustomers.map((customer: any) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.id.toString()}
                      onSelect={() => handleSelect(customer)}
                      className="flex items-start gap-2 py-2 px-2"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{customer.name}</p>
                          {value?.id === customer.id && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{customer.company}</p>
                        {customer.sector && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {customer.sector}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default CustomerSearch;