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
```bash
cd /workdir/utility-watershed-analytics
```

## Data Management

Data loading is **not automated** by CI/CD and must be done manually when data updates are needed.

The loader uses a **local-first approach**: it checks for cached files first, then falls back to fetching from remote URLs.

### Download Data Files

The data downloader defaults to `--dev` mode. Override by passing arguments after the service name:

```bash
# Download ALL production data (required for production)
docker compose -f compose.prod.yml --profile data-management run --rm data-downloader --all

# Or download specific watersheds by runid
docker compose -f compose.prod.yml --profile data-management run --rm data-downloader --runids <runid1> <runid2>
```

### Load Data into Database

```bash
# Load all data (first time or updates)
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data

# Preview what would be loaded (safe to test)
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --dry-run

# Force reload even if data already exists
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --force
```

### Complete Data Setup (Download + Load)

For initial deployment or major data updates:

```bash
# 1. Download all production data files
docker compose -f compose.prod.yml --profile data-management run --rm data-downloader --all

# 2. Load data into database
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data
```

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