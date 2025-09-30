import React from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

// Use the Category type from the parent component
type Category = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
};

interface CategoryTableProps {
  categories: Category[];
  isLoading: boolean;
  onDeleteCategory: (category: Category) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  isLoading,
  onDeleteCategory,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Loading categories...</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No categories found. Add your first category below.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Name</th>
            <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
            <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b">
              <td className="py-3 px-2">{category.name}</td>
              <td className="py-3 px-2">{category.description || '-'}</td>
              <td className="py-3 px-2 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDeleteCategory(category)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;