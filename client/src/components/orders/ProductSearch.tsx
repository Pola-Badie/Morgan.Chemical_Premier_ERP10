import React, { useState } from 'react';
import { Search, X, Package, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';

interface ProductSearchProps {
  value: any;
  onChange: (product: any) => void;
  quotationType?: 'manufacturing' | 'refining' | 'finished';
}

const ProductSearch: React.FC<ProductSearchProps> = ({ value, onChange, quotationType }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    }
  });
  
  // Filter products based on search term and optionally by quotation type
  const filteredProducts = products ? products.filter((product: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      product.name?.toLowerCase().includes(term) ||
      product.drugName?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.manufacturer?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
    );
    
    // Filter by product type based on quotation type if needed
    if (quotationType && product.productType) {
      const typeMapping = {
        'manufacturing': ['raw', 'semi-raw'],
        'refining': ['raw'],
        'finished': ['finished']
      };
      
      if (typeMapping[quotationType] && !typeMapping[quotationType].includes(product.productType)) {
        return false;
      }
    }
    
    // Only show active products with stock
    return matchesSearch && product.status === 'active' && (product.quantity || 0) > 0;
  }) : [];
  
  const handleSelect = (product: any) => {
    onChange({
      id: product.id,
      name: product.name,
      drugName: product.drugName,
      sku: product.sku,
      sellingPrice: parseFloat(product.sellingPrice || 0),
      unitOfMeasure: product.unitOfMeasure,
      manufacturer: product.manufacturer,
      quantity: product.quantity,
      productType: product.productType
    });
    setOpen(false);
  };
  
  const clearSelection = () => {
    onChange(null);
  };
  
  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'finished': return 'bg-green-100 text-green-800';
      case 'raw': return 'bg-blue-100 text-blue-800';
      case 'semi-raw': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center">
        <label className="text-sm font-medium">Product/Service</label>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 ml-2"
            onClick={clearSelection}
            data-testid="button-clear-product"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      {value ? (
        <div className="flex items-start gap-2 border rounded-md p-3 relative">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-medium" data-testid="text-selected-product-name">{value.name}</p>
            <p className="text-sm text-muted-foreground">SKU: {value.sku}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">EGP {value.sellingPrice}</span>
              <span className="text-sm text-muted-foreground">/ {value.unitOfMeasure}</span>
              {value.productType && (
                <Badge variant="secondary" className={`text-xs ${getProductTypeColor(value.productType)}`}>
                  {value.productType}
                </Badge>
              )}
            </div>
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
              data-testid="button-select-product"
            >
              {value ? value.name : "Select product..."}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[450px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search products by name, SKU, drug name..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-9"
                data-testid="input-search-product"
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Loading..." : "No products found."}
                </CommandEmpty>
                <CommandGroup>
                  {filteredProducts.map((product: any) => (
                    <CommandItem
                      key={product.id}
                      value={product.id.toString()}
                      onSelect={() => handleSelect(product)}
                      className="flex items-start gap-2 py-3 px-2"
                      data-testid={`option-product-${product.id}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.name}</p>
                          {value?.id === product.id && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{product.drugName}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">SKU: {product.sku}</span>
                          <span className="font-medium">EGP {product.sellingPrice}</span>
                          <span className="text-muted-foreground">/ {product.unitOfMeasure}</span>
                          <span className="text-muted-foreground">Stock: {product.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {product.productType && (
                            <Badge variant="secondary" className={`text-xs ${getProductTypeColor(product.productType)}`}>
                              {product.productType}
                            </Badge>
                          )}
                          {product.manufacturer && (
                            <span className="text-xs text-muted-foreground">by {product.manufacturer}</span>
                          )}
                        </div>
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

export default ProductSearch;