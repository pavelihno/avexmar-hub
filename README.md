# Avexmar Hub

## Development Setup

Follow these steps to prepare a local development environment with Docker Compose:

### 1. Prepare Environment Files

Each service ships with its own `.example.env`. Copy them to `.env` and update values before starting the stack:

```bash
cp server/.example.env server/.env
cp client/.example.env client/.env
cp redis/.example.env redis/.env
cp db/.example.env db/.env
```

-   Update secrets (`SERVER_SECRET_KEY`, `REDIS_PASSWORD`, etc.) with strong values.
-   Keep the default service URLs for local work unless you change exposed ports.

### 2. Build and Start Containers

```bash
docker-compose build
docker-compose up -d
```

The development stack exposes the Flask API (`server-app`) at `http://localhost:8000`, the React client (`client-app`) at `http://localhost` (port `80`), Postgres on `localhost:5432`, Redis on `localhost:6379`, and Adminer (database UI) on `http://localhost:8082`.

### 3. Initialize the Database

Run migrations inside the server container:

```bash
docker-compose exec server-app flask db upgrade
```

### 4. Create an Admin User

Run the following command to create an administrator (update email/password before production use):

```bash
docker-compose exec server-app python -c "
from app.app import app
from app.utils.enum import USER_ROLE
from app.models.user import User

with app.app_context():
    admin = User.create(
        commit=True,
        **{
            'email': 'admin',
            'password': '1234',
            'role': USER_ROLE.admin,
            'is_active': True
        }
    )
    if not admin:
        print('Failed to create admin user')
    else:
        print('Admin user created successfully')
"
```

## Development Helpers

### Add ReactJS Dependencies

```bash
docker-compose exec client-app npm install <package-name> --save-prod
docker-compose exec client-app npm i --package-lock-only
```

### Create and Apply Flask Migrations

```bash
# Initialize migrations (first time only)
docker-compose exec server-app flask db init

# Create a new migration
docker-compose exec server-app flask db migrate -m <migration-message>

# Apply migrations
docker-compose exec server-app flask db upgrade
```

### Drop the Database Schema

```bash
docker-compose exec server-app python -c "
from app.app import app, db

with app.app_context():
    db.drop_all()
    db.metadata.reflect(bind=db.engine)
    db.metadata.drop_all(bind=db.engine)

    with db.engine.connect() as conn:
        conn.execute(db.text('DROP TABLE IF EXISTS alembic_version;'))
"
```

### Fix `migrations/versions` Permissions

```bash
sudo chown -R $USER:$USER server/migrations/versions
```

### Cloudflare Tunnel Setup

Client App:

```bash
cloudflared tunnel --url http://localhost:80 --protocol http2
```

Server App:

```bash
cloudflared tunnel --url http://localhost:8000 --protocol http2
```

### Merge `main` into `prod`

```bash
git checkout prod
git fetch origin
git merge --no-commit --no-ff main
```

Manually resolve all the merge conflicts.

## Deployment Guide

The production-ready Docker Compose stack includes:

-   **Caddy** (`reverse-proxy`) as the public reverse proxy, TLS terminator, and access log writer.
-   **server-app** (Flask backend) with readiness/health checks and persistent config.
-   **client-app** (React frontend) served through its own container.
-   **Redis** for caching, task queues, and rate limiting.
-   **Grafana Loki** for storing application logs, populated by the shared `app_logs` volume.
-   **Grafana Alloy** for forwarding logs from `app_logs` to Loki.
-   **Grafana** for visualising dashboards sourced from Loki and other datasources.

> **PostgreSQL is not deployed in the production stack.** Use a managed Postgres instance (or any external database service) and supply its connection string to `server-app`.

### 1. Prerequisites

1. A Linux host with Docker Engine and the docker-compose plugin installed.
2. A DNS record pointing your production domain to the host so Caddy can issue HTTPS certificates. For local smoke tests you can keep `localhost`.
3. Access credentials for the managed PostgreSQL service (hostname, database name, username, and password).
4. (Optional) Firewall rules prepared for ports 80/443 (Caddy) and 3000/12345 if you plan to expose Grafana or Alloy externally. Restrict monitoring ports to trusted IPs when possible.

### 2. Configure Environment Variables

1. Copy each example file and adjust the secrets:
    ```bash
    cp server/.example.env server/.env
    cp client/.example.env client/.env
    cp redis/.example.env redis/.env
    cp caddy/.example.env caddy/.env
    cp monitoring/grafana/.example.env monitoring/grafana/.env
    ```
    - Set `SERVER_SECRET_KEY` to a strong random value.
    - Replace `SERVER_DATABASE_URI` with the managed database DSN
    - Ensure Redis URIs match the password stored in `redis/.env`.
2. Provide production credentials for Grafana by editing `monitoring/grafana/.env` (the repository version is for local use only):
    - Set `GF_SECURITY_ADMIN_USER` and `GF_SECURITY_ADMIN_PASSWORD` to per-environment credentials.

### 3. Build and Start the Stack

Check out the production configuration (for example, the `prod` branch) that defines the reverse proxy and monitoring services, then run:

```bash
docker-compose build
docker-compose up -d
```

This command starts the core application services **without** the monitoring stack.

**To include monitoring services**, use the `--profile` flag:

```bash
docker-compose --profile monitoring up -d
```

You can also start just the monitoring services separately after the main stack is running:

```bash
docker-compose up -d loki alloy grafana
```

**To stop only the monitoring services** without affecting the core application:

```bash
docker-compose stop loki alloy grafana
```

Caddy will request HTTPS certificates once the domain resolves to your host and ports 80/443 are reachable.

### 4. Apply Database Migrations and Bootstrap an Admin

Run migrations inside the backend container after it reports healthy:

```bash
docker-compose exec server-app flask db upgrade
```

Create an administrator account (update email/password for your environment):

```bash
docker-compose exec server-app python -c "
from app.app import app
from app.utils.enum import USER_ROLE
from app.models.user import User

with app.app_context():
    admin = User.create(
        commit=True,
        **{
            'email': 'admin',
            'password': '1234',
            'role': USER_ROLE.admin,
            'is_active': True
        }
    )
    if not admin:
        print('Failed to create admin user')
    else:
        print('Admin user created successfully')
"
```

### 5. Monitor Health, Logs, and Dashboards

-   Check container status:
    ```bash
    docker-compose ps
    ```
-   Inspect Caddy and backend logs streamed into the shared `app_logs` volume:
    ```bash
    docker-compose logs caddy
    docker-compose logs server-app
    ```
-   Access Grafana on `http://<your-domain>:3000` (or `http://localhost:3000` in local tests) using the credentials from `monitoring/grafana/.env`. Imported dashboards read application logs from Loki. Consider fronting Grafana with Caddy or restricting the port in your firewall for production.
-   Grafana Alloy exposes its admin UI on port `12345` if you need to verify log pipelines.
-   The backend exposes `/health`, proxied by Caddy at `https://<your-domain>/health` for external monitoring.

### 6. Deployment Checklist for Cloud Environments

1. Provision the host and ensure inbound ports 80, 443, and any monitoring ports you need are open.
2. Install Docker Engine and docker-compose.
3. Pull the production branch (or copy `docker-compose.yml`, `Caddyfile`, monitoring config, and populated `.env` files) onto the host. Persist named volumes (`caddy_data`, `caddy_config`, `redis_data`, `loki_data`, `grafana_data`, `alloy_data`, `app_logs`) on durable storage if you require backups.
4. Update DNS so `CADDY_DOMAIN` resolves to the host. Wait for propagation before starting the stack.
5. (Optional) Build images locally and push to a registry, or build directly on the host with `docker-compose build --pull`.
6. Launch the stack with `docker-compose up -d` and monitor logs until Caddy reports `serving initial configuration`.
7. Schedule database backups using your managed PostgreSQL provider and monitor `docker-compose ps` for automatic restarts triggered by failed health checks.

## Monitoring Configuration References

-   The production `Caddyfile` routes all traffic to `client-app` and writes JSON logs to `/var/log/app/caddy`. Alloy mounts the same volume to ship logs into Loki.
-   When using the production branch, Grafana provisioning files under `monitoring/grafana/provisioning/` define datasources and dashboards. Update them to add new panels or data sources as your deployment evolves.
