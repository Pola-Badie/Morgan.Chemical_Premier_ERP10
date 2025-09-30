import { Router } from 'express';
import { z } from 'zod';
import { permissionService } from './services/permission-service';
import { AccessLogger } from './services/access-logger-service';

const router = Router();
const accessLogger = new AccessLogger();

// Validation schemas
const permissionCheckSchema = z.object({
  resource: z.string().min(1),
  action: z.string().min(1)
});

const setPermissionSchema = z.object({
  moduleName: z.string().min(1),
  accessGranted: z.boolean()
});

const bulkPermissionSchema = z.object({
  permissions: z.array(z.object({
    moduleName: z.string().min(1),
    accessGranted: z.boolean()
  }))
});

/**
 * REAL-TIME PERMISSION CHECK API
 * Check if user has permission for specific resource/action
 */
router.post('/permissions/check/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { resource, action } = permissionCheckSchema.parse(req.body);
    
    const result = await permissionService.checkPermission({
      userId,
      resource,
      action,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      granted: result.granted,
      reason: result.reason,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error checking permission:', error);
    res.status(500).json({ error: 'Failed to check permission' });
  }
});

/**
 * GET USER COMPREHENSIVE PERMISSIONS
 * Returns explicit, role-based, and effective permissions
 */
router.get('/permissions/users/:userId/complete', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const permissions = await permissionService.getUserPermissions(userId);
    
    res.json({
      success: true,
      data: permissions,
      modules: permissionService.getAvailableModules(),
      actions: permissionService.getAvailableActions()
    });
  } catch (error) {
    console.error('Error fetching complete permissions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch permissions' 
    });
  }
});

/**
 * SET SINGLE USER PERMISSION
 * Create or update user permission for specific module
 */
router.post('/permissions/users/:userId/modules/:moduleName', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const moduleName = req.params.moduleName;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { accessGranted } = setPermissionSchema.parse(req.body);
    
    // Get admin user ID from token (assuming middleware sets this)
    const adminUserId = (req as any).user?.id || 1; // Fallback for development
    
    const permission = await permissionService.setUserPermission(
      userId,
      moduleName,
      accessGranted,
      adminUserId
    );

    res.json({
      success: true,
      data: permission,
      message: `Permission ${accessGranted ? 'granted' : 'denied'} for ${moduleName}`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error setting permission:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to set permission' 
    });
  }
});

/**
 * BULK PERMISSION UPDATES
 * Set multiple permissions for a user at once
 */
router.post('/permissions/users/:userId/bulk', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { permissions } = bulkPermissionSchema.parse(req.body);
    const adminUserId = (req as any).user?.id || 1;
    
    const results = [];
    const errors = [];

    // Process each permission update
    for (const perm of permissions) {
      try {
        const result = await permissionService.setUserPermission(
          userId,
          perm.moduleName,
          perm.accessGranted,
          adminUserId
        );
        results.push(result);
      } catch (error) {
        errors.push({
          moduleName: perm.moduleName,
          error: error.message
        });
      }
    }

    res.json({
      success: errors.length === 0,
      data: {
        updated: results.length,
        errors: errors.length,
        results,
        errors
      },
      message: `Updated ${results.length} permissions, ${errors.length} errors`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error bulk updating permissions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to bulk update permissions' 
    });
  }
});

/**
 * GET AVAILABLE MODULES AND ACTIONS
 * Configuration endpoint for permission management UI
 */
router.get('/permissions/configuration', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        modules: permissionService.getAvailableModules(),
        actions: permissionService.getAvailableActions(),
        roles: ['admin', 'manager', 'sales_rep', 'inventory_manager', 'accountant', 'staff']
      }
    });
  } catch (error) {
    console.error('Error fetching permission configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch configuration' 
    });
  }
});

/**
 * ACCESS LOG ANALYTICS
 * Get user access logs and security analytics
 */
router.get('/permissions/analytics/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await accessLogger.getUserAccessLogs(userId, limit);

    res.json({
      success: true,
      data: {
        userId,
        logs,
        totalLogs: logs.length
      }
    });
  } catch (error) {
    console.error('Error fetching user access logs:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch access logs' 
    });
  }
});

/**
 * SECURITY DASHBOARD
 * Get system-wide security analytics
 */
router.get('/permissions/analytics/security', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await accessLogger.getSecurityAnalytics(days);

    res.json({
      success: true,
      data: analytics,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching security analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch security analytics' 
    });
  }
});

/**
 * PERMISSION CHANGE HISTORY
 * Get complete audit trail of permission changes
 */
router.get('/permissions/history', async (req, res) => {
  try {
    const targetUserId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    
    const history = await accessLogger.getPermissionChangeHistory(targetUserId, limit);

    res.json({
      success: true,
      data: {
        changes: history,
        totalChanges: history.length,
        filteredByUser: targetUserId || null
      }
    });
  } catch (error) {
    console.error('Error fetching permission history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch permission history' 
    });
  }
});

/**
 * PERMISSION MATRIX VIEW
 * Get complete permission matrix for all users and modules
 */
router.get('/permissions/matrix', async (req, res) => {
  try {
    // This would require querying all users and their permissions
    // Implementation for matrix view showing all users vs all modules
    
    res.json({
      success: true,
      message: 'Permission matrix endpoint - implementation in progress',
      data: {
        modules: permissionService.getAvailableModules(),
        notice: 'Use individual user endpoints for now'
      }
    });
  } catch (error) {
    console.error('Error fetching permission matrix:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch permission matrix' 
    });
  }
});

export default router;