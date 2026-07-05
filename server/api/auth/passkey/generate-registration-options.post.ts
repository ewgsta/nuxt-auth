import { generateRegistrationOptions } from '@simplewebauthn/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { users, passkeys } from '../../../db/schema';
import { requireUser } from '../../../utils/auth';

const rpName = 'Nuxt Auth App';
const rpID = process.env.URL ? new URL(process.env.URL).hostname : 'localhost';

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const userPasskeys = await db.select().from(passkeys).where(eq(passkeys.userId, user.id));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.email,
    attestationType: 'none',
    excludeCredentials: userPasskeys.map(passkey => ({
      id: passkey.credentialId,
      transports: passkey.transports as any,
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  // Temporarily store challenge in an HttpOnly cookie to verify later
  setCookie(event, 'passkey_registration_challenge', options.challenge, {
    httpOnly: true,
    maxAge: 60 * 5, // 5 minutes
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return options;
});
