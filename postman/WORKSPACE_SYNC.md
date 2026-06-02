# Postman Workspace Synchronization

The Postman Workspace mirrors the direct product collections under `postman/collections/`.

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

## Published Collections

```text
Car Hero - Customer App API
Car Hero - Provider Dashboard API
Car Hero - Admin Dashboard API
Car Hero - Public Website API
Car Hero - AI API
```

The publisher removes the obsolete `Car Hero - Backend Master API` and `Car Hero - Shared API` collections and their environments when found.

## Daily Workflow

1. Backend changes an endpoint.
2. Add or update the request directly in each relevant folder under `postman/collections/`.
3. Run `npm run postman:validate`.
4. Commit and push to `main`.
5. GitHub Actions validates and publishes the direct Workspace collections and environments.
6. Frontend teams see the updates in Postman automatically.

## Permissions

- Backend team: Editor access.
- Frontend teams: Viewer access to the relevant product collection.
- CI publisher: use a dedicated Postman API key when possible.
