# Student access configuration

The client labels the entry point **Continue with UA email**. This is not official
UA SSO. Existing accounts sign in with an email code. The current Clerk development
instance requires a password when creating a new account, so first-time students
create one before receiving their verification code. Configure Clerk to permit
email-code sign-in/sign-up and require verified email addresses. Both `@ua.edu` and
`@crimson.ua.edu` addresses are accepted and map to the same UA tenant.

## Required environment variables

Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the client build environment. Set
`CLERK_SECRET_KEY` and `DATABASE_URL` only in Vercel/server environments. Apply
`db/migrations/20261017000000_tenant_eligibility.sql` and
`db/migrations/20261017000001_allow_crimson_ua_email.sql` to Neon before
enabling the app gate.

## Current student-verification method

The current provider grants a one-year eligibility window to a user whose primary
email is verified by Clerk and belongs to an allowed UA domain. It has no vendor
redirect or document collection, so it works the same in Expo web, iOS, and Android.

Before replacing it with SheerID or another vendor, confirm UA coverage, hosted
document fallback, privacy terms, lifecycle mapping for incoming freshmen/current
students/recent graduates, and webhook signature rules. The adapter must return only
the provider reference, tenant/user binding, category, status, and expiry; the server
persists those fields and annual expiry. It must not receive or store documents,
dates of birth, or evidence.

## Future UA Okta SSO

After UA OIT provisions an OIDC/SAML connection, configure it in Clerk—not in the
mobile app. Allowlist the deployed web URL and the `legendsleasing://` native
redirect, map only approved profile claims, and link accounts by verified UA email
and provider subject. Store connection secrets exclusively in Clerk/Vercel.
