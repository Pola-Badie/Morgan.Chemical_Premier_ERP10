import { BaseStorage } from "./base";
import { IFinancialStorage } from "./interfaces";
import {
  accounts, journalEntries, journalLines, customerPayments, paymentAllocations,
  type Account, type InsertAccount, type JournalEntry, type InsertJournalEntry,
  type JournalLine, type InsertJournalLine, type CustomerPayment, type InsertCustomerPayment,
  type PaymentAllocation, type InsertPaymentAllocation
} from "@shared/schema";

export class FinancialStorage extends BaseStorage implements IFinancialStorage {
  // Account methods
  async getAccounts(type?: string): Promise<Account[]> {
    if (type) {
      return await this.db.select().from(accounts)
        .where(this.and(this.eq(accounts.type, type), this.eq(accounts.isActive, true)))
        .orderBy(accounts.code);
    }

    return await this.db.select().from(accounts)
      .where(this.eq(accounts.isActive, true))
      .orderBy(accounts.code);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return await this.findById<Account>(accounts, id);
  }

  async getAccountByCode(code: string): Promise<Account | undefined> {
    const [account] = await this.db.select()
      .from(accounts)
      .where(this.eq(accounts.code, code));
    return account;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    return await this.create<Account>(accounts, account);
  }

  async updateAccount(id: number, data: Partial<Account>): Promise<Account | undefined> {
    return await this.updateById<Account>(accounts, id, data);
  }

  async deleteAccount(id: number): Promise<boolean> {
    return await this.softDeleteById(accounts, id);
  }

  // Journal Entry methods
  async getJournalEntries(filters?: { dateFrom?: string; dateTo?: string; status?: string }): Promise<JournalEntry[]> {
    let query = this.db.select().from(journalEntries);
    const conditions = [];

    if (filters?.dateFrom) {
      conditions.push(this.gte(journalEntries.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(this.lte(journalEntries.date, filters.dateTo));
    }
    if (filters?.status) {
      conditions.push(this.eq(journalEntries.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(this.and(...conditions)) as any;
    }

    return await query.orderBy(this.desc(journalEntries.date));
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    return await this.findById<JournalEntry>(journalEntries, id);
  }

  async getJournalLines(journalId: number): Promise<JournalLine[]> {
    return await this.db.select()
      .from(journalLines)
      .where(this.eq(journalLines.journalId, journalId))
      .orderBy(this.asc(journalLines.position));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    return await this.create<JournalEntry>(journalEntries, entry);
  }

  async createJournalLine(line: InsertJournalLine): Promise<JournalLine> {
    return await this.create<JournalLine>(journalLines, line);
  }

  async updateJournalEntry(id: number, data: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    return await this.updateById<JournalEntry>(journalEntries, id, data);
  }

  async deleteJournalEntry(id: number): Promise<boolean> {
    return await this.deleteById(journalEntries, id);
  }

  // Customer Payment methods
  async getCustomerPayments(filters?: { customerId?: number; dateFrom?: string; dateTo?: string }): Promise<CustomerPayment[]> {
    let query = this.db.select().from(customerPayments);
    const conditions = [];

    if (filters?.customerId) {
      conditions.push(this.eq(customerPayments.customerId, filters.customerId));
    }
    if (filters?.dateFrom) {
      conditions.push(this.gte(customerPayments.paymentDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(this.lte(customerPayments.paymentDate, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(this.and(...conditions)) as any;
    }

    return await query.orderBy(this.desc(customerPayments.paymentDate));
  }

  async getCustomerPayment(id: number): Promise<CustomerPayment | undefined> {
    return await this.findById<CustomerPayment>(customerPayments, id);
  }

  async getPaymentAllocations(paymentId: number): Promise<PaymentAllocation[]> {
    return await this.db.select()
      .from(paymentAllocations)
      .where(this.eq(paymentAllocations.paymentId, paymentId));
  }

  async createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment> {
    return await this.create<CustomerPayment>(customerPayments, payment);
  }

  async createPaymentAllocation(allocation: InsertPaymentAllocation): Promise<PaymentAllocation> {
    return await this.create<PaymentAllocation>(paymentAllocations, allocation);
  }

  async updateCustomerPayment(id: number, data: Partial<CustomerPayment>): Promise<CustomerPayment | undefined> {
    return await this.updateById<CustomerPayment>(customerPayments, id, data);
  }

  async deleteCustomerPayment(id: number): Promise<boolean> {
    return await this.deleteById(customerPayments, id);
  }

  // Helper methods for financial operations
  async getAccountsByType(accountType: string): Promise<Account[]> {
    return await this.db.select()
      .from(accounts)
      .where(this.and(this.eq(accounts.type, accountType), this.eq(accounts.isActive, true)))
      .orderBy(accounts.code);
  }

  async getJournalEntriesByPeriod(year: number, month?: number): Promise<JournalEntry[]> {
    let startDate = `${year}-01-01`;
    let endDate = `${year}-12-31`;

    if (month) {
      startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    }

    return await this.db.select()
      .from(journalEntries)
      .where(
        this.and(
          this.gte(journalEntries.date, startDate),
          this.lte(journalEntries.date, endDate)
        )
      )
      .orderBy(this.desc(journalEntries.date));
  }

  async validateJournalEntryBalance(journalId: number): Promise<boolean> {
    const lines = await this.getJournalLines(journalId);
    const totalDebits = lines.reduce((sum, line) => sum + (parseFloat(line.debit || '0') || 0), 0);
    const totalCredits = lines.reduce((sum, line) => sum + (parseFloat(line.credit || '0') || 0), 0);
    return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for rounding errors
  }
}