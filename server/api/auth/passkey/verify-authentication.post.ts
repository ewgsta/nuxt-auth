import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { db } from '../../../db';
import { passkeys, users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '../../../utils/jwt';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

const rpID = process.env.URL ? new URL(process.env.URL).hostname : 'localhost';
const origin = process.env.URL || `http://localhost:3000`;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  const expectedChallenge = getCookie(event, 'passkey_authentication_challenge');
  if (!expectedChallenge) {
    throw createError({ statusCode: 400, statusMessage: 'Session expired. Please try again.' });
  }

  const authenticator = await db.query.passkeys.findFirst({
    where: eq(passkeys.credentialId, body.id)
  });

  if (!authenticator) {
    throw createError({ statusCode: 404, statusMessage: 'Authenticator not registered' });
  }

  const user = await db.query.users.findFirst({
      where: eq(users.id, authenticator.userId)
  });

  if (!user || !user.isActive) {
      throw createError({ statusCode: 403, statusMessage: 'Account is disabled or not verified.' });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      
      // v13 Update: Expected argument is named "credential", NOT "authenticator" anymore!
      credential: {
        id: isoBase64URL.toBuffer(authenticator.credentialId),
        publicKey: isoBase64URL.toBuffer(authenticator.credentialPublicKey),
        counter: Number(authenticator.counter) || 0,
        transports: authenticator.transports as any,
      },
    });
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  const { verified, authenticationInfo } = verification;

  if (verified && authenticationInfo) {
    // Update counter
    await db.update(passkeys)
      .set({ 
          counter: authenticationInfo.newCounter.toString(),
          lastUsedAt: new Date()
      })
      .where(eq(passkeys.id, authenticator.id));

    // Sign in user
    const token = signToken({ id: user.id, username: user.username });
    
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    setCookie(event, 'passkey_authentication_challenge', '', { maxAge: 0 });

    return { 
        success: true,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            displayName: user.displayName
        }
    };
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Passkey verification failed' });
  }
});
