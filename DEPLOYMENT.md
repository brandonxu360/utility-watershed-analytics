# Deployment Guide
This document provides information on how the Utility Watershed Analytics application is deployed in a production environment and provides guidelines for maintaining and managing the setup.

## Hosting Environment
The application is deployed on a virtual machine (VM) provided by the [University of Idaho's Research Computing and Data Services (RCDS)](https://hpc.uidaho.edu/index.html).

**Server Details:**
* **Hostname:** wepp3
* **OS:** Ubuntu 24.04.2 LTS
* **Virtualization:** VMware
* **Public Domain:** `unstable.wepp.cloud`

## CI/CD Overview

Deployments are automated via **GitHub Actions** with a self-hosted runner on the production VM.

### Workflow Summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `client-ci.yml` | PR to `main` (client changes) | Build & test frontend |
| `server-ci.yml` | PR to `main` (server changes) | Build & test backend |
| `deploy.yml` | Push to `main` | Build & deploy to production |

### Automatic Deployment

When code is pushed to the `main` branch:

1. **CI checks run** - Server and client CI workflows validate the build
2. **Deploy job starts** - Runs on the self-hosted runner on the production VM
3. **Environment setup** - Creates `.env` from GitHub secrets (`PRODUCTION_ENV`)
4. **Frontend rebuild** - Builds React static files into shared volume
5. **Services restart** - Rebuilds server container and restarts Caddy
6. **Health check** - Verifies services are running
7. **Cleanup** - Removes temporary `.env` file

### Manual Deployment

You can also trigger deployment manually from the GitHub Actions UI:

1. Go to **Actions** → **Build & Deploy Client/Server**
2. Click **Run workflow** → Select `main` branch → **Run workflow**

## Production Architecture

The production deployment consists of four main services orchestrated with Docker Compose:

1. **Frontend Build** - Builds React static files into a shared volume
2. **Backend (Django)** - API server running with Gunicorn
3. **Database (PostgreSQL + PostGIS)** - Geospatial database
4. **Reverse Proxy (Caddy)** - Serves static frontend files and proxies API requests

The frontend React application is built in a dedicated container that outputs static files to a shared Docker volume. Caddy serves these static files directly while proxying API routes (`/api/*`, `/admin/*`, `/silk/*`) to the Django backend.

To ensure the Docker Compose stack autostarts on VM reboot, a [systemd service](utility-watershed-analytics.service) is configured on the host VM.

## Server Access & Manual Operations

For tasks that require direct server access (data management, debugging, etc.):

### Accessing the Server
SSH into the VM using your RCDS-provided credentials:
```bash
ssh your_netid@unstable.wepp.cloud
```
> You may need to connect to a VPN or authenticate to a firewall first.

### Project Location

The project is managed by the GitHub Actions self-hosted runner and is located at:

```bash
cd /workdir/actions-runner/_work/utility-watershed-analytics/utility-watershed-analytics
```

> **Note:** The nested directory structure is standard for GitHub Actions runners. The runner manages this directory, so avoid making manual changes that could conflict with automated deployments.

## Data Management

Data loading is **not automated** by CI/CD and must be done manually when data updates are needed.

The loader uses a **local-first approach**: it checks for cached files first, then falls back to fetching from remote URLs.

### Running Long Data Operations

Data loading can take a significant amount of time. Use `tmux` to run commands in a persistent session that survives SSH disconnections:

```bash
# Start a new tmux session
tmux new -s data-load

# Run your data loading command inside tmux
cd /workdir/actions-runner/_work/utility-watershed-analytics/utility-watershed-analytics
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data

# Detach from session: Press Ctrl+B, then D
# You can now safely disconnect from SSH

# Later, reattach to check progress
tmux attach -t data-load
```

### Download Data Files (Optional)

Pre-download data files to avoid repeated network fetches when reloading the database. Downloaded files are cached in `server/server/watershed/data/` and persist in the named volume.

```bash
# Download ALL production data (recommended for production)
docker compose -f compose.prod.yml exec server python manage.py download_data --all

# Or download specific watersheds by runid
docker compose -f compose.prod.yml exec server python manage.py download_data --runids <runid1> <runid2>
```

### Load Data into Database

```bash
# Load ALL watersheds (production - discovers all from API)
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --all

# Load specific watersheds by runid
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --runids <runid1> <runid2>

# Load development subset only (defaults if no args provided - testing only)
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data

# Preview what would be loaded (safe to test)
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --dry-run

# Force reload even if data already exists
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --force --all
```

### Complete Data Setup (Download + Load)

For initial deployment or major data updates:

```bash
# 1. (Optional) Pre-download all production data files to avoid network fetches
docker compose -f compose.prod.yml exec server python manage.py download_data --all

# 2. Load all watershed data into database
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --all
```

**Note:** The download step is optional — the loader will fetch from remote URLs if cached files aren't available. Pre-downloading can be faster for subsequent reloads.

### Major Schema or Data Source Updates

When updating data sources or making significant schema changes, you may need to fully reset and reload the data:

```bash
# 1. Stop services and remove containers (⚠️ this WIPES the database - see note below)
docker compose -f compose.prod.yml down

# 2. Re-run the deploy action from GitHub Actions UI to rebuild containers

# 3. After deployment completes, reload all watershed data
tmux new -s data-load
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --force --all
```

> ⚠️ **Important:** The database currently has NO persistent volume configured. Running `docker compose down` removes the database container and **all data is lost**. This is acceptable while only loading watershed data, but a persistent volume must be added before storing user data.

> **Future Consideration:** Before adding user data:
> 1. Add a named volume for PostgreSQL data persistence in `compose.prod.yml`
> 2. Implement migration strategies that preserve user data while updating watershed/geospatial data
> 3. Consider separating user data into distinct tables with foreign key relationships that can survive watershed data reloads

## Useful Commands

```bash
# View service logs
docker compose -f compose.prod.yml logs -f [service_name]

# Check service status
docker compose -f compose.prod.yml ps

# Stop all services
docker compose -f compose.prod.yml down

# Start services
docker compose -f compose.prod.yml up -d

# Restart a specific service
docker compose -f compose.prod.yml restart server
```

## Troubleshooting

### Deployment Failed
Check the GitHub Actions logs for the failed workflow run. Common issues:
- Docker build failures
- Missing environment secrets
- Service health check failures

### Services Not Starting
```bash
# Check container status and logs
docker compose -f compose.prod.yml ps
docker compose -f compose.prod.yml logs server
```

### Database Issues
```bash
# Check database connectivity
docker compose -f compose.prod.yml exec server python manage.py check

# Run migrations manually if needed
docker compose -f compose.prod.yml exec server python manage.py migrate
```

## Acknowledgements
Thanks to the University of Idaho RCDS team for hosting support.
