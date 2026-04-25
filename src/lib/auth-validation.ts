import { z } from 'zod';

// Common weak passwords to reject (top 50 most common)
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'qwertyuiop', 'abc123', 'admin', 'admin123', 'letmein',
  'welcome', 'welcome1', 'monkey', 'dragon', 'master', 'iloveyou', 'sunshine',
  'princess', 'football', 'baseball', 'superman', 'batman', 'trustno1',
  'passw0rd', 'p@ssword', 'p@ssw0rd', '11111111', '00000000', '88888888',
  'qazwsx', 'zxcvbnm', '1q2w3e4r', 'asdfghjkl', 'changeme', 'default',
  'guest123', 'root123', 'test1234', 'demo1234', 'pass1234', 'admin1234',
]);

// Disposable / temporary email domains (most common ~50)
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'fakeinbox.com',
  'temp-mail.org', 'getnada.com', 'mintemail.com', 'maildrop.cc', 'sharklasers.com',
  'mohmal.com', 'tempr.email', 'dispostable.com', 'mailnesia.com', 'mytemp.email',
  'temp-mail.io', 'tempmailo.com', 'emailondeck.com', 'spamgourmet.com',
  'mailcatch.com', 'mailnull.com', 'tempinbox.com', 'jetable.org',
  'incognitomail.com', 'binkmail.com', 'spam4.me', 'mailtemp.info',
  'fakemailgenerator.com', 'mvrht.com', 'getairmail.com', 'mailtothis.com',
  'inboxbear.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz',
  'pokemail.net', 'spam.la', 'tempemail.net', 'discard.email', 'wegwerfmail.de',
  'einrot.com', 'tempmail.de', 'mail-temporaire.fr', 'mailforspam.com',
  'mailtemp.net', 'temporary-mail.net', 'disposablemail.com', 'fakemail.net',
]);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine((p) => /[a-z]/.test(p), 'Password must contain a lowercase letter')
  .refine((p) => /[A-Z]/.test(p), 'Password must contain an uppercase letter')
  .refine((p) => /[0-9]/.test(p), 'Password must contain a number')
  .refine((p) => /[^a-zA-Z0-9]/.test(p), 'Password must contain a special character')
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), 'This password is too common')
  .refine((p) => !/(.)\1{3,}/.test(p), 'Password cannot have 4+ repeating characters');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Email is too short')
  .max(254, 'Email is too long')
  .email('Please enter a valid email')
  .refine((e) => {
    const domain = e.split('@')[1];
    return !DISPOSABLE_EMAIL_DOMAINS.has(domain);
  }, 'Disposable email addresses are not allowed');

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long')
  .regex(/^[\p{L}\s'\-.]+$/u, 'Name contains invalid characters');

export const signUpSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  // Honeypot — must be empty
  website: z.string().max(0, 'Bot detected'),
  captchaToken: z.string().min(1, 'Please complete the security check'),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
  captchaToken: z.string().min(1, 'Please complete the security check'),
});

// Password strength scoring 0-4
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
    notCommon: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    notCommon: password.length > 0 && !COMMON_PASSWORDS.has(password.toLowerCase()),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  let score: PasswordStrength['score'] = 0;
  if (passed >= 6 && password.length >= 12) score = 4;
  else if (passed >= 6) score = 3;
  else if (passed >= 5) score = 2;
  else if (passed >= 3) score = 1;

  const labels: PasswordStrength['label'][] = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score], checks };
}

// Client-side rate limit using localStorage
const RATE_LIMIT_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

export function checkRateLimit(action: 'signin' | 'signup'): { allowed: boolean; retryAfter?: number } {
  try {
    const raw = localStorage.getItem(`${RATE_LIMIT_KEY}_${action}`);
    if (!raw) return { allowed: true };
    const entry: RateLimitEntry = JSON.parse(raw);
    const now = Date.now();

    if (entry.lockedUntil && entry.lockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
    }
    if (now - entry.firstAttempt > WINDOW_MS) {
      localStorage.removeItem(`${RATE_LIMIT_KEY}_${action}`);
      return { allowed: true };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export function recordFailedAttempt(action: 'signin' | 'signup'): void {
  try {
    const key = `${RATE_LIMIT_KEY}_${action}`;
    const raw = localStorage.getItem(key);
    const now = Date.now();
    const entry: RateLimitEntry = raw ? JSON.parse(raw) : { attempts: 0, firstAttempt: now };

    if (now - entry.firstAttempt > WINDOW_MS) {
      entry.attempts = 1;
      entry.firstAttempt = now;
      delete entry.lockedUntil;
    } else {
      entry.attempts += 1;
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + WINDOW_MS;
    }
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function clearRateLimit(action: 'signin' | 'signup'): void {
  try {
    localStorage.removeItem(`${RATE_LIMIT_KEY}_${action}`);
  } catch {
    // ignore
  }
}
