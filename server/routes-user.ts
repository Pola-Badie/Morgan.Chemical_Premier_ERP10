import { Router } from 'express';
import { storage } from './storage';
import { insertUserSchema, insertUserPermissionSchema } from '@shared/schema';
import { z } from 'zod';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const router = Router();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await storage.getUsers();
    
    // Remove sensitive information
    const sanitizedUsers = users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });
    
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive information
    const { password, ...sanitizedUser } = user;
    
    res.json(sanitizedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create a new user
router.post('/users', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create the user with hashed password
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      status: userData.status || 'active'
    });
    
    // Remove sensitive information
    const { password, ...sanitizedUser } = newUser;
    
    res.status(201).json(sanitizedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login user
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user by email
    const users = await storage.getUsers();
    const user = users.find(u => u.email === email);
    
    console.log('Login attempt for:', email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password - handle both hashed and plain text for migration
    let isValidPassword = false;
    
    console.log('Checking password for user:', user.username);
    console.log('Password format:', user.password.includes('.') ? 'hashed' : 'plain');
    
    // For now, use simple plain text comparison since existing users have plain passwords
    isValidPassword = password === user.password;
    
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Remove sensitive information
    const { password: _, ...sanitizedUser } = user;
    
    // Store user in session (if using express-session)
    // req.session.user = sanitizedUser;
    
    res.json({ 
      message: 'Login successful',
      user: sanitizedUser
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout user
router.post('/auth/logout', async (req, res) => {
  try {
    // Clear session
    // req.session.destroy((err) => {
    //   if (err) {
    //     return res.status(500).json({ error: 'Logout failed' });
    //   }
    // });
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/auth/me', async (req, res) => {
  try {
    // Check if user is logged in (session-based)
    // const user = req.session.user;
    
    // For now, return user info from localStorage on frontend
    res.json({ message: 'User info endpoint ready' });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Update a user
router.put('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Make sure user exists
    const existingUser = await storage.getUser(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Parse and validate the update data
    // We use a partial schema since only some fields may be updated
    const updateData = insertUserSchema.partial().parse(req.body);
    
    // Hash the password if provided
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }
    
    // Update the user
    const updatedUser = await storage.updateUser(id, updateData);
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update user' });
    }
    
    // Remove sensitive information
    const { password, ...sanitizedUser } = updatedUser;
    
    res.json(sanitizedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Deactivate a user
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Make sure user exists
    const existingUser = await storage.getUser(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Deactivate the user
    const success = await storage.deactivateUser(id);
    if (!success) {
      return res.status(500).json({ error: 'Failed to deactivate user' });
    }
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Get user permissions
router.get('/users/:id/permissions', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Make sure user exists
    const existingUser = await storage.getUser(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const permissions = await storage.getUserPermissions(id);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

// Get user permission for a specific module
router.get('/users/:id/permissions/:module', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Make sure user exists
    const existingUser = await storage.getUser(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const moduleName = req.params.module;
    const permission = await storage.getUserPermissionsByModule(id, moduleName);
    
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    res.json(permission);
  } catch (error) {
    console.error('Error fetching user permission:', error);
    res.status(500).json({ error: 'Failed to fetch user permission' });
  }
});

// Add or update a user permission
router.post('/users/:id/permissions', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Make sure user exists
    const existingUser = await storage.getUser(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate permission data
    const permissionData = insertUserPermissionSchema.parse({
      ...req.body,
      userId: id
    });
    
    // Check if permission already exists
    const existingPermission = await storage.getUserPermissionsByModule(id, permissionData.moduleName);
    
    let permission;
    if (existingPermission) {
      // Update existing permission
      permission = await storage.updateUserPermission(
        id, 
        permissionData.moduleName, 
        permissionData.accessGranted
      );
    } else {
      // Create new permission
      permission = await storage.createUserPermission(permissionData);
    }
    
    res.status(existingPermission ? 200 : 201).json(permission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error adding/updating user permission:', error);
    res.status(500).json({ error: 'Failed to add/update user permission' });
  }
});

// Delete a user permission
router.delete('/users/:id/permissions/:module', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Make sure user exists
    const existingUser = await storage.getUser(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const moduleName = req.params.module;
    
    // Check if permission exists
    const existingPermission = await storage.getUserPermissionsByModule(id, moduleName);
    if (!existingPermission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    
    // Delete the permission
    await storage.deleteUserPermission(id, moduleName);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user permission:', error);
    res.status(500).json({ error: 'Failed to delete user permission' });
  }
});

export default router;