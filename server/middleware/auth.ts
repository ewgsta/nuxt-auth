import { verifyToken } from '../utils/jwt';

// Sadece giriş yapılmadan da erişilebilecek 'public' API yolları
const publicAuthRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  const pathname = url.pathname;

  // Eğer bu bir API isteğiyse
  if (pathname.startsWith('/api')) {
    // Eğer herkese açık auth yollarından biriyse, JWT aramaya gerek yok.
    if (publicAuthRoutes.includes(pathname)) {
      return; // Middleware'i atla
    }

    // Geri kalan tüm API yolları (/api/auth/me, /api/auth/request-update vb. dahil) korumalıdır
    const token = getCookie(event, 'auth_token');
    
    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Yetkisiz erişim. Oturum bulunamadı.'
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      throw createError({
        statusCode: 401,
        message: 'Geçersiz veya süresi dolmuş oturum.'
      });
    }

    // Doğrulanmış kullanıcı bilgisini request context'ine ekle
    event.context.user = decoded;
  }
});