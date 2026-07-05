# Nuxt Auth Boilerplate

Hey! This is a starter template I put together using Nuxt so I wouldn't have to keep rewriting an auth (authentication) system from scratch every time I start a new app. It comes with almost all the core membership features a modern web app might need, both on the backend and the frontend.

## What's Included?

- **Sign Up & Login:** Data validation with Zod, secure password storage with Bcrypt.
- **JWT Session Management:** Secure, HTTP-Only cookie-based session management to protect against theft.
- **Email Verification:** Account activation via a link sent after registration, powered by [EmailThing](https://emailthing.app/home).
- **Forgot Password:** Secure password reset request and token-based new password flow.
- **Profile Updates:** Secure password and email changes from the dashboard after verifying the current password, using 6-digit codes sent to the old/new email addresses.
- **Custom Notifications:** A custom toast notification system that floats on screen, instead of ugly browser alerts.

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3)
- **Database:** PostgreSQL (Drizzle ORM)
- **Security:** JSON Web Token (JWT), Bcrypt, Zod
- **Animation:** @vueuse/motion
- **Mail Service:** EmailThing API

## Setup

Follow these steps to run the project on your own machine:

1. Install dependencies:
```bash
yarn install
```

2. Create a `.env` file in the project directory and fill in the following variables:
```env
# Your database connection (e.g. Supabase, Neon, or local Postgres)
DATABASE_URL="postgresql://user:password@localhost:5432/nuxt_auth"

# A random string for session encryption
JWT_SECRET="put-a-long-random-string-here"

# EmailThing credentials for verification emails
EMAILTHING_TOKEN="et__your_token"
EMAILTHING_FROM="no-reply@your-domain.com"

# The address the app runs on (needed for links in emails)
BASE_URL="http://localhost:3000"
```

3. Create the database tables (Drizzle will handle this automatically):
```bash
yarn db:push
```

4. Start the development server:
```bash
yarn dev
```