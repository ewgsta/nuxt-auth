import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    return sendRedirect(event, '/login?error=invalid_token');
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.verificationToken, token)
    });

    if (!user) {
      return sendRedirect(event, '/login?error=token_not_found');
    }

    // Kullanıcıyı aktif hale getir
    await db.update(users)
      .set({ 
        isActive: true, 
        emailVerifiedAt: new Date(),
        verificationToken: null // Token'ı tek kullanımlık yapmak için sıfırlıyoruz
      })
      .where(eq(users.id, user.id));

    // Doğrulama başarılı, giriş sayfasına yönlendir
    return sendRedirect(event, '/login?verified=true');
  } catch (error) {
    console.error('Email verification error:', error);
    return sendRedirect(event, '/login?error=server_error');
  }
});