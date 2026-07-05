import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { securitySettings } from '../../../db/schema';
import { requireUser } from '../../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  if (user.twoFactorEnabled) {
    throw createError({ statusCode: 400, statusMessage: '2FA is already enabled' });
  }

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, 'Nuxt Auth App', secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  await db.update(securitySettings)
    .set({ twoFactorSecret: secret })
    .where(eq(securitySettings.userId, user.id));

  return {
    secret,
    qrCodeDataUrl,
  };
});
