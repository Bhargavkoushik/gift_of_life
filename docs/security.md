# Authentication & Security Foundation

This document details the security standards, policies, and workflows implemented for the Gift of Life authentication and account management systems.

---

## 1. Password Policy
A unified, strict password policy is enforced consistently on both the frontend (dynamic live check list) and the backend (Zod schema validations):
- **Minimum Length:** 8 characters.
- **Complexity Requirements:**
  - At least 1 uppercase letter (`A-Z`)
  - At least 1 lowercase letter (`a-z`)
  - At least 1 number (`0-9`)
  - At least 1 special character (e.g. `!@#$%^&*` etc.)
- **Password Confirmations:** Must match the primary password field exactly.

---

## 2. Password Recovery (Forgot/Reset Password)
The platform uses a cryptographically secure, out-of-band password recovery mechanism:

### Flow:
1. **Request:** The user enters their email or phone number in `/forgot-password` (`POST /api/auth/forgot-password`).
2. **Account Enumeration Prevention:** The system returns a generic success response regardless of account existence:
   > "If an account exists with this information, recovery instructions will be sent."
3. **Token Generation:**
   - A secure high-entropy random token (32-bytes hex string) is generated at runtime.
   - The token is hashed (SHA-256) before storing it in the database `password_reset_tokens` table.
   - Plaintext tokens are **never** stored in the database.
4. **Token Invalidation & Expiry:**
   - Active tokens expire after a configurable duration (default: `30` minutes) via `PASSWORD_RESET_TOKEN_MINUTES`.
   - Creating a new reset token automatically invalidates (marks as used) all previous active reset tokens for that user.
   - Reusing tokens or using expired tokens is rejected.
5. **Reset:** The user visits `/reset-password?token=...` (`POST /api/auth/reset-password`).
   - The token hash is matched, validated, and marked as used.
   - The new password is validated, hashed with bcrypt, and updated on the user record.

---

## 3. Change Password
Authenticated users can change their password using `POST /api/auth/change-password`:
- Requires verifying the user's current password.
- Enforces the password complexity policy on the new password.
- Rejects reuse of the user's current password.

---

## 4. Notification Abstractions
Email and SMS dispatches are decoupled via `notificationService.js`:
- Supports a `console` logging simulation provider for local development.
- Exposes standard environmental configurations (`MAIL_PROVIDER`, `MAIL_FROM`, `SMS_PROVIDER`) for production SMTP/API gateways.

---

## 5. Rate Limiting & Abuse Prevention
Auth endpoints are protected using a memory-based rate limiter middleware (`rateLimit.js`):
- **Forgot Password:** Max 5 requests per hour.
- **Reset/Login/Change:** Max 15 requests per 15 minutes.
- Returns `429 Too Many Requests` with rate limit header tracking.
