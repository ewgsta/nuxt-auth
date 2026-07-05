import { db } from '../../../db';
import { passkeys } from '../../../db/schema';
import { and, eq } from 'drizzle-orm';
import { requireUser } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const passkeyId = getRouterParam(event, 'id');

  if (!passkeyId) {
    throw createError({ statusCode: 400, statusMessage: 'Passkey ID is required' });
  }

  // Ensure the passkey belongs to the current user
  const deleted = await db.delete(passkeys)
    .where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, user.id)))
    .returning({ id: passkeys.id });

  if (!deleted.length) {
    throw createError({ statusCode: 404, statusMessage: 'Passkey not found' });
  }

  return { success: true, message: 'Passkey removed successfully' };
});
