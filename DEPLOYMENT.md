# Deployment Guide
This document provides information on how the Utility Watershed Analytics application is deployed in a production environment and provides guidelines for maintaining and managing the setup.

## Hosting Environment
The application is deployed on a virtual machine (VM) provided by the [University of Idaho's Research Computing and Data Services (RCDS)](https://hpc.uidaho.edu/index.html), which provides managed services including proactive security patching, firewall management, software installations, and full user support.

**Server Details:**
* **Hostname:** wepp3
* **OS:** Ubuntu 24.04.2 LTS
* **Virtualization:** VMware
* **Public Domains:** 
    * `unstable.wepp.cloud` (serves frontend/client)
    * `wepp3.nkn.uidaho.edu` (serves backend/server)

## Deployment Overview
The application is deployed via Docker Compose and reverse proxied using [Caddy](https://caddyserver.com/).

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
To deploy updates from GitHub:
```bash
# Navigate to the project directory
cd /workdir/utility-watershed-analytics

# Pull the latest changes
git pull origin main

# Rebuild and restart
docker compose up --build -d
```

## Acknowledgements
Thanks to the University of Idaho RCDS team for hosting support.