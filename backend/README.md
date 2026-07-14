# Backend

Approved stack: Node.js + Express.js.

## Local Environment

Copy `.env.example` to `.env`, then replace `JWT_SECRET` with a generated local secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Also set the SQL Server variables to match your local database.

For a production deployment where the frontend uses a different origin, set a comma-separated
allowlist. Same-origin requests do not require this setting.

```env
CORS_ORIGINS=https://library.example.com,https://admin.example.com
```

Missing `JWT_SECRET` can make a successful login fail when the backend tries to issue the JWT access token.

If login returns `500` while `/health` works, check the DB connection first. For SQL Server Express, your `.env` may need:

```env
DB_SERVER=localhost
DB_INSTANCE_NAME=SQLEXPRESS
# DB_PORT=1433
```

For SQL authentication, also set `DB_USER` and `DB_PASSWORD`.

## Structure

Expected structure:

```text
backend/
  src/
```
