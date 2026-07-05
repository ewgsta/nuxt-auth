import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { db } from '../../../db';
import { passkeys } from '../../../db/schema';
import { requireUser } from '../../../utils/auth';

const rpName = 'Nuxt Auth App';
const rpID = process.env.URL ? new URL(process.env.URL).hostname : 'localhost';
const origin = process.env.URL || `http://localhost:3000`;

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readBody(event);
  
  const expectedChallenge = getCookie(event, 'passkey_registration_challenge');
  if (!expectedChallenge) {
    throw createError({ statusCode: 400, statusMessage: 'Challenge expired or not found' });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    // TODO: Consider user provided distinct device names.
    await db.insert(passkeys).values({
      userId: user.id,
      webauthnUserId: user.id,
      credentialId: Buffer.from(credentialID).toString('base64url'),
      credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      counter: counter.toString(),
      transports: body.response.transports,
      deviceName: 'My Authenticator',
    });

    // Clear challenge cookie
    setCookie(event, 'passkey_registration_challenge', '', { maxAge: 0 });

    return { verified: true };
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Passkey verification failed' });
  }
});
