# ADR: Add Email-Based Password Reset Flow

## Status
Accepted

## Context
The application already uses Supabase Auth for login, registration, and session management. The current project requirements originally excluded password recovery by email, but the product decision is to add it now so users can recover their account without support intervention.

## Decision
Implement an email-based password reset flow using Supabase Auth.

### UI flow
- Add `/forgot-password` to request a reset email.
- Add `/reset-password` to set a new password after the user opens the recovery link.
- Add a "Forgot password?" link on the login page.

### Auth changes
Extend the auth context/provider with:
- `requestPasswordReset(email: string)`
- `updatePassword(password: string)`

### Supabase behavior
- Use `supabase.auth.resetPasswordForEmail(email, { redirectTo })` to send the recovery email.
- Use `supabase.auth.updateUser({ password })` to persist the new password.

## Consequences
- Users can recover access directly from the app.
- The auth surface gains two new public routes and two new forms.
- This change intentionally overrides the earlier no-recovery restriction in the spec.
- Supabase must allow the redirect URL used by the recovery flow.
