# Backend API Updates

This short addendum documents the latest backend API cleanup that frontend should follow.

## Admin APIs

`/admin/users` is now owned by one controller only: `AdminUsersController`.

Use these routes for admin user management:

```http
GET /admin/users
GET /admin/users/search
GET /admin/users/:id
PATCH /admin/users/:id
PATCH /admin/users/:id/status
DELETE /admin/users/:id
```

The duplicated `/admin/users` handlers were removed from `AdminController`.

Use these canonical subscription admin routes:

```http
GET /admin/subscription-plans
POST /admin/subscription-plans
PATCH /admin/subscription-plans/:id
DELETE /admin/subscription-plans/:id
GET /admin/subscriptions
```

Legacy compatibility routes still exist temporarily:

```http
GET /admin/memberships
POST /admin/memberships
PATCH /admin/memberships/:id
DELETE /admin/memberships/:id
GET /admin/memberships/subscribers
```

New frontend work should use the canonical routes only.

## Order State Machine

Order status transitions are now centralized in:

```txt
src/modules/orders/domain/services/order-state-machine.ts
```

Allowed transitions:

| From | To |
|---|---|
| pending | accepted, provider_assigned, cancelled, rejected |
| accepted | provider_en_route, provider_arrived, in_progress, cancelled, rejected |
| provider_assigned | provider_en_route, provider_arrived, in_progress, cancelled, rejected |
| provider_en_route | provider_arrived, in_progress, cancelled |
| provider_arrived | in_progress, cancelled |
| in_progress | completed |
| completed | terminal |
| cancelled | terminal |
| rejected | terminal |

Frontend can ask the backend which buttons/actions are currently valid:

```http
GET /orders/:id/status-transitions
```

Example response:

```json
{
  "orderId": "order_id",
  "currentStatus": "accepted",
  "allowedNextStatuses": ["provider_en_route", "provider_arrived", "in_progress", "cancelled", "rejected"],
  "isTerminal": false
}
```

Frontend rule:

- Render status action buttons only from `allowedNextStatuses`.
- Hide status actions when `isTerminal` is `true`.
- Refresh `GET /orders/:id/status-history` after every status change.
