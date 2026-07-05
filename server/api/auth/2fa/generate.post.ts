import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { requireUser } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  if (user.twoFactorEnabled) {
    throw createError({ statusCode: 400, statusMessage: '2FA is already enabled' });
  }

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, 'Nuxt Auth App', secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Veritabanına geçici olarak secret'ı kaydediyoruz ama henüz aktif değil (twoFactorEnabled = false)
  await db.update(users).set({ twoFactorSecret: secret }).where(eq(users.id, user.id));

  return {
    secret,
    qrCodeDataUrl,
  };
});
