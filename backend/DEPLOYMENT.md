# SimVex Backend Deployment Guide

## Development

Run the development server with hot reload:

```bash
cd backend
python run_dev.py
```

This starts a single-worker server with:
- Hot reload enabled
- Debug logging
- Port 8000

## Production

### Basic Usage

Run the production server:

```bash
cd backend
python run_prod.py
```

### Configuration Options

```bash
python run_prod.py --help
```

| Option | Default | Description |
|--------|---------|-------------|
| `--workers` | auto | Number of worker processes |
| `--users` | 30 | Target concurrent users (used to auto-calculate workers) |
| `--host` | 0.0.0.0 | Host to bind to |
| `--port` | 8000 | Port to bind to |
| `--log-level` | info | Logging level |

### Worker Recommendations

| Target Users | Workers | Command |
|--------------|---------|---------|
| 20-30 | 4 | `python run_prod.py --users 30` |
| 30-50 | 6 | `python run_prod.py --users 50` |
| 50-100 | 8 | `python run_prod.py --users 100` |

Or specify workers directly:

```bash
python run_prod.py --workers 4
```

### Environment Variables

Create a `.env` file in the backend directory:

```bash
# Required
OPENAI_API_KEY=your-api-key

# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL=sqlite+aiosqlite:///./simvex.db
# DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/simvex

# Optional
DEBUG=false
CORS_ORIGINS=https://your-domain.com
```

## Database Setup

### SQLite (Development)

No setup required. Database is created automatically on first run.

### PostgreSQL (Production)

1. Create the database:
```bash
createdb simvex
```

2. Update `.env`:
```bash
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/simvex
```

3. Run migrations:
```bash
cd backend
alembic upgrade head
```

## Health Check

Verify the server is running:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "workers": 4
}
```

## Rate Limiting

The server implements rate limiting to prevent API overload:

- **Global limit**: 5 concurrent LLM calls
- **Per-user limit**: 10 calls per minute

When rate limited, the API returns HTTP 429 with a `Retry-After` header.

## Monitoring

Check server logs for:
- Request latency
- Rate limit events
- LLM API errors

For production, consider adding:
- Application monitoring (e.g., Datadog, New Relic)
- Log aggregation (e.g., ELK stack)
- Alerting for error rates
