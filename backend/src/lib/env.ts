import { getEnv } from '../config/env.js';

const base = getEnv();

export const env = {
  FRONTEND_URL: base.FRONTEND_URL,
  AUTH_COOKIE_NAME: base.AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAXAGE: base.AUTH_COOKIE_MAXAGE,
  AUTH_COOKIE_SAMESITE: base.AUTH_COOKIE_SAMESITE,
  AUTH_COOKIE_SECURE: base.AUTH_COOKIE_SECURE,
  AUTH_COOKIE_DOMAIN: base.AUTH_COOKIE_DOMAIN ?? 'localhost',
  AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET ?? base.AUTH_JWT_SECRET,
};

const sameSite = env.AUTH_COOKIE_SECURE ? 'none' : env.AUTH_COOKIE_SAMESITE;

export const cookieOpts = {
  path: '/',
  httpOnly: true,
  sameSite,
  secure: env.AUTH_COOKIE_SECURE,
  domain: env.AUTH_COOKIE_DOMAIN,
  maxAge: env.AUTH_COOKIE_MAXAGE,
} as const;
