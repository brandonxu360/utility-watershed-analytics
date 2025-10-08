# Deployment Guide
This document provides information on how the Utility Watershed Analytics application is deployed in a production environment and provides guidelines for maintaining and managing the setup.

## Hosting Environment
The application is deployed on a virtual machine (VM) provided by the [University of Idaho's Research Computing and Data Services (RCDS)](https://hpc.uidaho.edu/index.html), which provides managed services including proactive security patching, firewall management, software installations, and full user support.

**Server Details:**
* **Hostname:** wepp3
* **OS:** Ubuntu 24.04.2 LTS
* **Virtualization:** VMware
* **Public Domain: `unstable.wepp.cloud`** 

## Deployment Overview
The production deployment consists of four main services orchestrated with Docker Compose:

1. **Frontend Build** - Builds React static files into a shared volume
2. **Backend (Django)** - API server
3. **Database (PostgreSQL + PostGIS)** - Geospatial database
4. **Reverse Proxy (Caddy)** - Serves static frontend files and proxies API requests

The frontend React application is built in a dedicated container that outputs static files to a shared Docker volume. Caddy serves these static files directly while proxying API routes (`/api/*`, `/admin/*`, `/silk/*`) to the Django backend.

To ensure the Docker Compose stack autostarts, a [systemd service](/utility-watershed-analytics.service) is configured on the host VM.

## Maintaining the Deployment

### Accessing the Server
SSH into the VM using your RCDS-provided credentials:
```bash
ssh your_netid@unstable.wepp.cloud
```
> You may need to connect to a VPN server or authenticate to a fireware first to successfully connect to the server.

### Navigating to the Project
The application is located at:
```bash
cd /workdir/utility-watershed-analytics
```

### Initial Deployment
Build the frontend, download data, start services, and load data:
```bash
# 1. Build frontend static files
docker compose -f compose.prod.yml run --rm --build frontend-build

# 2. Download data files
docker compose -f compose.prod.yml --profile data-management run --rm data-downloader

# 3. Start all services (database needs to be running for data loading)
docker compose -f compose.prod.yml up -d

# 4. Load data into database
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data
```

### Deploying New Changes
Navigate to the project directory and pull the latest changes:
```bash
cd /workdir/utility-watershed-analytics
git pull origin main
```

#### For Frontend Changes:
Rebuild frontend and restart services
```bash
docker compose -f compose.prod.yml run --rm --build frontend-build
docker compose -f compose.prod.yml restart caddy
```

#### For Backend/Infrastructure Changes (Preserving Database):
```bash
# Restart only application containers (server + caddy)
docker compose -f compose.prod.yml restart server caddy

# Or rebuild and restart for major changes
docker compose -f compose.prod.yml up --build server caddy -d
```

### Data Management
The application includes a containerized data downloader service for managing watershed data files. Data is expected to be managed at the developer's discretion, so less automation exists in this area.

#### Download Data Files
To download the latest watershed data files:

```bash
# Download data files to shared volume
docker compose -f compose.prod.yml --profile data-management run --rm data-downloader
```

#### Load Data into Database
After downloading data files, load them into the database:

```bash
# Load data (first time or updates)
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data

# Preview what would be loaded (safe to test)
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --dry-run

# Force reload even if data already exists
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --force

# Load with detailed output for debugging
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data --verbosity=2
```

#### Complete Data Setup (Download + Load)
For initial deployment or major data updates:

```bash
# 1. Download all data files
docker compose -f compose.prod.yml --profile data-management run --rm data-downloader

# 2. Load data into database
docker compose -f compose.prod.yml exec server python manage.py load_watershed_data
```

### Useful Commands

**View service logs:**
```bash
docker compose -f compose.prod.yml logs -f [service_name]
```

**Check service status:**
```bash
docker compose -f compose.prod.yml ps
```

**Stop all services:**
```bash
docker compose -f compose.prod.yml down
```

**Start services:**
```bash
docker compose -f compose.prod.yml up -d
```

## Acknowledgements
Thanks to the University of Idaho RCDS team for hosting support.