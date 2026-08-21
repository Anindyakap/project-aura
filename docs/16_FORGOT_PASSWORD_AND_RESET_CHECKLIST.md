# Forgot Password and Reset Password

## Setup

- [ ] Create a Resend account, verify an Aura-owned sending domain, and create a restricted server-side API key.
- [ ] Add server-only email environment variables and templates.

## Schema

- [ ] Add a repeatable migration for hashed, expiring, single-use reset tokens.
- [ ] Add reset-token expiry cleanup.

## Backend

- [ ] Add a generic forgot-password endpoint.
- [ ] Add a reset-password endpoint using Aura's existing password policy.
- [ ] Invalidate existing sessions after a successful reset.

## Frontend

- [ ] Add forgot-password and reset-password pages.
- [ ] Add loading, success, expired-token, and error states.

## Security

- [ ] Return the same forgot-password response for existing and unknown emails.
- [ ] Store only a hash of each reset token.
- [ ] Use short expiry, single use, rate limits, and server-only email credentials.
- [ ] Avoid putting reset tokens in server logs or referrer data.

## Tests

- [ ] Test unknown-email privacy, expiry, single use, password policy, and session invalidation.

## Deployment

- [ ] Configure Resend and the reset URL in Render.
- [ ] Verify a complete production reset using a test account.

## Documentation and cleanup

- [ ] Update project documentation and remove expired reset-token records.
