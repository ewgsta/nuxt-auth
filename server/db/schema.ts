import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  isActive: boolean('is_active').default(false),
  emailVerifiedAt: timestamp('email_verified_at'),
  verificationToken: text('verification_token'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires'),
  updateCode: text('update_code'), // Profil güncellemeleri için 6 haneli kod (Eski mail / Şifre onayı)
  updateCodeNew: text('update_code_new'), // Yeni mail için kod
  pendingEmail: text('pending_email'), // Bekleyen yeni e-posta adresi
  codeExpiresAt: timestamp('code_expires_at'), // Doğrulama kodları son kullanma tarihi
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
