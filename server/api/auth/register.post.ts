import { db } from '../../db';
import { users, authTokens, securitySettings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendEmail } from '../../utils/email';

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).toLowerCase(),
  displayName: z.string().max(50).optional(),
  email: z.string().email(),
  password: z.string().min(6), // Password strength logic in frontend
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid data', data: parsed.error.format() });
    }

    const { username, displayName, email, password } = parsed.data;

    // Email Check
    const existingEmail = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existingEmail) {
      throw createError({ statusCode: 400, statusMessage: 'Email already exists.' });
    }

    // Username Check
    const existingUsername = await db.query.users.findFirst({ where: eq(users.username, username) });
    if (existingUsername) {
      throw createError({ statusCode: 400, statusMessage: 'Username already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString('hex');

    // Create User & Relations
    const [newUser] = await db.insert(users).values({
      username,
      displayName,
      email,
      password: hashedPassword,
    }).returning();

    await db.insert(authTokens).values({
        userId: newUser.id,
        verificationToken,
    });
    
    await db.insert(securitySettings).values({
        userId: newUser.id,
    });

    // Verification Email
    const reqHeaders = getRequestHeaders(event);
    const host = reqHeaders.host || 'localhost:3000';
    const baseUrl = process.env.URL || `http://${host}`;
    
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Nuxt Auth!</h2>
          <p>Please click the button below to verify your email address.</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #bb86fc; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">Or copy and paste this link into your browser: <br/>${verifyUrl}</p>
        </div>
      `;

    // sendEmail parameters are positional: sendEmail(to, subject, html, text?)
    await sendEmail(
      email,
      'Verify your email address - Nuxt Auth',
      htmlContent
    );

    return { success: true, message: 'Registration successful. Please verify your email.' };
  } catch (error: any) {
     if (error.statusCode) throw error;
     throw createError({ statusCode: 500, statusMessage: 'Registration error.' });
  }
});
