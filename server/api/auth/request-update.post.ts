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
  currentPassword: z.string().min(1, 'Current password is required.')
});

export default defineEventHandler(async (event) => {
  const contextUser = event.context.user;
  if (!contextUser) {
    throw createError({ statusCode: 401, statusMessage: 'Session not found.' });
  }

  try {
    const body = await readBody(event);
    const parsed = requestUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid request.' });
    }

    const { type, newEmail, currentPassword } = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.id, contextUser.id)
    });

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found.' });
    }

    // Her iki işlem için de mevcut şifreyi doğrula (Güvenlik)
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw createError({ statusCode: 401, statusMessage: 'Your current password is incorrect.' });
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
          <h2>Password Update Verification Code</h2>
          <p>Use the 6-digit code below to update your password:</p>
          <h1 style="letter-spacing: 5px; color: #bb86fc;">${updateCode}</h1>
          <p style="font-size: 12px; color: #888;">This code is valid for 15 minutes.</p>
        </div>
      `;
      sendEmail(user.email, 'Nuxt Auth - Password Update Code', mailBody).catch(console.error);

      return { success: true, message: 'A verification code has been sent to your current email address.' };
    } 
    
    if (type === 'email') {
      if (!newEmail || newEmail === user.email) {
        throw createError({ statusCode: 400, statusMessage: 'You must enter a different and valid new email address.' });
      }

      // Yeni e-postanın kullanımda olup olmadığını kontrol et
      const emailExists = await db.query.users.findFirst({ where: eq(users.email, newEmail) });
      if (emailExists) {
        throw createError({ statusCode: 409, statusMessage: 'This email address is already in use.' });
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
          <h2>Email Update (Current Address)</h2>
          <p>Your current email verification code to update your email address:</p>
          <h1 style="letter-spacing: 5px; color: #bb86fc;">${updateCode}</h1>
        </div>
      `;
      
      const newMailBody = `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>Email Update (New Address)</h2>
          <p>Your verification code to confirm your new email address:</p>
          <h1 style="letter-spacing: 5px; color: #03dac6;">${updateCodeNew}</h1>
        </div>
      `;

      sendEmail(user.email, 'Nuxt Auth - Email Update (Old Email)', oldMailBody).catch(console.error);
      sendEmail(newEmail, 'Nuxt Auth - Email Update (New Email)', newMailBody).catch(console.error);

      return { success: true, message: 'Verification codes have been sent to both your current and new email addresses.' };
    }
    
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: 'Internal server error occurred.' });
  }
});