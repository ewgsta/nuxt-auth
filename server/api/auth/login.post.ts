import { db } from '../../db';
import { users, securitySettings } from '../../db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signToken } from '../../utils/jwt';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Invalid data', 
        data: parsed.error.format() 
      });
    }

    const { identifier, password } = parsed.data;

    // Fetch user and relations
    const user = await db.query.users.findFirst({
      where: or(eq(users.email, identifier), eq(users.username, identifier)),
      with: { securitySettings: true }
    });

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      throw createError({ statusCode: 403, statusMessage: 'Please verify your account (email address) before logging in.' });
    }

    // Checking relational 2FA
    if (user.securitySettings?.twoFactorEnabled) {
      const tempToken = signToken({ pendingUserId: user.id }, '15m');
      
      setCookie(event, 'auth_pending_2fa', tempToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15,
        path: '/'
      });

      return {
        success: true,
        require2fa: true,
        message: '2FA verification required'
      };
    }

    // Normal Login
    const token = signToken({ id: user.id, username: user.username });
    
    // Update last login
    await db.update(securitySettings).set({ lastLoginAt: new Date() }).where(eq(securitySettings.userId, user.id));

    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return { 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName
      }
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'Internal server error occurred.' });
  }
});
