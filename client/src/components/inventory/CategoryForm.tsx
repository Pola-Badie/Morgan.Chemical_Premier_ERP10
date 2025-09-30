import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseMutationResult } from "@tanstack/react-query";

interface CategoryFormProps {
  addCategoryMutation: UseMutationResult<any, Error, { name: string, description?: string }, unknown>;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ addCategoryMutation }) => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (categoryName.trim() === "") return;
    
    addCategoryMutation.mutate(
      { 
        name: categoryName,
        description: categoryDescription || undefined 
      },
      {
        onSuccess: () => {
          setCategoryName("");
          setCategoryDescription("");
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Input
              placeholder="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              placeholder="Description (optional)"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
              className="h-10 py-2"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={addCategoryMutation.isPending || categoryName.trim() === ''}
          >
            {addCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CategoryForm;