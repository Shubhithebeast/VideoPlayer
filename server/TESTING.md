# Testing Guide

This project now includes Module 6 test coverage with:

- `Jest` for test running and assertions
- `Supertest` for API integration tests
- `mongodb-memory-server` for isolated in-memory MongoDB

## Test layout

```text
server/__tests__/
  helpers/
  integration/
  setup/
  unit/
```

## Covered scope

- Unit tests for:
  - `src/utils/apiError.js`
  - `src/utils/apiResponse.js`
  - `src/utils/asyncHandler.js`
- Integration tests for:
  - `GET /api/v1/healthcheck/liveness`
  - `GET /api/v1/healthcheck/readiness`
  - `POST /api/v1/users/register`
  - `POST /api/v1/users/login`
  - `POST /api/v1/users/refreshToken`
  - comment create, update, fetch, and authorization rules

## Sample files used in tests

The registration test uses:

- `sampleData/images/p1.jpg`

Cloudinary and Redis are disabled/mocked in test mode, so tests stay local and isolated.

## Run tests

From the `server` folder:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Notes

- Tests require Node.js and npm to be installed and available in your terminal.
- The test environment sets its own JWT secrets and uses in-memory MongoDB automatically.
- A centralized Express error handler was added so API failures return stable JSON during tests and normal usage.
