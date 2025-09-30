import { db } from "../db";
import { sql } from "drizzle-orm";

export interface PermissionCheckLog {
  userId: number;
  resource: string;
  action: string;
  granted: boolean;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
  responseTime: number;
  error?: string;
}

export interface PermissionChangeLog {
  adminUserId: number;
  targetUserId: number;
  moduleName: string;
  accessGranted: boolean;
  action: 'created' | 'updated' | 'deleted';
  previousValue?: boolean;
}

/**
 * Access Logger Service for complete audit trail
 * Logs all permission checks and changes in Premier ERP
 */
export class AccessLogger {
  
  /**
   * Log permission check attempt with full context
   */
  async logPermissionCheck(log: PermissionCheckLog): Promise<void> {
    try {
      // Create access_logs table if it doesn't exist
      await this.ensureAccessLogsTable();
      
      await db.execute(sql`
        INSERT INTO access_logs (
          user_id, resource, action, granted, reason, 
          ip_address, user_agent, response_time, error, created_at
        ) VALUES (
          ${log.userId}, ${log.resource}, ${log.action}, ${log.granted}, 
          ${log.reason}, ${log.ipAddress || null}, ${log.userAgent || null}, 
          ${log.responseTime}, ${log.error || null}, NOW()
        )
      `);
    } catch (error: any) {
      console.error('Failed to log permission check:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  /**
   * Log permission configuration changes
   */
  async logPermissionChange(log: PermissionChangeLog): Promise<void> {
    try {
      await this.ensurePermissionChangesTable();
      
      await db.execute(sql`
        INSERT INTO permission_changes (
          admin_user_id, target_user_id, module_name, access_granted,
          action, previous_value, created_at
        ) VALUES (
          ${log.adminUserId}, ${log.targetUserId}, ${log.moduleName}, 
          ${log.accessGranted}, ${log.action}, ${log.previousValue || null}, NOW()
        )
      `);
    } catch (error: any) {
      console.error('Failed to log permission change:', error);
    }
  }

  /**
   * Get recent access logs for a user
   */
  async getUserAccessLogs(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM access_logs 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `);
      return result.rows;
    } catch (error: any) {
      console.error('Failed to get user access logs:', error);
      return [];
    }
  }

  /**
   * Get permission change history
   */
  async getPermissionChangeHistory(targetUserId?: number, limit: number = 100): Promise<any[]> {
    try {
      let query = sql`
        SELECT pc.*, 
               au.name as admin_name, 
               tu.name as target_user_name
        FROM permission_changes pc
        LEFT JOIN users au ON pc.admin_user_id = au.id
        LEFT JOIN users tu ON pc.target_user_id = tu.id
      `;
      
      if (targetUserId) {
        query = sql`${query} WHERE pc.target_user_id = ${targetUserId}`;
      }
      
      query = sql`${query} ORDER BY pc.created_at DESC LIMIT ${limit}`;
      
      const result = await db.execute(query);
      return result.rows;
    } catch (error) {
      console.error('Failed to get permission change history:', error);
      return [];
    }
  }

  /**
   * Get security analytics and statistics
   */
  async getSecurityAnalytics(days: number = 30): Promise<{
    totalChecks: number;
    deniedAttempts: number;
    uniqueUsers: number;
    mostAccessedResources: any[];
    recentDenials: any[];
  }> {
    try {
      const [totalChecks] = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM access_logs 
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
      `);

      const [deniedAttempts] = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM access_logs 
        WHERE granted = false 
        AND created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
      `);

      const [uniqueUsers] = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM access_logs 
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
      `);

      const mostAccessedResources = await db.execute(sql`
        SELECT resource, COUNT(*) as access_count
        FROM access_logs 
        WHERE created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
        GROUP BY resource 
        ORDER BY access_count DESC 
        LIMIT 10
      `);

      const recentDenials = await db.execute(sql`
        SELECT al.*, u.name as user_name
        FROM access_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.granted = false 
        AND al.created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
        ORDER BY al.created_at DESC 
        LIMIT 20
      `);

      return {
        totalChecks: totalChecks.rows[0]?.count || 0,
        deniedAttempts: deniedAttempts.rows[0]?.count || 0,
        uniqueUsers: uniqueUsers.rows[0]?.count || 0,
        mostAccessedResources: mostAccessedResources.rows,
        recentDenials: recentDenials.rows
      };
    } catch (error) {
      console.error('Failed to get security analytics:', error);
      return {
        totalChecks: 0,
        deniedAttempts: 0,
        uniqueUsers: 0,
        mostAccessedResources: [],
        recentDenials: []
      };
    }
  }

  /**
   * Ensure access logs table exists
   */
  private async ensureAccessLogsTable(): Promise<void> {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS access_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          resource VARCHAR(100) NOT NULL,
          action VARCHAR(50) NOT NULL,
          granted BOOLEAN NOT NULL,
          reason TEXT NOT NULL,
          ip_address INET,
          user_agent TEXT,
          response_time INTEGER,
          error TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON access_logs(resource)
      `);
    } catch (error) {
      console.error('Failed to ensure access_logs table:', error);
    }
  }

  /**
   * Ensure permission changes table exists
   */
  private async ensurePermissionChangesTable(): Promise<void> {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS permission_changes (
          id SERIAL PRIMARY KEY,
          admin_user_id INTEGER NOT NULL,
          target_user_id INTEGER NOT NULL,
          module_name VARCHAR(100) NOT NULL,
          access_granted BOOLEAN NOT NULL,
          action VARCHAR(20) NOT NULL,
          previous_value BOOLEAN,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for performance
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_permission_changes_target_user ON permission_changes(target_user_id)
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_permission_changes_created_at ON permission_changes(created_at)
      `);
    } catch (error) {
      console.error('Failed to ensure permission_changes table:', error);
    }
  }
}