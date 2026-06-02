# Car Hero Backend Postman Setup

This folder contains a complete Postman Collection that can be **imported** into Postman, plus an environment file.

## Files

- `car_hero_backend.postman_collection.json`: complete API collection generated from NestJS controllers.
- `car_hero_backend.postman_environment.json`: environment variables for local testing.

## How to use

1. Open Postman.
2. Import `car_hero_backend.postman_collection.json`.
3. Import `car_hero_backend.postman_environment.json`.
4. Select the environment: `Car Hero Backend Local`.
5. Update `base_url` if your backend runs on another host or prefix.
6. Run an auth request such as `POST /auth/login` or `POST /admin/login`.
7. If the response includes tokens, the Tests script stores `access_token` and `refresh_token` automatically.
8. Run protected requests. They inherit Bearer auth from the collection using `{{access_token}}`.

## Coverage

- Total endpoints included: 190
- Folders: 25
- Source: `CAR_HERO_BACKEND/src/**/*.controller.ts`

## Notes

- Some requests need real database IDs. Replace variables such as `vehicle_id`, `order_id`, and `provider_id` after creating or fetching records.
- Query parameters are included but optional query params are disabled by default in Postman.
- Request bodies are generated from DTOs where possible, with safe example values.
- Basic tests check that responses are not server errors and that response time is reasonable.

## Provider Live Tracking

HTTP requests:

- `PUT /providers/me/location`: update the provider profile's latest position.
- `PATCH /orders/:id/location`: persist the assigned provider's latest order position and append it to the bounded route trail.
- `GET /orders/:id/tracking`: read the map-ready tracking payload for the order owner, assigned provider, or admin.
- `PATCH /orders/:id/status`: move the order through `accepted`, `provider_en_route`, `provider_arrived`, and `in_progress`.

Socket.IO namespace: `{{ws_url}}`

Pass the JWT during connection:

```js
const socket = io("http://localhost:3001/ws", {
  auth: { token: `Bearer ${accessToken}` },
});
```

Customer and assigned provider join a private order room:

```js
socket.emit("join:order", { orderId });
socket.on("order:location:updated", (payload) => {
  // Update the provider marker and optional route polyline.
});
```

Provider sends GPS updates while handling an active order:

```js
socket.emit("update:order:location", {
  orderId,
  latitude: 33.5138,
  longitude: 36.2765,
  accuracy: 8,
  heading: 145,
  speed: 12.5,
});
```

The server authorizes the room membership and update, persists the point, synchronizes the provider profile location, and broadcasts `order:location:updated` only to the private order room.
