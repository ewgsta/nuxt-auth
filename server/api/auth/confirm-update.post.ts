import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, gt, and } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const confirmUpdateSchema = z.object({
  type: z.enum(['password', 'email']),
  code: z.string().length(6, 'Kod 6 haneli olmalıdır.'),
  newCode: z.string().length(6).optional(), // E-posta değişimi için
  newPassword: z.string().min(6).optional()
});

export default defineEventHandler(async (event) => {
  const contextUser = event.context.user;
  if (!contextUser) {
    throw createError({ statusCode: 401, statusMessage: 'Oturum bulunamadı.' });
  }

  try {
    const body = await readBody(event);
    const parsed = confirmUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ statusCode: 400, statusMessage: 'Geçersiz veri.' });
    }

    const { type, code, newCode, newPassword } = parsed.data;

    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, contextUser.id),
        gt(users.codeExpiresAt, new Date())
      )
    });

    if (!user) {
      throw createError({ statusCode: 400, statusMessage: 'Doğrulama kodu geçersiz veya süresi dolmuş.' });
    }

    if (type === 'password') {
      if (user.updateCode !== code) {
        throw createError({ statusCode: 400, statusMessage: 'Doğrulama kodu yanlış.' });
      }

      if (!newPassword) {
        throw createError({ statusCode: 400, statusMessage: 'Yeni şifre gereklidir.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.update(users).set({
        password: hashedPassword,
        updateCode: null,
        codeExpiresAt: null
      }).where(eq(users.id, user.id));

      return { success: true, message: 'Şifreniz başarıyla güncellendi.' };
    }

    if (type === 'email') {
      if (user.updateCode !== code || user.updateCodeNew !== newCode) {
        throw createError({ statusCode: 400, statusMessage: 'Girdiğiniz doğrulama kodlarından biri veya ikisi yanlış.' });
      }

      if (!user.pendingEmail) {
        throw createError({ statusCode: 400, statusMessage: 'Bekleyen bir e-posta güncellemesi bulunamadı.' });
      }

      await db.update(users).set({
        email: user.pendingEmail,
        pendingEmail: null,
        updateCode: null,
        updateCodeNew: null,
        codeExpiresAt: null
      }).where(eq(users.id, user.id));

      return { success: true, message: 'E-posta adresiniz başarıyla güncellendi.' };
    }

  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'Sunucu hatası oluştu.' });
  }
});