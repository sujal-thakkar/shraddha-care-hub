export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordChecks {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
}

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  return Object.values(getPasswordChecks(password)).every(Boolean);
}
