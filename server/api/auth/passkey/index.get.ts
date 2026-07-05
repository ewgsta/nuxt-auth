import { db } from '../../../db';
import { passkeys } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const userPasskeys = await db.query.passkeys.findMany({
    where: eq(passkeys.userId, user.id),
    columns: {
      id: true,
      deviceName: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: (passkeys, { desc }) => [desc(passkeys.createdAt)]
  });

  return { passkeys: userPasskeys };
});
