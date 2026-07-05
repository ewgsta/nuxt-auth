import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, gt, and } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const confirmUpdateSchema = z.object({
  type: z.enum(['password', 'email']),
  code: z.string().length(6, 'Code must be 6 digits.'),
  newCode: z.string().length(6).optional(), // E-posta değişimi için
  newPassword: z.string().min(6).optional()
});

export default defineEventHandler(async (event) => {
  const contextUser = event.context.user;
  if (!contextUser) {
    throw createError({ statusCode: 401, statusMessage: 'Session not found.' });
  }

  try {
    const body = await readBody(event);
    const parsed = confirmUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid data.' });
    }

    const { type, code, newCode, newPassword } = parsed.data;

    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, contextUser.id),
        gt(users.codeExpiresAt, new Date())
      )
    });

    if (!user) {
      throw createError({ statusCode: 400, statusMessage: 'Verification code is invalid or expired.' });
    }

    if (type === 'password') {
      if (user.updateCode !== code) {
        throw createError({ statusCode: 400, statusMessage: 'Verification code is incorrect.' });
      }

      if (!newPassword) {
        throw createError({ statusCode: 400, statusMessage: 'New password is required.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.update(users).set({
        password: hashedPassword,
        updateCode: null,
        codeExpiresAt: null
      }).where(eq(users.id, user.id));

      return { success: true, message: 'Your password has been successfully updated.' };
    }

    if (type === 'email') {
      if (user.updateCode !== code || user.updateCodeNew !== newCode) {
        throw createError({ statusCode: 400, statusMessage: 'One or both of the verification codes you entered are incorrect.' });
      }

      if (!user.pendingEmail) {
        throw createError({ statusCode: 400, statusMessage: 'No pending email update found.' });
      }

      await db.update(users).set({
        email: user.pendingEmail,
        pendingEmail: null,
        updateCode: null,
        updateCodeNew: null,
        codeExpiresAt: null
      }).where(eq(users.id, user.id));

      return { success: true, message: 'Your email address has been successfully updated.' };
    }

  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'Internal server error occurred.' });
  }
});