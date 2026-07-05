import { H3Event } from 'h3';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const requireUser = async (event: H3Event) => {
  const userContext = event.context.user;
  
  if (!userContext || !userContext.userId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }

  const [user] = await db.select().from(users).where(eq(users.id, userContext.userId)).limit(1);

  if (!user) {
    throw createError({ statusCode: 401, message: 'User not found' });
  }

  return user;
};
