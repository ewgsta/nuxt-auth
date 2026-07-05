import { authenticator } from 'otplib';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { requireUser } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readBody(event);
  const { code } = body;

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Verification code is required' });
  }

  if (!user.twoFactorSecret) {
    throw createError({ statusCode: 400, statusMessage: '2FA secret not found. Please generate first.' });
  }

  const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });

  if (!isValid) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid verification code' });
  }

  await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, user.id));

  return { message: '2FA enabled successfully' };
});
