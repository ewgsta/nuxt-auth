import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  // auth middleware'den gelen user context
  const contextUser = event.context.user;

  if (!contextUser || !contextUser.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Kullanıcı doğrulanamadı.'
    });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, contextUser.id),
      columns: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Kullanıcı bulunamadı.'
      });
    }

    return {
      success: true,
      user
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Sunucu hatası oluştu.'
    });
  }
});