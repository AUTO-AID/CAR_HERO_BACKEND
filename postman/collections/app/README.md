# Car Hero - Customer App API

Direct source collection for the customer mobile application. Edit this collection when adding customer app endpoints.

- API: `http://localhost:3001/api/v1`
- WebSocket: `http://localhost:3001/ws`
- Requests: 96

This collection intentionally contains only customer-mobile workflows. Provider-dashboard actions and admin-only reports stay in their own collections.

## Live Tracking WebSocket

Connect to `{{ws_url}}` with the customer access token, then:

```text
emit: join:order                 { orderId }
listen: order:location:updated   provider location, heading, speed, timestamp
listen: order:status:updated     order status and timestamp
emit: leave:order                { orderId }
```

Use `GET /orders/:id/tracking` as the initial snapshot and reconnect fallback.

## Customer Order Completion

After the provider moves an active order to `awaiting_customer_confirmation`, the customer confirms the completed service with:

```text
POST /orders/:id/customer-confirm-completion
```

Provider earnings are released only after this confirmation.

## Recurring Wash Plans

Wash plans store their next booking date and generate due bookings automatically. For an explicit customer-triggered booking:

```text
POST /customer/wash-plans/:id/generate-booking
```

## Chat WebSocket

Connect to the `/chat` namespace with the customer access token, then:

```text
emit: join_chat
emit: send_message
emit: typing
emit: message_read
listen: new_message
listen: user_typing
listen: messages_marked_read
```

Validate before pushing:

```text
npm run postman:validate
```
