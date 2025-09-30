import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { users, userPermissions, rolePermissions } from "@shared/schema";
import type { User, UserPermission, RolePermission } from "@shared/schema";
import { AccessLogger } from "./access-logger-service";

export interface PermissionCheck {
  userId: number;
  resource: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PermissionResult {
  granted: boolean;
  reason: string;
  user?: User;
  permission?: UserPermission | RolePermission;
}

/**
 * Comprehensive Permission Service for Premier ERP
 * Handles modular access control with complete audit logging
 */
export class PermissionService {
  private accessLogger: AccessLogger;

  constructor() {
    this.accessLogger = new AccessLogger();
  }

  /**
   * Check if user has permission for specific resource and action
   * With comprehensive access logging
   */
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    const startTime = Date.now();
    
    try {
      // Get user details
      const [user] = await db.select().from(users).where(eq(users.id, check.userId));
      
      if (!user) {
        const result: PermissionResult = {
          granted: false,
          reason: 'User not found'
        };
        
        await this.accessLogger.logPermissionCheck({
          ...check,
          granted: false,
          reason: result.reason,
          responseTime: Date.now() - startTime
        });
        
        return result;
      }

      if (user.status !== 'active') {
        const result: PermissionResult = {
          granted: false,
          reason: 'User account is not active',
          user
        };
        
        await this.accessLogger.logPermissionCheck({
          ...check,
          granted: false,
          reason: result.reason,
          responseTime: Date.now() - startTime
        });
        
        return result;
      }

      // Admin users have all permissions
      if (user.role === 'admin') {
        const result: PermissionResult = {
          granted: true,
          reason: 'Admin role - full access',
          user
        };
        
        await this.accessLogger.logPermissionCheck({
          ...check,
          granted: true,
          reason: result.reason,
          responseTime: Date.now() - startTime
        });
        
        return result;
      }

      // Check specific user permissions first
      const [userPermission] = await db
        .select()
        .from(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, check.userId),
            eq(userPermissions.moduleName, check.resource)
          )
        );

      if (userPermission) {
        const result: PermissionResult = {
          granted: userPermission.accessGranted,
          reason: userPermission.accessGranted 
            ? 'Explicit user permission granted' 
            : 'Explicit user permission denied',
          user,
          permission: userPermission
        };
        
        await this.accessLogger.logPermissionCheck({
          ...check,
          granted: result.granted,
          reason: result.reason,
          responseTime: Date.now() - startTime
        });
        
        return result;
      }

      // Check role-based permissions
      const [rolePermission] = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.role, user.role),
            eq(rolePermissions.resource, check.resource),
            eq(rolePermissions.action, check.action)
          )
        );

      if (rolePermission) {
        const result: PermissionResult = {
          granted: true,
          reason: `Role-based permission: ${user.role} can ${check.action} ${check.resource}`,
          user,
          permission: rolePermission
        };
        
        await this.accessLogger.logPermissionCheck({
          ...check,
          granted: true,
          reason: result.reason,
          responseTime: Date.now() - startTime
        });
        
        return result;
      }

      // Default deny
      const result: PermissionResult = {
        granted: false,
        reason: 'No matching permission found - access denied',
        user
      };
      
      await this.accessLogger.logPermissionCheck({
        ...check,
        granted: false,
        reason: result.reason,
        responseTime: Date.now() - startTime
      });
      
      return result;

    } catch (error: any) {
      const result: PermissionResult = {
        granted: false,
        reason: `Permission check failed: ${error?.message || 'Unknown error'}`
      };
      
      await this.accessLogger.logPermissionCheck({
        ...check,
        granted: false,
        reason: result.reason,
        responseTime: Date.now() - startTime,
        error: error?.message || 'Unknown error'
      });
      
      return result;
    }
  }

  /**
   * Get all permissions for a user (explicit + role-based)
   */
  async getUserPermissions(userId: string | number): Promise<{
    explicit: UserPermission[];
    roleBased: RolePermission[];
    effective: string[];
  }> {
    const [user] = await db.select().from(users).where(eq(users.id, String(userId)));
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get explicit user permissions
    const explicit = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    // Get role-based permissions
    const roleBased = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.role, user.role));

    // Calculate effective permissions
    const effective: string[] = [];
    
    // Add explicit granted permissions
    explicit.forEach(perm => {
      if (perm.accessGranted) {
        effective.push(perm.moduleName);
      }
    });

    // Add role-based permissions (unless explicitly denied)
    roleBased.forEach(perm => {
      const resource = perm.resource;
      const explicitDenied = explicit.find(ep => 
        ep.moduleName === resource && !ep.accessGranted
      );
      
      if (!explicitDenied && !effective.includes(resource)) {
        effective.push(resource);
      }
    });

    return { explicit, roleBased, effective };
  }

  /**
   * Set user permission for a specific module
   */
  async setUserPermission(
    userId: number, 
    moduleName: string, 
    accessGranted: boolean,
    adminUserId: number
  ): Promise<UserPermission> {
    // Verify admin user has permission to modify permissions
    const adminCheck = await this.checkPermission({
      userId: adminUserId,
      resource: 'user_management',
      action: 'update'
    });

    if (!adminCheck.granted) {
      throw new Error('Insufficient permissions to modify user permissions');
    }

    // Check if permission already exists
    const [existing] = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.moduleName, moduleName)
        )
      );

    let result: UserPermission;

    if (existing) {
      // Update existing permission
      const [updated] = await db
        .update(userPermissions)
        .set({ 
          accessGranted,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userPermissions.userId, userId),
            eq(userPermissions.moduleName, moduleName)
          )
        )
        .returning();
      result = updated;
    } else {
      // Create new permission
      const [created] = await db
        .insert(userPermissions)
        .values({
          userId,
          moduleName,
          accessGranted
        })
        .returning();
      result = created;
    }

    // Log the permission change
    await this.accessLogger.logPermissionChange({
      adminUserId,
      targetUserId: userId,
      moduleName,
      accessGranted,
      action: existing ? 'updated' : 'created',
      previousValue: existing?.accessGranted
    });

    return result;
  }

  /**
   * Get all available Premier ERP modules for permission configuration
   */
  getAvailableModules(): string[] {
    return [
      'dashboard',
      'inventory',
      'orders',
      'procurement', 
      'accounting',
      'expenses',
      'invoices',
      'quotations',
      'customers',
      'suppliers',
      'users',
      'user_management',
      'reports',
      'system_preferences',
      'backups'
    ];
  }

  /**
   * Get all available actions for permission configuration
   */
  getAvailableActions(): string[] {
    return ['create', 'read', 'update', 'delete', 'export', 'approve'];
  }
}

export const permissionService = new PermissionService();