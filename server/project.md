# Server — контекст приложения

## Auth (чистый identity)

BC отвечает только на «кто ты?»: credentials (password), session/JWT, opaque `userId`.
Без roles / permissions.

Поверхности: `POST /auth/register|login|refresh|logout`, `GET /auth/me`.
Refresh — httpOnly cookie `refresh_token` (path `/auth`); access — Bearer JWT (`sub`, `sid`).

Persistence: Drizzle + SQLite (`DATABASE_PATH`, по умолчанию `./data/app.sqlite`). Без Docker.
