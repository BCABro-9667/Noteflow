import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb, seedDemoUser, persistDb } from '../db.js';
import { hashPassword, comparePassword, signToken, requireAuth, AuthenticatedRequest } from '../auth.js';
import { memoryCache } from '../cache.js';
import { syncUserToMongo } from '../mongo.js';

export const authRouter = Router();

// Register new user
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required.' });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = await getDb();

    // Check duplicate
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const userId = crypto.randomUUID();
    const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

    await db.query(
      `INSERT INTO users (id, name, email, password, avatar, token_version)
       VALUES ($1, $2, $3, $4, $5, 1)`,
      [userId, name.trim(), normalizedEmail, hashedPassword, defaultAvatar]
    );

    const token = signToken({
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      tokenVersion: 1,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const newUserObj = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      avatar: defaultAvatar,
      hasPin: false,
    };

    persistDb(db);
    syncUserToMongo(newUserObj);

    res.status(201).json({
      user: newUserObj,
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = await getDb();

    const result = await db.query<{
      id: string;
      name: string;
      email: string;
      password: string;
      avatar: string;
      token_version: number;
    }>('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];
    const passwordValid = await comparePassword(password, user.password);
    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.token_version,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        hasPin: Boolean((user as any).pin_hash),
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// 1-Click Demo Login
authRouter.post('/demo-login', async (_req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    const demoEmail = 'alex.demo@noteflow.app';

    let result = await db.query<{
      id: string;
      name: string;
      email: string;
      avatar: string;
      token_version: number;
      pin_hash?: string;
    }>('SELECT id, name, email, avatar, token_version, pin_hash FROM users WHERE email = $1', [demoEmail]);

    let demoUser = result.rows[0];

    if (!demoUser) {
      await seedDemoUser(db);
      result = await db.query<{
        id: string;
        name: string;
        email: string;
        avatar: string;
        token_version: number;
        pin_hash?: string;
      }>('SELECT id, name, email, avatar, token_version, pin_hash FROM users WHERE email = $1', [demoEmail]);
      demoUser = result.rows[0];
    }

    if (!demoUser) {
      res.status(500).json({ error: 'Demo user could not be initialized.' });
      return;
    }

    const token = signToken({
      id: demoUser.id,
      email: demoEmail,
      name: demoUser.name,
      tokenVersion: demoUser.token_version,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoEmail,
        avatar: demoUser.avatar,
        hasPin: Boolean(demoUser.pin_hash),
      },
      token,
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: err.message || 'Failed to log in to demo account.' });
  }
});

// Current authenticated user
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cacheKey = `user:me:${userId}`;
    const cachedUser = memoryCache.get<any>(cacheKey);
    if (cachedUser) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ user: cachedUser });
      return;
    }

    const db = await getDb();
    const result = await db.query<{
      id: string;
      name: string;
      email: string;
      avatar: string;
      created_at: string;
      has_pin: boolean;
    }>('SELECT id, name, email, avatar, created_at, (pin_hash IS NOT NULL) AS has_pin FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const row = result.rows[0];
    const userObj = {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      createdAt: row.created_at,
      hasPin: Boolean(row.has_pin),
    };

    memoryCache.set(cacheKey, userObj, 120);
    res.setHeader('X-Cache', 'MISS');
    res.json({ user: userObj });
  } catch (err) {
    console.error('Get /me error:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// Forgot Password
authRouter.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const db = await getDb();
    const user = await db.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);

    if (user.rows.length === 0) {
      // Don't reveal user existence for privacy
      res.json({
        message: 'If an account exists with this email, password reset instructions have been generated.',
      });
      return;
    }

    // 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 3600000; // 1 hour

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetCode, expires, user.rows[0].id]
    );

    res.json({
      message: 'Password reset code generated.',
      resetCode, // Returned for instant testing and accessibility in UI
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
});

// Reset Password
authRouter.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, reset code, and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const db = await getDb();
    const result = await db.query<{
      id: string;
      reset_token: string;
      reset_token_expires: number;
    }>('SELECT id, reset_token, reset_token_expires FROM users WHERE email = $1', [email.trim().toLowerCase()]);

    if (result.rows.length === 0) {
      res.status(400).json({ error: 'Invalid reset code or email.' });
      return;
    }

    const user = result.rows[0];
    if (user.reset_token !== code.trim()) {
      res.status(400).json({ error: 'Invalid reset code.' });
      return;
    }

    if (Number(user.reset_token_expires) < Date.now()) {
      res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.query(
      `UPDATE users
       SET password = $1, reset_token = NULL, reset_token_expires = NULL, token_version = token_version + 1, updated_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Update Profile & Password
authRouter.post('/update-profile', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar, currentPassword, newPassword } = req.body;
    const userId = req.user!.id;
    const db = await getDb();

    if (name) {
      await db.query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2', [name.trim(), userId]);
    }

    if (avatar) {
      await db.query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2', [avatar.trim(), userId]);
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: 'Current password is required to set a new password.' });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters.' });
        return;
      }

      const user = await db.query<{ password: string }>('SELECT password FROM users WHERE id = $1', [userId]);
      const valid = await comparePassword(currentPassword, user.rows[0].password);
      if (!valid) {
        res.status(400).json({ error: 'Current password is incorrect.' });
        return;
      }

      const hashed = await hashPassword(newPassword);
      await db.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, userId]);
    }

    const updated = await db.query<{
      id: string;
      name: string;
      email: string;
      avatar: string;
      has_pin: boolean;
    }>('SELECT id, name, email, avatar, (pin_hash IS NOT NULL) AS has_pin FROM users WHERE id = $1', [userId]);

    const updatedUser = {
      id: updated.rows[0].id,
      name: updated.rows[0].name,
      email: updated.rows[0].email,
      avatar: updated.rows[0].avatar,
      hasPin: Boolean(updated.rows[0].has_pin),
    };

    persistDb(db);
    memoryCache.del(`user:me:${userId}`);
    syncUserToMongo(updatedUser);

    res.json({ user: updatedUser, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// PIN Security Management Routes
// Check PIN Status
authRouter.get('/pin/status', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const db = await getDb();
    const result = await db.query<{ has_pin: boolean }>(
      'SELECT (pin_hash IS NOT NULL) AS has_pin FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ hasPin: Boolean(result.rows[0].has_pin) });
  } catch (err: any) {
    console.error('PIN status error:', err);
    res.status(500).json({ error: 'Failed to get PIN status' });
  }
});

// Setup 4-digit PIN
authRouter.post('/pin/setup', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { pin } = req.body;

    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
      return;
    }

    const db = await getDb();
    const hashedPin = await hashPassword(pin);

    await db.query('UPDATE users SET pin_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPin, userId]);

    persistDb(db);
    memoryCache.del(`user:me:${userId}`);

    res.json({ success: true, hasPin: true, message: 'Note PIN created successfully.' });
  } catch (err: any) {
    console.error('Setup PIN error:', err);
    res.status(500).json({ error: 'Failed to set up PIN' });
  }
});

// Verify 4-digit PIN
authRouter.post('/pin/verify', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { pin } = req.body;

    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      res.status(400).json({ valid: false, error: 'PIN must be exactly 4 digits.' });
      return;
    }

    const db = await getDb();
    const result = await db.query<{ pin_hash: string | null }>('SELECT pin_hash FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0 || !result.rows[0].pin_hash) {
      res.status(400).json({ valid: false, error: 'No PIN is set for this account.' });
      return;
    }

    const isValid = await comparePassword(pin, result.rows[0].pin_hash);
    if (!isValid) {
      res.status(400).json({ valid: false, error: 'Incorrect PIN. Please try again.' });
      return;
    }

    res.json({ valid: true, message: 'PIN verified successfully.' });
  } catch (err: any) {
    console.error('Verify PIN error:', err);
    res.status(500).json({ valid: false, error: 'Failed to verify PIN' });
  }
});

// Change 4-digit PIN
authRouter.post('/pin/change', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPin, newPin } = req.body;

    if (!currentPin || typeof currentPin !== 'string' || !/^\d{4}$/.test(currentPin)) {
      res.status(400).json({ error: 'Current PIN must be 4 digits.' });
      return;
    }

    if (!newPin || typeof newPin !== 'string' || !/^\d{4}$/.test(newPin)) {
      res.status(400).json({ error: 'New PIN must be exactly 4 digits.' });
      return;
    }

    const db = await getDb();
    const result = await db.query<{ pin_hash: string | null }>('SELECT pin_hash FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0 || !result.rows[0].pin_hash) {
      res.status(400).json({ error: 'No PIN is currently configured.' });
      return;
    }

    const isCurrentValid = await comparePassword(currentPin, result.rows[0].pin_hash);
    if (!isCurrentValid) {
      res.status(400).json({ error: 'Current PIN is incorrect.' });
      return;
    }

    const newHashedPin = await hashPassword(newPin);
    await db.query('UPDATE users SET pin_hash = $1, updated_at = NOW() WHERE id = $2', [newHashedPin, userId]);

    persistDb(db);
    memoryCache.del(`user:me:${userId}`);

    res.json({ success: true, hasPin: true, message: 'Note PIN changed successfully.' });
  } catch (err: any) {
    console.error('Change PIN error:', err);
    res.status(500).json({ error: 'Failed to change PIN' });
  }
});

// Remove 4-digit PIN
authRouter.post('/pin/remove', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { currentPin } = req.body;

    if (!currentPin || typeof currentPin !== 'string' || !/^\d{4}$/.test(currentPin)) {
      res.status(400).json({ error: 'Current PIN must be 4 digits.' });
      return;
    }

    const db = await getDb();
    const result = await db.query<{ pin_hash: string | null }>('SELECT pin_hash FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0 || !result.rows[0].pin_hash) {
      res.status(400).json({ error: 'No PIN is configured.' });
      return;
    }

    const isCurrentValid = await comparePassword(currentPin, result.rows[0].pin_hash);
    if (!isCurrentValid) {
      res.status(400).json({ error: 'Current PIN is incorrect.' });
      return;
    }

    await db.query('UPDATE users SET pin_hash = NULL, updated_at = NOW() WHERE id = $1', [userId]);

    persistDb(db);
    memoryCache.del(`user:me:${userId}`);

    res.json({ success: true, hasPin: false, message: 'Note PIN removed successfully.' });
  } catch (err: any) {
    console.error('Remove PIN error:', err);
    res.status(500).json({ error: 'Failed to remove PIN' });
  }
});

// Logout from all sessions
authRouter.post('/logout-all', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    await db.query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [req.user!.id]);
    res.clearCookie('token');
    res.json({ message: 'Logged out from all sessions.' });
  } catch (err) {
    console.error('Logout-all error:', err);
    res.status(500).json({ error: 'Failed to invalidate all sessions.' });
  }
});

// Logout
authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});
