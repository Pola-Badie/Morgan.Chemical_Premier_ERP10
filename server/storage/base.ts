import { db } from "../db";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";

export abstract class BaseStorage {
  protected db = db;
  protected eq = eq;
  protected and = and;
  protected desc = desc;
  protected asc = asc;
  protected gte = gte;
  protected lte = lte;

  protected async findById<T>(table: any, id: number): Promise<T | undefined> {
    const [record] = await this.db.select().from(table).where(eq(table.id, id));
    return record;
  }

  protected async findAll<T>(table: any, conditions?: any): Promise<T[]> {
    let query = this.db.select().from(table);
    if (conditions) {
      query = query.where(conditions) as any;
    }
    return await query;
  }

  protected async create<T>(table: any, data: any): Promise<T> {
    const result = await this.db.insert(table).values(data).returning();
    return (result as any)[0] as T;
  }

  protected async updateById<T>(table: any, id: number, data: any): Promise<T | undefined> {
    const [record] = await this.db.update(table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(table.id, id))
      .returning();
    return record;
  }

  protected async deleteById(table: any, id: number): Promise<boolean> {
    const result = await this.db.delete(table).where(eq(table.id, id)).returning();
    return (result as any).length > 0;
  }

  protected async softDeleteById(table: any, id: number): Promise<boolean> {
    const [updated] = await this.db.update(table)
      .set({ isActive: false })
      .where(eq(table.id, id))
      .returning();
    return updated !== undefined;
  }
}