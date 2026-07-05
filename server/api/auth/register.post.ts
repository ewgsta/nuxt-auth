import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signToken } from '~/server/utils/jwt';

const registerSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır.').max(30),
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  displayName: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Geçersiz veri', 
        data: parsed.error.format() 
      });
    }

    const { username, email, password, displayName } = parsed.data;

    // E-posta veya kullanıcı adı kontrolü
    const existingUser = await db.query.users.findFirst({
      where: or(eq(users.email, email), eq(users.username, username))
    });

    if (existingUser) {
      throw createError({ 
        statusCode: 409, 
        statusMessage: 'Bu e-posta veya kullanıcı adı zaten kullanımda.' 
      });
    }

    // Şifre hash'leme
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı veritabanına ekleme
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || null,
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName
    });

    // JWT Token oluşturma
    const token = signToken({ id: newUser.id, username: newUser.username });
    
    // Token'ı HTTP-Only cookie olarak ayarlama (Güvenlik için)
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: '/'
    });

    return { success: true, user: newUser };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Sunucu hatası oluştu.'
    });
  }
});