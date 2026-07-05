import { db } from '../../../server/db';
import { users } from '../../../server/db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { sendEmail } from '../../../server/utils/email';

const registerSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır.').max(30),
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  displayName: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Geçersiz veri', 
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
        statusMessage: 'Bu e-posta veya kullanıcı adı zaten kullanımda.' 
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
    
    const emailSubject = 'Nuxt Auth - E-posta Adresinizi Doğrulayın';
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
        <h2>Hoş Geldiniz, ${username}!</h2>
        <p>Kayıt olduğunuz için teşekkürler. Lütfen aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: #bb86fc; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">E-postamı Doğrula</a>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">Bu e-postayı siz talep etmediyseniz, görmezden gelebilirsiniz.</p>
      </div>
    `;
    
    await sendEmail(email, emailSubject, emailHtml);

    return { 
      success: true, 
      message: 'Kayıt başarılı. Lütfen e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.',
      user: newUser 
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusMessage: 'Sunucu hatası oluştu.'
    });
  }
});