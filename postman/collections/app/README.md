# Car Hero - Customer App API

Direct source collection for the customer mobile application. Edit this collection when adding customer app endpoints.

- API: `http://localhost:3001/api/v1`
- WebSocket: `http://localhost:3001/ws`
- Requests: 94

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
