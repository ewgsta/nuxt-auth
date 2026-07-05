import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  isActive: boolean('is_active').default(false), // e-posta doğrulanana kadar false
  emailVerifiedAt: timestamp('email_verified_at'),
  verificationToken: text('verification_token'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
