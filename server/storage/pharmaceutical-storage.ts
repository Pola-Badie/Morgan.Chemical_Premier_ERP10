import { BaseStorage } from "./base";
import { IPharmaceuticalStorage } from "./interfaces";
import {
  batches, productFormulations, productSafety, qualityTests, regulatorySubmissions,
  type Batch, type InsertBatch, type ProductFormulation, type InsertProductFormulation,
  type ProductSafety, type InsertProductSafety, type QualityTest, type InsertQualityTest,
  type RegulatorySubmission, type InsertRegulatorySubmission
} from "@shared/schema";

export class PharmaceuticalStorage extends BaseStorage implements IPharmaceuticalStorage {
  // Batch Management
  async getBatches(filters?: { productId?: number; status?: string; supplierId?: number }): Promise<Batch[]> {
    let query = this.db.select().from(batches);
    const conditions = [];
    
    if (filters?.productId) {
      conditions.push(this.eq(batches.productId, filters.productId));
    }
    if (filters?.status) {
      conditions.push(this.eq(batches.status, filters.status));
    }
    if (filters?.supplierId) {
      conditions.push(this.eq(batches.supplierId, filters.supplierId));
    }
    
    if (conditions.length > 0) {
      query = query.where(this.and(...conditions));
    }
    
    return await query.orderBy(this.desc(batches.createdAt));
  }

  async getBatch(id: number): Promise<Batch | undefined> {
    return await this.findById<Batch>(batches, id);
  }

  async getBatchByNumber(batchNumber: string): Promise<Batch | undefined> {
    const [batch] = await this.db.select()
      .from(batches)
      .where(this.eq(batches.batchNumber, batchNumber));
    return batch;
  }

  async getBatchesByProduct(productId: number): Promise<Batch[]> {
    return await this.db.select()
      .from(batches)
      .where(this.eq(batches.productId, productId))
      .orderBy(this.desc(batches.createdAt));
  }

  async getBatchesByStatus(status: string): Promise<Batch[]> {
    return await this.db.select()
      .from(batches)
      .where(this.eq(batches.status, status))
      .orderBy(this.desc(batches.createdAt));
  }

  async getExpiringBatches(days: number): Promise<Batch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const expiryThreshold = futureDate.toISOString().split('T')[0];
    
    return await this.db.select()
      .from(batches)
      .where(this.lte(batches.expiryDate, expiryThreshold))
      .orderBy(batches.expiryDate);
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    return await this.create<Batch>(batches, batch);
  }

  async updateBatch(id: number, data: Partial<Batch>): Promise<Batch | undefined> {
    return await this.updateById<Batch>(batches, id, data);
  }

  async deleteBatch(id: number): Promise<boolean> {
    return await this.deleteById(batches, id);
  }

  // Product Formulation
  async getProductFormulations(productId: number): Promise<ProductFormulation[]> {
    return await this.db.select()
      .from(productFormulations)
      .where(this.eq(productFormulations.productId, productId))
      .orderBy(productFormulations.ingredient);
  }

  async getFormulation(id: number): Promise<ProductFormulation | undefined> {
    return await this.findById<ProductFormulation>(productFormulations, id);
  }

  async createFormulation(formulation: InsertProductFormulation): Promise<ProductFormulation> {
    return await this.create<ProductFormulation>(productFormulations, formulation);
  }

  async updateFormulation(id: number, data: Partial<ProductFormulation>): Promise<ProductFormulation | undefined> {
    return await this.updateById<ProductFormulation>(productFormulations, id, data);
  }

  async deleteFormulation(id: number): Promise<boolean> {
    return await this.deleteById(productFormulations, id);
  }

  // Product Safety
  async getProductSafety(productId: number): Promise<ProductSafety | undefined> {
    const [safety] = await this.db.select()
      .from(productSafety)
      .where(this.eq(productSafety.productId, productId));
    return safety;
  }

  async createProductSafety(safety: InsertProductSafety): Promise<ProductSafety> {
    return await this.create<ProductSafety>(productSafety, safety);
  }

  async updateProductSafety(productId: number, data: Partial<ProductSafety>): Promise<ProductSafety | undefined> {
    const [updated] = await this.db.update(productSafety)
      .set({ ...data, updatedAt: new Date() })
      .where(this.eq(productSafety.productId, productId))
      .returning();
    return updated;
  }

  async deleteProductSafety(productId: number): Promise<boolean> {
    const result = await this.db.delete(productSafety)
      .where(this.eq(productSafety.productId, productId))
      .returning();
    return result.length > 0;
  }

  // Quality Control
  async getQualityTests(batchId?: number): Promise<QualityTest[]> {
    let query = this.db.select().from(qualityTests);
    
    if (batchId) {
      query = query.where(this.eq(qualityTests.batchId, batchId));
    }
    
    return await query.orderBy(this.desc(qualityTests.testDate));
  }

  async getQualityTest(id: number): Promise<QualityTest | undefined> {
    return await this.findById<QualityTest>(qualityTests, id);
  }

  async getQualityTestsByBatch(batchId: number): Promise<QualityTest[]> {
    return await this.db.select()
      .from(qualityTests)
      .where(this.eq(qualityTests.batchId, batchId))
      .orderBy(this.desc(qualityTests.testDate));
  }

  async createQualityTest(test: InsertQualityTest): Promise<QualityTest> {
    return await this.create<QualityTest>(qualityTests, test);
  }

  async updateQualityTest(id: number, data: Partial<QualityTest>): Promise<QualityTest | undefined> {
    return await this.updateById<QualityTest>(qualityTests, id, data);
  }

  async deleteQualityTest(id: number): Promise<boolean> {
    return await this.deleteById(qualityTests, id);
  }

  // Regulatory Submissions
  async getRegulatorySubmissions(productId?: number, status?: string): Promise<RegulatorySubmission[]> {
    let query = this.db.select().from(regulatorySubmissions);
    const conditions = [];
    
    if (productId) {
      conditions.push(this.eq(regulatorySubmissions.productId, productId));
    }
    if (status) {
      conditions.push(this.eq(regulatorySubmissions.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(this.and(...conditions));
    }
    
    return await query.orderBy(this.desc(regulatorySubmissions.submissionDate));
  }

  async getRegulatorySubmission(id: number): Promise<RegulatorySubmission | undefined> {
    return await this.findById<RegulatorySubmission>(regulatorySubmissions, id);
  }

  async createRegulatorySubmission(submission: InsertRegulatorySubmission): Promise<RegulatorySubmission> {
    return await this.create<RegulatorySubmission>(regulatorySubmissions, submission);
  }

  async updateRegulatorySubmission(id: number, data: Partial<RegulatorySubmission>): Promise<RegulatorySubmission | undefined> {
    return await this.updateById<RegulatorySubmission>(regulatorySubmissions, id, data);
  }

  async deleteRegulatorySubmission(id: number): Promise<boolean> {
    return await this.deleteById(regulatorySubmissions, id);
  }

  // Helper methods for pharmaceutical operations
  async getBatchesByManufactureDate(startDate: string, endDate: string): Promise<Batch[]> {
    return await this.db.select()
      .from(batches)
      .where(
        this.and(
          this.gte(batches.manufactureDate, startDate),
          this.lte(batches.manufactureDate, endDate)
        )
      )
      .orderBy(batches.manufactureDate);
  }

  async getQualityTestsByDateRange(startDate: string, endDate: string): Promise<QualityTest[]> {
    return await this.db.select()
      .from(qualityTests)
      .where(
        this.and(
          this.gte(qualityTests.testDate, startDate),
          this.lte(qualityTests.testDate, endDate)
        )
      )
      .orderBy(this.desc(qualityTests.testDate));
  }

  async getFormulationsByIngredient(ingredient: string): Promise<ProductFormulation[]> {
    return await this.db.select()
      .from(productFormulations)
      .where(this.eq(productFormulations.ingredient, ingredient))
      .orderBy(productFormulations.percentage);
  }
}