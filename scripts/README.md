# Backend Scripts

This directory is intentionally small.

Kept scripts are active project tooling:

- `sync-docs.ts` updates generated endpoint documentation.
- `start-local-db.cjs` starts a local MongoDB memory server for development.
- `postman/validate.cjs` validates the maintained Postman collections.
- `postman/publish.cjs` publishes validated Postman collections when configured.

Use `npm run seed` for the canonical TypeScript database seeder.
One-off debug scripts, raw Atlas sync scripts, legacy data generators, and temporary local-dashboard seeders were removed from source control.
