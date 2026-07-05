import { db } from '../../db';
import { users, authTokens } from '../../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    return sendRedirect(event, '/login?error=InvalidToken');
  }

  try {
    const tokenRecord = await db.query.authTokens.findFirst({
      where: eq(authTokens.verificationToken, token)
    });

    if (!tokenRecord) {
      return sendRedirect(event, '/login?error=InvalidToken');
    }

    // Verify user
    await db.update(users)
      .set({ 
        isActive: true, 
        emailVerifiedAt: new Date() 
      })
      .where(eq(users.id, tokenRecord.userId));

    // Clear verification token
    await db.update(authTokens)
      .set({
        verificationToken: null
      })
      .where(eq(authTokens.id, tokenRecord.id));

    return sendRedirect(event, '/login?verified=true');
  } catch (error) {
    return sendRedirect(event, '/login?error=ServerError');
  }
});
