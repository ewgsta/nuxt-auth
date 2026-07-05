import { H3Event } from 'h3';
import { db } from '../db';
import { users, securitySettings } from '../db/schema';
import { eq } from 'drizzle-orm';

export const requireUser = async (event: H3Event) => {
  const userContext = event.context.user;
  
  if (!userContext || !userContext.userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userContext.userId),
    with: {
        securitySettings: true
    }
  });

  if (!user) {
    throw createError({ statusCode: 401, message: 'User not found' });
  }

  // Flatten the fields for easier backwards compatibility mapping across old usages
  return {
      ...user,
      twoFactorEnabled: user.securitySettings?.twoFactorEnabled || false,
      twoFactorSecret: user.securitySettings?.twoFactorSecret || null,
  };
};
