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
The production deployment consists of three main services orchestrated with Docker Compose:

1. **Backend (Django)** - API server
2. **Database (PostgreSQL + PostGIS)** - Geospatial database
3. **Reverse Proxy (Caddy)** - Serves static frontend files and proxies API requests

The frontend React application is built as static files and served directly by Caddy, while API routes (`/api/*`, `/admin/*`, `/silk/*`) are proxied to the Django backend.

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

### Deploying Changes
#### For Backend/Infrastructure Changes:
```bash
# Navigate to the project directory
cd /workdir/utility-watershed-analytics

# Pull the latest changes
git pull origin main

# Stop current services
docker compose -f compose.prod.yml down

# Rebuild and restart services
docker compose -f compose.prod.yml up --build -d
```

#### For Frontend Changes:
```bash
# Navigate to the project directory
cd /workdir/utility-watershed-analytics

# Pull the latest changes
git pull origin main

# Remove existing build artifacts
sudo rm -rf ./client/build

# Rebuild frontend
docker build -f client/Dockerfile.prod -t client-build-prod client/

# Extract new static files
docker run --rm -u root -v "$PWD/client/build:/out" client-build-prod cp -r /app/client/dist/. /out
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