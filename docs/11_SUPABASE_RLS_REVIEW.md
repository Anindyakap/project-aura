# Supabase Row Level Security Review

## Purpose

This document records how Row Level Security (RLS) currently works in Aura's
Supabase database and how it relates to Aura's custom authentication system.

Reviewed: 2026-08-03

## What was verified in the Supabase dashboard

RLS is enabled for all five Aura tables:

| Table | RLS enabled | RLS forced | Policies found |
|---|---:|---:|---:|
| `users` | Yes | No | 2 |
| `brands` | Yes | No | 4 |
| `integrations` | Yes | No | 4 |
| `metrics` | Yes | No | 2 |
| `insights` | Yes | No | 2 |

The policies were created in the Supabase dashboard. They are not currently
stored in Aura's migration files.

## What the policies try to protect

The policies use `auth.uid()` to compare the currently signed-in Supabase user
with the owner of a record.

For example, a brand policy allows access only when the brand's `user_id`
matches `auth.uid()`.

This is the normal pattern when an application uses Supabase Auth and the
browser calls Supabase directly.

## Aura's current authentication architecture

Aura does not currently use Supabase Auth.

The backend creates and verifies Aura's own JWT. It reads the authenticated
user ID from that token, checks ownership in backend code, and accesses
PostgreSQL using the server-only `DATABASE_URL`.

The Supabase review found that:

- Aura has application users in `public.users`.
- The project has no users in `auth.users`.
- No Aura user ID matches a Supabase Auth user ID.

Therefore, the current `auth.uid()` policies cannot identify an Aura user.

## Current decision

Aura must keep database access server-only.

Do not expose a database URL, Supabase service-role key, or direct database
access to the frontend.

The backend's JWT authentication and ownership checks are Aura's active access
control. The existing Supabase policies remain in place, but they are not the
current authorization mechanism for Aura's custom-JWT requests.

Table owners can bypass RLS because RLS is not forced. This is another reason
to continue treating the backend database connection as highly privileged.

## Future options

Before Aura allows the frontend to call Supabase directly, choose one
architecture and implement it as a separate security task:

1. Move Aura authentication to Supabase Auth and make `public.users.id` match
   `auth.users.id`. Then store reviewed policies in repeatable migrations.
2. Keep custom backend authentication and continue sending all database access
   through the backend. Design a separate least-privilege database-role and
   RLS strategy before trying to enforce RLS for backend queries.

Do not mix these approaches without a written migration plan and tests.
