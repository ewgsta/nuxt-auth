import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { sendEmail } from '../../utils/email';

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const requestUpdateSchema = z.object({
  type: z.enum(['password', 'email']),
  newEmail: z.string().email().optional(),
  currentPassword: z.string().min(1, 'Mevcut şifre gereklidir.')
});

export default defineEventHandler(async (event) => {
  const contextUser = event.context.user;
  if (!contextUser) {
    throw createError({ statusCode: 401, statusMessage: 'Oturum bulunamadı.' });
  }

  try {
    const body = await readBody(event);
    const parsed = requestUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ statusCode: 400, statusMessage: 'Geçersiz istek.' });
    }

    const { type, newEmail, currentPassword } = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.id, contextUser.id)
    });

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'Kullanıcı bulunamadı.' });
    }

    // Her iki işlem için de mevcut şifreyi doğrula (Güvenlik)
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw createError({ statusCode: 401, statusMessage: 'Mevcut şifreniz yanlış.' });
    }

    const updateCode = generateCode();
    const expireDate = new Date();
    expireDate.setMinutes(expireDate.getMinutes() + 15); // 15 dakika geçerli

    if (type === 'password') {
      // Sadece eski maile kod gidecek
      await db.update(users).set({
        updateCode,
        codeExpiresAt: expireDate
      }).where(eq(users.id, user.id));

      const mailBody = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; text-align: center;">
          <h2>Şifre Güncelleme Doğrulama Kodu</h2>
          <p>Şifrenizi güncellemek için aşağıdaki 6 haneli kodu kullanın:</p>
          <h1 style="letter-spacing: 5px; color: #bb86fc;">${updateCode}</h1>
          <p style="font-size: 12px; color: #888;">Bu kod 15 dakika geçerlidir.</p>
        </div>
      `;
      sendEmail(user.email, 'Nuxt Auth - Şifre Değiştirme Kodu', mailBody).catch(console.error);

      return { success: true, message: 'Doğrulama kodu mevcut e-posta adresinize gönderildi.' };
    } 
    
    if (type === 'email') {
      if (!newEmail || newEmail === user.email) {
        throw createError({ statusCode: 400, statusMessage: 'Farklı ve geçerli bir yeni e-posta girmelisiniz.' });
      }

      // Yeni e-postanın kullanımda olup olmadığını kontrol et
      const emailExists = await db.query.users.findFirst({ where: eq(users.email, newEmail) });
      if (emailExists) {
        throw createError({ statusCode: 409, statusMessage: 'Bu e-posta adresi zaten kullanımda.' });
      }

      const updateCodeNew = generateCode();
      
      await db.update(users).set({
        updateCode,
        updateCodeNew,
        pendingEmail: newEmail,
        codeExpiresAt: expireDate
      }).where(eq(users.id, user.id));

      const oldMailBody = `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>E-posta Güncelleme (Mevcut Adres)</h2>
          <p>E-posta adresinizi güncellemek için mevcut e-posta doğrulama kodunuz:</p>
          <h1 style="letter-spacing: 5px; color: #bb86fc;">${updateCode}</h1>
        </div>
      `;
      
      const newMailBody = `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>E-posta Güncelleme (Yeni Adres)</h2>
          <p>Yeni e-posta adresinizi doğrulamak için kodunuz:</p>
          <h1 style="letter-spacing: 5px; color: #03dac6;">${updateCodeNew}</h1>
        </div>
      `;

      sendEmail(user.email, 'Nuxt Auth - E-posta Değiştirme (Eski Mail)', oldMailBody).catch(console.error);
      sendEmail(newEmail, 'Nuxt Auth - E-posta Değiştirme (Yeni Mail)', newMailBody).catch(console.error);

      return { success: true, message: 'Doğrulama kodları hem mevcut hem de yeni e-posta adresinize gönderildi.' };
    }
    
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'Sunucu hatası oluştu.' });
  }
});