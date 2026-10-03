const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters";
  if (new TextEncoder().encode(password).length > 72) return "Password is too long";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Include at least one letter and one number";
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required";
  if (name.trim().length > 100) return "Name is too long";
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!/^\+?[0-9 ()-]{3,30}$/.test(phone.trim())) return "Enter a valid phone number";
  return null;
}
