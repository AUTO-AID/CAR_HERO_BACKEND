# Car Hero Postman Collections

Each client owns a direct Postman collection and a local environment. There is intentionally no global `master` collection and no `shared` collection.

## Layout

```text
postman/collections/
  app/
  provider-dashboard/
  admin-dashboard/
  website/
  ai/
```

Every folder contains:

```text
README.md
*.postman_collection.json
*.local.postman_environment.json
```

Shared endpoints are copied into every client collection that needs them. For example, `POST /auth/login` may exist in both the customer app and provider dashboard collections. Each frontend team can use its own collection independently.

## Daily Workflow

When adding or changing an endpoint:

1. Update the backend route.
2. Add or update the request directly inside each relevant product collection under `postman/collections/`.
3. Run validation:

```text
npm run postman:validate
```

4. Commit and push to `main`.
5. GitHub Actions publishes the product collections and environments to the Postman Workspace.

Do not recreate a global collection. Product ownership is explicit and maintained directly by the backend team.

## Commands

```text
npm run postman:validate
npm run postman:publish
```

Before local publishing, set:

```text
POSTMAN_API_KEY=...
POSTMAN_WORKSPACE_ID=...
```

GitHub Actions reads the same values from repository secrets. The publisher discovers the product folders automatically. It updates existing Workspace collections and environments by name or creates them when missing.

## Provider Live Tracking

The customer app and provider dashboard collections contain the tracking requests:

```text
GET   /orders/:id/tracking
PATCH /orders/:id/location
PATCH /orders/:id/status
GET   /orders/:id/status-transitions
PUT   /providers/me/location
```

Socket.IO namespace:

```text
{{ws_url}}
```

Relevant events:

```text
join:order
leave:order
update:order:location
order:location:updated
order:status:updated
```
