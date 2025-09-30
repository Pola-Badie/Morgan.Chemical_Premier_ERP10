import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import ProductForm from "@/components/inventory/ProductForm";
import InventoryTable from "@/components/inventory/InventoryTable";
import CategoryTable from "@/components/inventory/CategoryTable";
import CategoryForm from "@/components/inventory/CategoryForm";
import ProductFilter from "@/components/inventory/ProductFilter";

// Define Category type based on existing schema
type Category = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
};

const InventoryNew = () => {
  const { toast } = useToast();
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  
  // Fetch products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  // Mutations
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast({
        title: "Category deleted",
        description: "The category has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/categories", newCategory);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category added",
        description: "The category has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add category: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      // Invalidate inventory alert cards for real-time dashboard updates
      queryClient.invalidateQueries({ queryKey: ['expiring-products'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      console.log('Product deleted successfully - invalidated all inventory caches for real-time updates');
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const handleCreateLabel = (product: Product) => {
    // To be implemented
    toast({
      title: "Create Label",
      description: `Creating label for ${product.name}`,
    });
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCategory = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  // Helper functions
  const calculateExpiryStatus = (expiryDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiryDay = new Date(expiryDate);
    expiryDay.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'expired', days: Math.abs(diffDays) };
    } else if (diffDays <= 30) {
      return { status: 'near-expiry', days: diffDays };
    } else {
      return { status: 'valid', days: diffDays };
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.drugName && product.drugName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by status
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "expired" && product.expiryDate && new Date(product.expiryDate) < new Date()) ||
      (selectedStatus === "near" && product.quantity <= product.lowStockThreshold) ||
      (selectedStatus === "out_of_stock" && product.quantity <= 0) ||
      (selectedStatus === "active" && 
        product.quantity > 0 && 
        product.quantity > product.lowStockThreshold && 
        (!product.expiryDate || new Date(product.expiryDate) > new Date()));
    
    // Filter by category
    const matchesCategory =
      selectedCategory === "all" ||
      product.categoryId === parseInt(selectedCategory);
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={() => {
          setProductToEdit(null);
          setIsProductFormOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList className="w-full bg-white border-b">
          <TabsTrigger value="inventory" className="flex-1">Inventory</TabsTrigger>
          <TabsTrigger value="categories" className="flex-1">Categories</TabsTrigger>
        </TabsList>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                Manage your inventory items, track stock levels and expiry dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductFilter
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                categories={categories}
              />
              
              <InventoryTable
                products={filteredProducts}
                isLoading={isLoadingProducts}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteProduct}
                onCreateLabel={handleCreateLabel}
                calculateExpiryStatus={calculateExpiryStatus}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage product categories used in inventory and sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <CategoryTable
                  categories={categories}
                  isLoading={isLoadingCategories}
                  onDeleteCategory={openDeleteDialog}
                />
                
                <CategoryForm addCategoryMutation={addCategoryMutation} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Form Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{productToEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={productToEdit} 
            onSuccess={() => setIsProductFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryNew;