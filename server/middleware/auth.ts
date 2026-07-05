import { verifyToken } from '../utils/jwt';

// Sadece giriş yapılmadan da erişilebilecek 'public' API yolları
// Artık daha modüler ve Passkey/2FA Login yollarını da kapsıyor
const publicAuthRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/2fa/verify-login', 
  '/api/auth/passkey/authentication-options',
  '/api/auth/passkey/verify-authentication'
];

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname;

  if (pathname.startsWith('/api')) {
    if (publicAuthRoutes.includes(pathname)) {
      return; 
    }

    const token = getCookie(event, 'auth_token');
    
    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized access. Session not found.'
      });
    }

    let decoded;
    try {
       decoded = verifyToken(token);
    } catch(err) {
       throw createError({
        statusCode: 401,
        message: 'Invalid or expired session.'
      });
    }
    
    if (!decoded) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired session.'
      });
    }

    event.context.user = {
      userId: decoded.id // requireUser in utils/auth expects userId
    };
  }
});