import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { requireUser } from '../../../utils/auth';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readBody(event);
  const { password } = body;

  if (!user.twoFactorEnabled) {
    throw createError({ statusCode: 400, statusMessage: '2FA is not enabled' });
  }

  if (!password) {
      throw createError({ statusCode: 400, statusMessage: 'Password is required to disable 2FA' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid password' });
  }

  await db.update(users).set({ twoFactorEnabled: false, twoFactorSecret: null }).where(eq(users.id, user.id));

  return { message: '2FA disabled successfully' };
});
