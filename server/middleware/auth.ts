import { verifyToken } from '../utils/jwt';

export default defineEventHandler((event) => {
  // Sadece /api ile başlayan fakat /api/auth altında OMAYAN korumalı rotalar için kontrol
  const url = getRequestURL(event);
  
  if (url.pathname.startsWith('/api') && !url.pathname.startsWith('/api/auth')) {
    const token = getCookie(event, 'auth_token');
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Yetkisiz erişim. Oturum bulunamadı.'
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Geçersiz veya süresi dolmuş oturum.'
      });
    }

    // Doğrulanmış kullanıcı bilgisini request context'ine ekle (diğer API'lerde kullanabilmek için)
    event.context.user = decoded;
  }
});