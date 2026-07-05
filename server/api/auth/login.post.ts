import { db } from '../../../server/db';
import { users } from '../../../server/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signToken } from '../../../server/utils/jwt';

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

    // Kullanıcıyı E-posta veya Kullanıcı adına göre bul
    const user = await db.query.users.findFirst({
      where: or(eq(users.email, identifier), eq(users.username, identifier))
    });

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Invalid credentials.' 
      });
    }

    // Passwordyi doğrula
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Invalid credentials.' 
      });
    }

    if (!user.isActive) {
      throw createError({ 
        statusCode: 403, 
        statusMessage: 'Please verify your account (email address) before logging in.' 
      });
    }

    // JWT Token oluşturma
    const token = signToken({ id: user.id, username: user.username });
    
    // Token'ı HTTP-Only cookie olarak ayarlama
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
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
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error occurred.'
    });
  }
});