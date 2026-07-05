import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { db } from '../../../db';
import { passkeys, users } from '../../../db/schema';
import { eq, or } from 'drizzle-orm';

const rpID = process.env.URL ? new URL(process.env.URL).hostname : 'localhost';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { identifier } = body;

  let queryPasskeys: any[] = [];
  
  // If specific user login
  if (identifier) {
    const user = await db.query.users.findFirst({
        where: or(eq(users.email, identifier), eq(users.username, identifier))
    });
    if (user) {
        queryPasskeys = await db.select().from(passkeys).where(eq(passkeys.userId, user.id));
    } else {
        // Return default options if user not found to prevent user enumeration
        return generateAuthenticationOptions({ rpID, userVerification: 'preferred' });
    }
  }
  
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: queryPasskeys.map(passkey => ({
      id: passkey.credentialId,
      transports: passkey.transports as any,
    })),
  });

  // Temporarily store challenge in an HttpOnly cookie
  setCookie(event, 'passkey_authentication_challenge', options.challenge, {
    httpOnly: true,
    maxAge: 60 * 5, // 5 minutes
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return options;
});
