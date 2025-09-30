import { BaseStorage } from "./base";
import { IProductStorage } from "./interfaces";
import { like, sql, count } from "drizzle-orm";
import {
  products, productCategories,
  type Product, type InsertProduct, type ProductCategory, type InsertProductCategory
} from "@shared/schema";

export class ProductStorage extends BaseStorage implements IProductStorage {
  async getProducts(filters?: { type?: string; status?: string; categoryId?: number }): Promise<Product[]> {
    let query = this.db.select().from(products);
    const conditions = [];

    if (filters?.type) {
      // Note: products table doesn't have type field, using status instead
      conditions.push(this.eq(products.status, filters.type));
    }
    if (filters?.status) {
      conditions.push(this.eq(products.status, filters.status));
    }
    if (filters?.categoryId) {
      conditions.push(this.eq(products.categoryId, filters.categoryId));
    }

    if (conditions.length > 0) {
      query = query.where(this.and(...conditions)) as any;
    }

    return await query.orderBy(this.desc(products.createdAt));
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await this.db.select()
      .from(products)
      .where(this.eq(products.categoryId, categoryId))
      .orderBy(products.name);
  }

  async getProductsByStatus(status: string): Promise<Product[]> {
    return await this.db.select()
      .from(products)
      .where(this.eq(products.status, status))
      .orderBy(products.name);
  }

  async getLowStockProducts(): Promise<Product[]> {
    // Note: Using available quantity field instead of stockQuantity/minimumStockLevel
    return await this.db.select()
      .from(products)
      .where(this.eq(products.status, 'low_stock'))
      .orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return await this.findById<Product>(products, id);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await this.db.select()
      .from(products)
      .where(this.eq(products.sku, sku));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return await this.create<Product>(products, product);
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    return await this.updateById<Product>(products, id, productData);
  }

  async deleteProduct(id: number): Promise<boolean> {
    return await this.deleteById(products, id);
  }

  // Product Categories
  async getProductCategories(): Promise<ProductCategory[]> {
    return await this.db.select()
      .from(productCategories)
      .orderBy(productCategories.name);
  }

  async getProductCategory(id: number): Promise<ProductCategory | undefined> {
    return await this.findById<ProductCategory>(productCategories, id);
  }

  async createProductCategory(category: InsertProductCategory): Promise<ProductCategory> {
    return await this.create<ProductCategory>(productCategories, category);
  }

  async updateProductCategory(id: number, categoryData: Partial<ProductCategory>): Promise<ProductCategory | undefined> {
    return await this.updateById<ProductCategory>(productCategories, id, categoryData);
  }

  async deleteProductCategory(id: number): Promise<boolean> {
    return await this.deleteById(productCategories, id);
  }

  // Helper methods for advanced product operations
  async searchProducts(searchTerm: string): Promise<Product[]> {
    return await this.db.select()
      .from(products)
      .where(
        this.or(
          like(products.name, `%${searchTerm}%`),
          like(products.drugName, `%${searchTerm}%`),
          like(products.sku, `%${searchTerm}%`),
          like(products.description, `%${searchTerm}%`)
        )
      )
      .orderBy(products.name);
  }

  async getProductCount(): Promise<number> {
    const [result] = await this.db.select({ count: count() }).from(products);
    return result.count;
  }

  async getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return await this.db.select()
      .from(products)
      .where(
        this.and(
          this.gte(sql`CAST(${products.sellingPrice} AS DECIMAL)`, minPrice),
          this.lte(sql`CAST(${products.sellingPrice} AS DECIMAL)`, maxPrice)
        )
      )
      .orderBy(products.name);
  }

  private or(...conditions: any[]) {
    return sql`${conditions.join(' OR ')}`;
  }
}