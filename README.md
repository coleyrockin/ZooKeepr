# ZooKeepr

## Professional project summary

ZooKeepr is a lightweight full-stack Node.js + Express catalog app for managing zoo staff and animals. It keeps a searchable JSON-backed dataset, exposes a small REST-style API, and serves a browser UI for browsing and submitting records.

Built originally as a bootcamp exercise, this version is updated to emphasize reliability, safer write controls, clearer UX, and stronger documentation so it can be presented as an employer-ready portfolio project.

## Live demo

- Live demo placeholder: _not yet deployed_
- API health check: `GET /health`

## Screenshot

![ZooKeepr screenshot](./public/assets/images/ZooKeeprsc.png)

## Features

- Manage animals with name, species, diet, and personality traits.
- Manage zookeepers with name, age, and favorite animal.
- Filter animals by diet, personality traits, and species.
- Filter zookeepers by name and age.
- Protected write endpoints using token + rate limiting.
- Public read routes with simple form-based UI.
- JSON file persistence for fast local setup.

## Tech stack

- Node.js
- Express.js
- Vanilla JavaScript (browser)
- HTML/CSS
- Jest
- Helmet

## Folder structure

```text
ZooKeepr/
  data/           Static JSON datasets
  lib/            Domain utilities and persistence helpers
  routes/
    apiRoutes/    API endpoints
    htmlRoutes/   Page routes
  public/
    assets/
      css/        Styles
      js/         Browser scripts
    *.html        UI pages
  __tests__/      Unit tests
  server.js       Express bootstrap
  README.md
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Start the app:
   ```bash
   npm start
   ```
4. Open `http://localhost:3001`.

## Environment variables

Create a `.env` file from `.env.example`.

- `PORT` — server port (default `3001`).
- `NODE_ENV` — environment string (`development`, `production`, etc.).
- `ZOO_WRITES_ENABLED` — set to `true` to enable POST routes.
- `ZOO_WRITE_TOKEN` — required token when write endpoints are enabled.
- `ZOO_WRITE_RATE_LIMIT` — max POST requests per minute per IP (defaults to `30`).

## Run tests

```bash
npm test
```

## API

### GET routes

- `GET /health`
- `GET /api/animals`
- `GET /api/animals/:id`
- `GET /api/zookeepers`
- `GET /api/zookeepers/:id`

### POST routes

- `POST /api/animals`
- `POST /api/zookeepers`

Both POST routes require:

- valid JSON body
- enabled writes via `ZOO_WRITES_ENABLED=true`
- matching `x-zoo-write-token` header value

## Security notes

- Helmet is enabled for baseline HTTP header hardening.
- Write endpoints are gated by a feature flag + token check.
- Write routes include per-IP simple rate limiting.
- Inputs are sanitized before persistence.

## What I learned

- How route layering works in Express.
- Safe client/server shape of form workflows (`GET` for retrieval, `POST` for creation).
- Practical API error handling and status code design.
- JSON persistence constraints and tradeoffs versus database-backed models.

## Future improvements

- Add database storage (PostgreSQL/SQLite) with migration support.
- Add pagination + sorting for search results.
- Add request validation middleware with consistent schema errors.
- Add auth strategy for user-managed write access.
- Add Playwright/Cypress smoke tests for key user flows.

## Known limitations

- Data is currently stored in local JSON files (not ideal for production scale).
- No image upload or file attachment support.
- No user accounts or role-based authorization beyond write token protection.

## Deployment checklist

- Configure environment variables on host.
- Keep `ZOO_WRITES_ENABLED=false` unless writes are intentionally exposed.
- Use strong random value for `ZOO_WRITE_TOKEN`.
- Rotate token if compromise is suspected.

## Topics

`express` `nodejs` `javascript` `portfolio` `zoo` `rest-api` `frontend` `bootcamp-project`

## License

MIT

## Author

Coleyrockin, adapted and upgraded by the project maintainer.

- GitHub: [github.com/coleyrockin](https://github.com/coleyrockin)
- Contact: [Coleyrockin@aol.com](mailto:Coleyrockin@aol.com)
