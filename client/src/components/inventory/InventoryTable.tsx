import React from "react";
import { MoreHorizontal, Pencil, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Product } from "@shared/schema";

interface InventoryTableProps {
  products: Product[];
  isLoading: boolean;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onCreateLabel: (product: Product) => void;
  calculateExpiryStatus: (expiryDate: Date) => { status: string, days: number } | null;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  isLoading,
  onEditProduct,
  onDeleteProduct,
  onCreateLabel,
  calculateExpiryStatus,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Loading inventory...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No inventory items found. Add your first item using the button above.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-slate-50">
          <tr className="border-b">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">SKU</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Quantity</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Shelf</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Price</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Expiry Date</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const expiryStatus = product.expiryDate
              ? calculateExpiryStatus(new Date(product.expiryDate))
              : null;
            
            return (
              <tr key={product.id} className="border-b">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.drugName}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {/* Category will be added by parent component */}
                  {'-'}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                <td className="px-4 py-3">
                  {product.quantity} {product.unitOfMeasure}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {product.location || '-'}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {product.shelf || '-'}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatCurrency(parseFloat(product.sellingPrice))}
                </td>
                <td className="px-4 py-3">
                  {product.expiryDate ? (
                    <div className="flex items-center">
                      <span className={expiryStatus?.status === 'expired' ? 'text-red-500' : 
                                      expiryStatus?.status === 'near-expiry' ? 'text-orange-700' : ''}>
                        {formatDate(product.expiryDate)}
                      </span>
                      {expiryStatus && (
                        <span className={`ml-2 text-xs ${expiryStatus.status === 'expired' ? 'text-red-500' : 
                                      expiryStatus.status === 'near-expiry' ? 'text-orange-700' : ''}`}>
                          {expiryStatus.status === 'expired' ? 
                            `(Expired ${expiryStatus.days} days ago)` : 
                            `(Expires in ${expiryStatus.days} days)`}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onCreateLabel(product)}>
                        <Tag className="h-4 w-4 mr-2" />
                        Create Label
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditProduct(product)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;