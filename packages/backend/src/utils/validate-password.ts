/**
 * Validates password complexity requirements.
 * Returns an error message string if invalid, or null if valid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return '密码长度至少为 8 位';
  if (!/[A-Z]/.test(password)) return '密码必须包含至少一个大写字母';
  if (!/[a-z]/.test(password)) return '密码必须包含至少一个小写字母';
  if (!/[0-9]/.test(password)) return '密码必须包含至少一个数字';
  return null;
}
