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

- Total endpoints included: 195
- Folders: 25
- Source: `CAR_HERO_BACKEND/src/**/*.controller.ts`

## Notes

- Some requests need real database IDs. Replace variables such as `vehicle_id`, `order_id`, and `provider_id` after creating or fetching records.
- Query parameters are included but optional query params are disabled by default in Postman.
- Request bodies are generated from DTOs where possible, with safe example values.
- Basic tests check that responses are not server errors and that response time is reasonable.
