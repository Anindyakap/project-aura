# API Response and Error Formats

This guide describes the response shapes currently returned by Aura's backend.
It documents the existing `/api/v1` contract; it does not standardize or change
any response behavior.

## Response headers

Requests that reach Aura's request-ID middleware receive an `X-Request-ID`
header containing a server-generated UUID. Include this harmless value when
reporting an error so related backend logs can be found.

The public authentication routes also return standard `RateLimit` headers.
They limit one IP address to ten combined registration and login attempts per
15-minute window.

## Common JSON success pattern

Most resource endpoints use this pattern:

```json
{
  "success": true,
  "data": {}
}
```

Some successful responses also contain `message` or `timestamp`. The root,
health, and API-index routes use separate information-response shapes.

## Handled errors

Most errors passed to Aura's central error handler use:

```json
{
  "error": true,
  "message": "Human-readable explanation",
  "requestId": "<UUID>"
}
```

In development only, the response can also include `stack`. Production
responses do not include a stack trace.

Common current statuses are:

| Status | Meaning |
| --- | --- |
| `400` | Validation or malformed input failed. |
| `401` | Login token is missing, invalid, or credentials are incorrect. |
| `403` | The logged-in user is not allowed to access the resource. |
| `404` | The requested resource or route does not exist. |
| `409` | Registration email already exists. |
| `429` | Too many registration or login attempts. |
| `500` | Unexpected server error. |

## 404 route response

Unknown routes are a current exception: `error` is the string `"Not Found"`
rather than the Boolean `true`.

```json
{
  "error": "Not Found",
  "message": "Route GET /example not found",
  "requestId": "<UUID>"
}
```

## Rate-limit response

The eleventh combined registration or login attempt from one IP address in
15 minutes returns HTTP `429`:

```json
{
  "error": true,
  "message": "Too many authentication attempts. Please try again later.",
  "requestId": "<UUID>"
}
```

## Unversioned information endpoints

| Endpoint | Status | Response fields |
| --- | --- | --- |
| `GET /` | `200` | `message`, `version` |
| `GET /health` | `200` | `status`, `message`, `database`, `timestamp`, `environment` |

## API index

| Endpoint | Status | Response fields |
| --- | --- | --- |
| `GET /api/v1` | `200` | `message`, `version`, `endpoints` |

`endpoints` lists route groups. It is a discovery response, not a complete
endpoint specification.

## Authentication responses

| Endpoint | Status | Response fields |
| --- | --- | --- |
| `POST /api/v1/auth/register` | `201` | `success`, `message`, `data.user`, `data.token` |
| `POST /api/v1/auth/login` | `200` | `success`, `message`, `data.user`, `data.token` |
| `GET /api/v1/auth/me` | `200` | `success`, `data` |

`data.user` and the `/auth/me` `data` object contain `id`, `email`, `name`,
`created_at`, and `is_active`. They do not contain `password_hash` or
`updated_at`.

`data.token` is a JWT credential. Treat it like a password: store it only as
required by the current frontend, never place a real token in documentation,
logs, screenshots, or committed test files.

## Brand responses

| Endpoint | Status | Response fields |
| --- | --- | --- |
| `GET /api/v1/brands` | `200` | `success`, `data` array |
| `POST /api/v1/brands` | `201` | `success`, `message`, `data` |

Each returned brand has `id`, `name`, `domain`, `currency`, `timezone`, and
`created_at`.

## Shopify integration responses

| Endpoint | Status | Response |
| --- | --- | --- |
| `GET /api/v1/integrations/shopify/connect` | Redirect | Redirects the browser to Shopify's authorization page. |
| `GET /api/v1/integrations/shopify/callback` | Redirect | Redirects to the frontend with a safe success or reason label. |
| `GET /api/v1/integrations/shopify/status` | `200` | `success`, `data.connected`, and, when connected, `data.integration` |
| `DELETE /api/v1/integrations/shopify/disconnect` | `200` | `success`, `message` |

The status response never includes the stored Shopify access token.

OAuth callback failures redirect to the frontend with one of the current
reason labels: `state_mismatch`, `missing_brand`, `invalid_hmac`, or
`token_exchange_failed`. They are redirects, not JSON error responses.

## Metrics responses

| Endpoint | Status | Response fields |
| --- | --- | --- |
| `GET /api/v1/metrics/summary` | `200` | `success`, `data.period`, `data.metrics` |
| `GET /api/v1/metrics/chart` | `200` | `success`, `data.metric`, `data.days`, `data.points` |

Each summary metric (`revenue`, `orders`, `aov`, and `new_customers`) has
`value`, `change`, and `formatted`. Each chart point has `date` and `value`.

## Insight responses

| Endpoint | Status | Response fields |
| --- | --- | --- |
| `GET /api/v1/insights` | `200` | `success`, `data.insights`, `data.unreadCount`, `data.total` |
| `PATCH /api/v1/insights/:id/read` | `200` | `success`, `message` |
| `PATCH /api/v1/insights/read-all` | `200` | `success`, `message` |
| `POST /api/v1/insights/generate` | `200` | `success`, `message`, `timestamp` |

## Synchronization response

| Endpoint | Status | Response fields |
| --- | --- | --- |
| `POST /api/v1/sync/shopify` | `200` | `success`, `message`, `timestamp` |

## Frontend handling rule

Check `response.ok` before treating a response as successful. For JSON errors,
show the safe `message` to the user and retain `requestId` for support or log
investigation. Do not show development-only stack traces in a production UI.
