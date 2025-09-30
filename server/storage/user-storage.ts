import { BaseStorage } from "./base";
import { IUserStorage } from "./interfaces";
import {
  users, userPermissions, rolePermissions, loginLogs,
  type User, type InsertUser, type UserPermission, type InsertUserPermission,
  type RolePermission, type InsertRolePermission, type LoginLog, type InsertLoginLog
} from "@shared/schema";

export class UserStorage extends BaseStorage implements IUserStorage {
  async getUsers(): Promise<User[]> {
    return await this.findAll<User>(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    return await this.findById<User>(users, id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(this.eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    return await this.create<User>(users, user);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    return await this.updateById<User>(users, id, userData);
  }

  async deactivateUser(id: number): Promise<boolean> {
    const [updated] = await this.db.update(users)
      .set({ status: 'inactive' })
      .where(this.eq(users.id, id))
      .returning();
    return updated !== undefined;
  }

  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    return await this.db.select()
      .from(userPermissions)
      .where(this.eq(userPermissions.userId, userId));
  }

  async getUserPermissionsByModule(userId: number, moduleName: string): Promise<UserPermission | undefined> {
    const [permission] = await this.db.select()
      .from(userPermissions)
      .where(
        this.and(
          this.eq(userPermissions.userId, userId),
          this.eq(userPermissions.moduleName, moduleName)
        )
      );
    return permission;
  }

  async createUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    return await this.create<UserPermission>(userPermissions, permission);
  }

  async updateUserPermission(userId: number, moduleName: string, accessGranted: boolean): Promise<UserPermission | undefined> {
    const [updated] = await this.db.update(userPermissions)
      .set({ accessGranted })
      .where(
        this.and(
          this.eq(userPermissions.userId, userId),
          this.eq(userPermissions.moduleName, moduleName)
        )
      )
      .returning();
    return updated;
  }

  async deleteUserPermission(userId: number, moduleName: string): Promise<boolean> {
    const result = await this.db.delete(userPermissions)
      .where(
        this.and(
          this.eq(userPermissions.userId, userId),
          this.eq(userPermissions.moduleName, moduleName)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return await this.db.select()
      .from(rolePermissions)
      .where(this.eq(rolePermissions.role, role));
  }

  async createRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    return await this.create<RolePermission>(rolePermissions, permission);
  }

  async deleteRolePermission(id: number): Promise<boolean> {
    return await this.deleteById(rolePermissions, id);
  }

  async getLoginLogs(limit?: number): Promise<LoginLog[]> {
    let query = this.db.select().from(loginLogs).orderBy(this.desc(loginLogs.timestamp));
    if (limit) {
      query = query.limit(limit) as any;
    }
    return await query;
  }

  async createLoginLog(log: InsertLoginLog): Promise<LoginLog> {
    return await this.create<LoginLog>(loginLogs, log);
  }
}