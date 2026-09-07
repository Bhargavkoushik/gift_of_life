/**
 * Evaluates password string against the canonical 5 complexity rules.
 * @param {string} password
 * @returns {{
 *   hasMinLength: boolean,
 *   hasUppercase: boolean,
 *   hasLowercase: boolean,
 *   hasNumber: boolean,
 *   hasSpecial: boolean,
 *   isValid: boolean
 * }}
 */
export function evalPasswordRules(password = '') {
  const str = password || '';
  const hasMinLength = str.length >= 8;
  const hasUppercase = /[A-Z]/.test(str);
  const hasLowercase = /[a-z]/.test(str);
  const hasNumber = /[0-9]/.test(str);
  const hasSpecial = /[^a-zA-Z0-9]/.test(str);
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    isValid
  };
}

/**
 * Reusable Password Requirements Rule List displaying live Red -> Green indicators.
 * Before typing: all rules are displayed in red with '✗'.
 * As each rule becomes satisfied: immediately turns bold green with '✓'.
 */
export default function PasswordRequirementsRuleList({ password = '', title = 'Password must contain:' }) {
  const { hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial } = evalPasswordRules(password);

  return (
    <div className="mt-2.5 space-y-1 text-[11px] select-none pl-1">
      <div className="text-slate-500 font-semibold mb-1">{title}</div>
      <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-600 font-bold' : 'text-red-500'}`}>
        <span>{hasMinLength ? '✓' : '✗'}</span>
        <span>At least 8 characters</span>
      </div>
      <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-green-600 font-bold' : 'text-red-500'}`}>
        <span>{hasUppercase ? '✓' : '✗'}</span>
        <span>One uppercase letter</span>
      </div>
      <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-green-600 font-bold' : 'text-red-500'}`}>
        <span>{hasLowercase ? '✓' : '✗'}</span>
        <span>One lowercase letter</span>
      </div>
      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-600 font-bold' : 'text-red-500'}`}>
        <span>{hasNumber ? '✓' : '✗'}</span>
        <span>One number</span>
      </div>
      <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-green-600 font-bold' : 'text-red-500'}`}>
        <span>{hasSpecial ? '✓' : '✗'}</span>
        <span>One special character</span>
      </div>
    </div>
  );
}
