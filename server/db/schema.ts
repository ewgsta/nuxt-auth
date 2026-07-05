import { pgTable, text, timestamp, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';

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
  updateCode: text('update_code'), // Profil güncellemeleri için 6 haneli kod (Eski mail / Password onayı)
  updateCodeNew: text('update_code_new'), // Yeni mail için kod
  pendingEmail: text('pending_email'), // Bekleyen yeni e-posta adresi
  codeExpiresAt: timestamp('code_expires_at'), // Doğrulama kodları son kullanma tarihi
  
  // 2FA Fields
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const passkeys = pgTable('passkeys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  webauthnUserId: text('webauthn_user_id').notNull(),
  credentialId: text('credential_id').notNull().unique(),
  credentialPublicKey: text('credential_public_key').notNull(),
  counter: text('counter').notNull().default('0'), // bigint is precision-lossy in JS, storing as text/number depending on ORM preference, generic string representation of bigint here. Let's stick with string for safety or bigInt. Actually Drizzle has bigint. The browser sends numbers. Let's use text to avoid BigInt parsing issues, simplewebauthn uses number but can get large.
  transports: jsonb('transports'), // AuthenticatorTransportFuture[]
  deviceName: text('device_name').default('Auth Device'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at').defaultNow(),
});

