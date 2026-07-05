import { pgTable, text, timestamp, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// MAIN USER TABLE
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  isActive: boolean('is_active').default(false),
  emailVerifiedAt: timestamp('email_verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// PASSKEYS TABLE
export const passkeys = pgTable('passkeys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  webauthnUserId: text('webauthn_user_id').notNull(),
  credentialId: text('credential_id').notNull().unique(),
  credentialPublicKey: text('credential_public_key').notNull(),
  counter: text('counter').notNull().default('0'),
  transports: jsonb('transports'),
  deviceName: text('device_name').default('Auth Device'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at').defaultNow(),
});

// TOKENS & VERIFICATION TABLE
export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  verificationToken: text('verification_token'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires'),
  updateCode: text('update_code'), // Old email / Password confirm
  updateCodeNew: text('update_code_new'), // New email confirm
  pendingEmail: text('pending_email'),
  codeExpiresAt: timestamp('code_expires_at'),
});

// SECURITY & 2FA SETTINGS TABLE
export const securitySettings = pgTable('security_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  lastLoginAt: timestamp('last_login_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// RELATIONS
export const usersRelations = relations(users, ({ one, many }) => ({
	authTokens: one(authTokens, {
		fields: [users.id],
		references: [authTokens.userId],
	}),
  securitySettings: one(securitySettings, {
		fields: [users.id],
		references: [securitySettings.userId],
	}),
  passkeys: many(passkeys),
}));

