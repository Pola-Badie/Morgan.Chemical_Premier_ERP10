/**
 * Permission Seeding Script for Premier ERP
 * Creates real permissions for all users and roles
 */
import { permissionSeeder } from './services/permission-seeder';

async function main() {
  try {
    console.log('🚀 Starting permission seeding for Premier ERP System...');
    
    // Get current status
    const status = await permissionSeeder.getSeedingStatus();
    console.log('📊 Current Status:', status);
    
    // Seed all permissions
    await permissionSeeder.seedAll();
    
    // Show final status
    const finalStatus = await permissionSeeder.getSeedingStatus();
    console.log('✅ Final Status:', finalStatus);
    
  } catch (error) {
    console.error('❌ Permission seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as seedPermissions };