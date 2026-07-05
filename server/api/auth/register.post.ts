import { db } from '../../../server/db';
import { users } from '../../../server/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendEmail } from '../../../server/utils/email';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.').max(30),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  displayName: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Invalid data', 
        data: parsed.error.format() 
      });
    }

    const { username, email, password, displayName } = parsed.data;

    const existingUser = await db.query.users.findFirst({
      where: or(eq(users.email, email), eq(users.username, username))
    });

    if (existingUser) {
      throw createError({ 
        statusCode: 409, 
        statusMessage: 'This email or username is already in use.' 
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Doğrulama token'ı oluşturma
    const verificationToken = randomBytes(32).toString('hex');

    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || null,
      verificationToken,
      isActive: false // E-posta doğrulanana kadar pasif
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName
    });

    // Doğrulama e-postası gönderme işlemi (EmailThing)
    // Sitenizin Base URL'sini kendi domaininize göre ayarlamalısınız (.env den alabilirsiniz)
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    
    const emailSubject = 'Nuxt Auth - Verify Your Email Address';
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2>Welcome, ${username}!</h2>
        <p>Thanks for signing up. Please verify your email address by clicking the button below.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: #bb86fc; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify My Email</a>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">If you didn't request this email, you can safely ignore it.</p>
      </div>
    `;
    
    await sendEmail(email, emailSubject, emailHtml);

    return { 
      success: true, 
      message: 'Registration successful. Please click the verification link sent to your email.',
      user: newUser 
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error occurred.'
    });
  }
});