// Permission Cache Module - Reduces database queries for user permissions
import { UserPermission, RolePermission } from "../shared/schema.js";

interface PermissionCacheEntry {
  permissions: UserPermission[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface RolePermissionCacheEntry {
  permissions: RolePermission[];
  timestamp: number;
  ttl: number;
}

class PermissionCache {
  private userCache: Map<number, PermissionCacheEntry> = new Map();
  private roleCache: Map<string, RolePermissionCacheEntry> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private maxCacheSize: number = 100; // Maximum users to cache

  // Get user permissions from cache or return null if expired/not found
  getUserPermissions(userId: number): UserPermission[] | null {
    const entry = this.userCache.get(userId);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, remove it
      this.userCache.delete(userId);
      return null;
    }

    console.log(`Permission cache HIT for user ${userId}`);
    return entry.permissions;
  }

  // Set user permissions in cache
  setUserPermissions(userId: number, permissions: UserPermission[], ttl?: number): void {
    // Implement LRU eviction if cache is full
    if (this.userCache.size >= this.maxCacheSize && !this.userCache.has(userId)) {
      const oldestKey = this.userCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.userCache.delete(oldestKey);
        console.log(`Permission cache evicted user ${oldestKey} (LRU)`);
      }
    }

    this.userCache.set(userId, {
      permissions,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
    console.log(`Permission cache SET for user ${userId} (${permissions.length} permissions)`);
  }

  // Get role permissions from cache
  getRolePermissions(role: string): RolePermission[] | null {
    const entry = this.roleCache.get(role);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.roleCache.delete(role);
      return null;
    }

    console.log(`Permission cache HIT for role ${role}`);
    return entry.permissions;
  }

  // Set role permissions in cache
  setRolePermissions(role: string, permissions: RolePermission[], ttl?: number): void {
    this.roleCache.set(role, {
      permissions,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL * 2 // Roles change less frequently
    });
    console.log(`Permission cache SET for role ${role}`);
  }

  // Invalidate user cache (e.g., after permission update)
  invalidateUser(userId: number): void {
    if (this.userCache.delete(userId)) {
      console.log(`Permission cache invalidated for user ${userId}`);
    }
  }

  // Invalidate role cache
  invalidateRole(role: string): void {
    if (this.roleCache.delete(role)) {
      console.log(`Permission cache invalidated for role ${role}`);
    }
  }

  // Clear all caches
  clearAll(): void {
    const userCount = this.userCache.size;
    const roleCount = this.roleCache.size;
    this.userCache.clear();
    this.roleCache.clear();
    console.log(`Permission cache cleared (${userCount} users, ${roleCount} roles)`);
  }

  // Get cache statistics
  getStats() {
    return {
      userCacheSize: this.userCache.size,
      roleCacheSize: this.roleCache.size,
      maxCacheSize: this.maxCacheSize,
      defaultTTL: this.defaultTTL
    };
  }

  // Periodic cleanup of expired entries
  startCleanup(): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now();
      let cleanedUsers = 0;
      let cleanedRoles = 0;

      // Clean user cache
      for (const [userId, entry] of this.userCache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.userCache.delete(userId);
          cleanedUsers++;
        }
      }

      // Clean role cache
      for (const [role, entry] of this.roleCache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.roleCache.delete(role);
          cleanedRoles++;
        }
      }

      if (cleanedUsers > 0 || cleanedRoles > 0) {
        console.log(`Permission cache cleanup: ${cleanedUsers} users, ${cleanedRoles} roles`);
      }
    }, 60000); // Run every minute
  }
}

// Export singleton instance
export const permissionCache = new PermissionCache();

// Start cleanup on module load
const cleanupInterval = permissionCache.startCleanup();

// Clean up on process exit
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  permissionCache.clearAll();
});