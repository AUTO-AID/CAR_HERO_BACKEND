# Postman Workspace Synchronization

Use a shared Postman Workspace so frontend teams receive API updates without importing JSON files again.

## One-Time Setup

1. Create a Postman Team or Internal Workspace named `Car Hero API`.
2. Create a Postman API key from your Postman account settings.
3. Copy the Workspace ID from its Postman URL.
4. Add these GitHub repository secrets:

```text
POSTMAN_API_KEY
POSTMAN_WORKSPACE_ID
```

5. Run the GitHub Action `Publish Postman collections` manually once, or publish locally:

```powershell
$env:POSTMAN_API_KEY = "..."
$env:POSTMAN_WORKSPACE_ID = "..."
npm run postman:publish
```

## Daily Workflow

1. Backend changes an endpoint.
2. Update the canonical Postman source when the route contract changes.
3. Commit and push to `main`.
4. GitHub Actions generates, validates, and publishes the Workspace collections and environments.
5. Frontend teams see the updates in Postman automatically.

## Collections Shared With Teams

```text
Car Hero - Customer App API
Car Hero - Provider Dashboard API
Car Hero - Admin Dashboard API
Car Hero - Public Website API
Car Hero - AI API
```

Keep `Car Hero - Backend Master API` for backend maintainers. `Car Hero - Shared API` is a reference for reusable requests; product collections already include the shared requests they need.

## Permissions

- Backend team: Editor access.
- Frontend teams: Viewer access to the relevant product collection.
- CI publisher: use a dedicated Postman API key when possible.
