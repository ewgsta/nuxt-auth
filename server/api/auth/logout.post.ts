export default defineEventHandler(async (event) => {
  // Sadece çıkış yapıldığında cookie'yi temizle
  deleteCookie(event, 'auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  return { success: true, message: 'Logged out successfully' };
});