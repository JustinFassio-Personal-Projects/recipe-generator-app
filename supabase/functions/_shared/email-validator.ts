/**
 * Email Validation Utilities
 * Validates email addresses and checks against disposable email providers
 */

/**
 * Basic email regex pattern
 * RFC 5322 simplified version
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Check basic format
  if (!EMAIL_REGEX.test(email)) {
    return false;
  }

  // Additional checks
  const [localPart, domain] = email.split('@');

  // Check local part length (max 64 characters)
  if (localPart.length > 64) {
    return false;
  }

  // Check domain length (max 255 characters)
  if (domain.length > 255) {
    return false;
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Common disposable email domains to block
 * This is a small list - in production, you'd want a more comprehensive list
 */
const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'maildrop.cc',
  'temp-mail.org',
];

/**
 * Check if email is from a disposable email provider
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) {
    return false;
  }

  return DISPOSABLE_DOMAINS.includes(domain);
}

/**
 * Normalize email address (lowercase, trim whitespace)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate and normalize email
 */
export function validateAndNormalizeEmail(email: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  // Normalize first
  const normalized = normalizeEmail(email);

  // Validate format
  if (!isValidEmail(normalized)) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  // Check for disposable email
  if (isDisposableEmail(normalized)) {
    return {
      valid: false,
      error: 'Disposable email addresses are not allowed',
    };
  }

  return {
    valid: true,
    normalized,
  };
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    const result = validateAndNormalizeEmail(email);
    if (result.valid && result.normalized) {
      valid.push(result.normalized);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

/**
 * Extract email domain
 */
export function getEmailDomain(email: string): string | null {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}
