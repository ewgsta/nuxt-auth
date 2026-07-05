import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendEmail } from '../../utils/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Geçersiz veri', 
      });
    }

    const { email } = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    // Kullanıcı varsa veya yoksa da GÜVENLİK gereği (üstü kapalı) aynı mesajı döndürüyoruz.
    if (user) {
      // Şifre sıfırlama tokeni oluştur (1 saat geçerli)
      const resetToken = randomBytes(32).toString('hex');
      const expireDate = new Date();
      expireDate.setHours(expireDate.getHours() + 1);

      await db.update(users)
        .set({ 
          resetPasswordToken: resetToken,
          resetPasswordExpires: expireDate
        })
        .where(eq(users.id, user.id));

      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
      
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
          <h2>Şifre Sıfırlama Talebi</h2>
          <p>Hesabınız için şifre sıfırlama talebinde bulunuldu. Eğer bu işlemi siz yapmadıysanız lütfen bu e-postayı görmezden gelin.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: #bb86fc; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">Şifremi Sıfırla</a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">Bu bağlantı 1 saat boyunca geçerlidir.</p>
        </div>
      `;
      
      // Async mail at, ama sonucunu bekletip api yanıtını geciktirme
      sendEmail(email, 'Nuxt Auth - Şifre Sıfırlama Talebi', emailHtml).catch(console.error);
    }

    // Kullanıcı var mı yok mu ifşa etmemek için generic mesaj.
    return { 
      success: true, 
      message: 'Eğer sistemimizde bu e-posta adresiyle kayıtlı bir hesap bulunuyorsa, şifre sıfırlama bağlantısı gönderilmiştir.'
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Sunucu hatası oluştu.'
    });
  }
});