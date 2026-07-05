import { authenticator } from 'otplib';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken, signToken } from '../../../utils/jwt';

export default defineEventHandler(async (event) => {
  const pendingToken = getCookie(event, 'auth_pending_2fa');
  const body = await readBody(event);
  const { code } = body;

  if (!pendingToken) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired. Please log in again.' });
  }

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Verification code is required' });
  }

  let decoded;
  try {
    decoded = verifyToken(pendingToken);
  } catch (err) {
    throw createError({ statusCode: 401, statusMessage: 'Session expired. Please log in again.' });
  }

  if (!decoded || !decoded.pendingUserId) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid session.' });
  }

  const [user] = await db.select().from(users).where(eq(users.id, decoded.pendingUserId)).limit(1);

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw createError({ statusCode: 400, statusMessage: '2FA is not enabled for this user.' });
  }

  const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });

  if (!isValid) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid verification code.' });
  }

  // Generate actual auth token
  const token = signToken({ id: user.id, username: user.username });
    
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });

  // Clear pending cookie
  setCookie(event, 'auth_pending_2fa', '', { maxAge: 0, path: '/' });

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName
    }
  };
});
