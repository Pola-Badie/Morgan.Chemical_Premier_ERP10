import { db } from "../db";
import { users, userPermissions, rolePermissions } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

/**
 * Permission Seeder for Premier ERP System
 * Seeds default permissions for all roles and modules
 */
export class PermissionSeeder {

  /**
   * Seed default role-based permissions for Premier ERP
   */
  async seedRolePermissions(): Promise<void> {
    console.log('🌱 Seeding role-based permissions...');

    const rolePermissionData = [
      // ADMIN - Full access to everything
      ...this.createRolePermissions('admin', [
        'dashboard', 'inventory', 'orders', 'procurement', 'accounting',
        'expenses', 'invoices', 'quotations', 'customers', 'suppliers',
        'users', 'user_management', 'reports', 'system_preferences', 'backups'
      ], ['create', 'read', 'update', 'delete', 'export', 'approve']),

      // MANAGER - Business operations access (no user management)
      ...this.createRolePermissions('manager', [
        'dashboard', 'inventory', 'orders', 'procurement', 'accounting',
        'expenses', 'invoices', 'quotations', 'customers', 'suppliers', 'reports'
      ], ['create', 'read', 'update', 'delete', 'export', 'approve']),

      // SALES_REP - Sales focused permissions
      ...this.createRolePermissions('sales_rep', [
        'dashboard', 'customers', 'quotations', 'invoices', 'inventory'
      ], ['create', 'read', 'update', 'export']),

      // INVENTORY_MANAGER - Inventory and procurement
      ...this.createRolePermissions('inventory_manager', [
        'dashboard', 'inventory', 'orders', 'procurement', 'suppliers'
      ], ['create', 'read', 'update', 'delete', 'export']),

      // ACCOUNTANT - Financial operations
      ...this.createRolePermissions('accountant', [
        'dashboard', 'accounting', 'expenses', 'invoices', 'customers', 'reports'
      ], ['create', 'read', 'update', 'export']),

      // STAFF - Basic read access
      ...this.createRolePermissions('staff', [
        'dashboard', 'inventory', 'customers'
      ], ['read'])
    ];

    // Insert role permissions (with conflict handling)
    for (const permission of rolePermissionData) {
      try {
        await db.insert(rolePermissions)
          .values(permission)
          .onConflictDoNothing();
      } catch (error) {
        console.log(`Skipping existing permission: ${permission.role} - ${permission.resource} - ${permission.action}`);
      }
    }

    console.log('✅ Role permissions seeded successfully');
  }

  /**
   * Seed admin user permissions if admin user exists but has no permissions
   */
  async seedAdminUserPermissions(): Promise<void> {
    console.log('🌱 Seeding admin user permissions...');

    // Find admin user
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));

    if (adminUsers.length === 0) {
      console.log('No admin users found - skipping admin user permission seeding');
      return;
    }

    for (const admin of adminUsers) {
      // Check if admin already has permissions
      const existingPermissions = await db.select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, admin.id));

      if (existingPermissions.length > 0) {
        console.log(`Admin user ${admin.username} already has permissions - skipping`);
        continue;
      }

      // Grant all module permissions to admin
      const modules = [
        'dashboard', 'inventory', 'orders', 'procurement', 'accounting',
        'expenses', 'invoices', 'quotations', 'customers', 'suppliers',
        'users', 'user_management', 'reports', 'system_preferences', 'backups'
      ];

      for (const module of modules) {
        try {
          await db.insert(userPermissions).values({
            userId: admin.id,
            moduleName: module,
            accessGranted: true
          });
        } catch (error) {
          console.log(`Permission already exists: ${admin.username} - ${module}`);
        }
      }

      console.log(`✅ Permissions granted to admin user: ${admin.username}`);
    }
  }

  /**
   * Create role permission entries for a role, resources, and actions
   */
  private createRolePermissions(
    role: string,
    resources: string[],
    actions: string[]
  ): Array<{ role: string, resource: string, action: string }> {
    const permissions = [];

    for (const resource of resources) {
      for (const action of actions) {
        permissions.push({ role, resource, action });
      }
    }

    return permissions;
  }

  /**
   * Run complete permission seeding
   */
  async seedAll(): Promise<void> {
    console.log('🚀 Starting permission seeding for Premier ERP...');

    try {
      await this.seedRolePermissions();
      await this.seedAdminUserPermissions();

      console.log('🎉 Permission seeding completed successfully!');
    } catch (error) {
      console.error('❌ Permission seeding failed:', error);
      throw error;
    }
  }

  /**
   * Get seeding status and statistics
   */
  async getSeedingStatus(): Promise<{
    rolePermissions: number;
    userPermissions: number;
    totalUsers: number;
    adminUsers: number;
  }> {
    const rolePermsCount = await db.execute('SELECT COUNT(*) as count FROM role_permissions');
    const userPermsCount = await db.execute('SELECT COUNT(*) as count FROM user_permissions');
    const totalUsersCount = await db.execute('SELECT COUNT(*) as count FROM users');
    const adminUsersCount = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");

    return {
      rolePermissions: (rolePermsCount as any).rows[0]?.count || 0,
      userPermissions: (userPermsCount as any).rows[0]?.count || 0,
      totalUsers: (totalUsersCount as any).rows[0]?.count || 0,
      adminUsers: (adminUsersCount as any).rows[0]?.count || 0
    };
  }
}

export const permissionSeeder = new PermissionSeeder();