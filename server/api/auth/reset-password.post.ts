import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, gt, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.')
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Invalid or missing data.',
        data: parsed.error.format()
      });
    }

    const { token, newPassword } = parsed.data;

    const user = await db.query.users.findFirst({
      where: and(
        eq(users.resetPasswordToken, token),
        gt(users.resetPasswordExpires, new Date()) // Süresi geçmemiş
      )
    });

    if (!user) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Invalid or expired password reset link.' 
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Yeni şifreyi kaydet ve token'ı temizle
    await db.update(users)
      .set({ 
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      })
      .where(eq(users.id, user.id));

    return { 
      success: true, 
      message: 'Your password has been successfully reset. You can now log in with your new password.'
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error occurred.'
    });
  }
});