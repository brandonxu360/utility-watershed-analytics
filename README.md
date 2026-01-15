# Utility Watershed Analytics Web App

## Project Overview
A full-stack web app providing water utility management with interactive geospatial insights and analytics for informed decision-making in water resource management.

The key technologies include:

* **Frontend**: React with TypeScript (ReactTS) using [Vite](https://vite.dev/) for fast builds and hot module replacement.
* **Backend**: Django with [Django REST Framework (DRF)](https://www.django-rest-framework.org/), [GeoDjango](https://docs.djangoproject.com/en/5.1/ref/contrib/gis/), and [DRF-GIS](https://github.com/openwisp/django-rest-framework-gis/tree/master) for geospatial functionality.
* **Database**: PostgreSQL with [PostGIS](https://postgis.net/) enabled for spatial data.
* **Tooling**: [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) for containerized services, with development containers ([devcontainers](https://code.visualstudio.com/docs/devcontainers/containers)) integrated into VS Code.

The application is deployed on a managed virtual machine provided by the [University of Idaho’s Research Computing and Data Services (RCDS)](https://hpc.uidaho.edu/index.html), using Docker Compose and Caddy for secure reverse proxying. 

For more deployment information, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Development Setup
This section guides developers on how to set up, configure, and run the application locally using Docker and VSCode Dev Containers.

### System Requirements
* **Hardware**: The hardware requirements have not been tested but the majority of modern computers with at least 4GB of RAM should suffice.
* **Software**: Docker and VS Code installed with the Dev Containers extension.

### Prerequisites
1. **Install Docker**: Follow instructions for your operating system to install [Docker](https://docs.docker.com/get-started/get-docker/). Note that Linux systems can install the leaner [Docker Engine](https://docs.docker.com/engine/install/) and use the Docker CLI, which may be preferable.
2. **Install VS Code**: Download and install [VS Code](https://code.visualstudio.com/).
3. **Install Extensions**: Install the [Dev Containers](vscode:extension/ms-vscode-remote.remote-containers) extension from the VS Code marketplace.
4. **Clone Repository**:
```bash
git clone https://github.com/brandonxu360/utility-watershed-analytics.git
cd utility-watershed-analytics
```
5. **Environment Variables**: Ensure that an `.env` file exists in the root of your project with the following attributes. Example values are provided below for convenience, do not use these values in production:
```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8000/api

POSTGRES_USER=admin
POSTGRES_PW=password
POSTGRES_DB=pg4django
PGADMIN_MAIL=admin@example.com
PGADMIN_PW=password

DJANGO_SUPERUSER_USERNAME=devcontainer
DJANGO_SUPERUSER_EMAIL=devcontainer@gmail.com
DJANGO_SUPERUSER_PASSWORD=password

DJANGO_SECRET_KEY=django-insecure-1#t+05xjtk9endkv$*of#hr(3y@=45=p8i%1f4erojjbc(c7wa
DEBUG=true
```

6. **pgAdmin Server Definition**: Though not required, a JSON file in the root directory with the following attributes can be used to automatically define the server for pgAdmin for convenience. Please name the file `pgadmin-servers.json`. Notice the username and password correspond with the postgres database username (`POSTGRES_USER`) and password (`POSTGRES_PW`) defined in the `.env` file. Again, be aware that this config could expose sensitive data (database password) if mishandled in production.
```json
{
    "Servers": {
        "1": {
            "Name": "Local PostGIS",
            "Group": "Servers",
            "Host": "db",
            "Port": 5432,
            "MaintenanceDB": "postgres",
            "Username": "admin",
            "Password": "password",
            "SSLMode": "prefer"
        }
    }
}
```
7. **Data**: Watershed data (watersheds, subcatchments, channels) is loaded into the database via a Django management command. In development, the entrypoint script automatically loads a sample subset of watersheds on the first container startup. For production or custom data loading, see the Data Management section below.

The [data-manifest.yaml](server/data-manifest.yaml) defines all available watershed data sources and their download locations.

### Usage
1. **Start Docker Services**: Use the provided `compose.yml` to start all the services. **Note**: If you are using VSCode with Dev Containers, you can skip this step—containers will start automatically when you open the project in a devcontainer.

```bash
docker compose up
```
2. **Verify Services**:
* **Client**: Access the React app at http://localhost:5173.
* **Server**: Access the Django API at http://localhost:8000. Note that this base url isn't mapped to a pattern - refer to url patterns for meaningful urls.
* **pgAdmin**: Access pgAdmin at http://localhost:5050. Login with the credentials provided in the `.env` file and add the server if the `pgadmin-server.json` is not provided.
* **Database**: PostgreSQL is running at localhost:5432.
3. **Devcontainers Setup (VSCode)**: VSCode will detect the devcontainer configurations upon opening the project and will prompt you to reopen the project in a container. Choose the container based on which service you want to work on (you can open another VSCode window to work on both at the same time). You can reopen the project at any point without being prompted by opening the VSCode Command Palette and using `Dev Containers: Reopen in Container`.

**Additional Notes**:
* On first container startup, the development entrypoint script automatically:
  * Runs database migrations
  * Creates a Django superuser (using environment variables)
  * Loads a sample subset of watersheds for development
* Subsequent container restarts skip the first-time initialization tasks.

## Development Container Management

### Restarting Application Containers (Preserving Database)
For code changes or general app restarts without affecting the database:

```bash
# Restart app containers only (client + server)
docker compose restart client server

# Rebuild and restart for code changes
docker compose up --build client server -d

# View logs for app containers
docker compose logs -f client server
```

### Data Management (Development)

The application uses a two-stage data pipeline:
1. **Data Download** - Downloads GeoJSON/Parquet files from remote sources to a shared Docker volume
2. **Data Loading** - Loads data into the PostgreSQL/PostGIS database

The loader uses a **local-first approach**: it checks for cached files in the shared volume first, then falls back to fetching from remote URLs if local files aren't available.

#### Pre-Caching Data (Optional)

If you need to reload data into the database (e.g., after clearing the DB or first-time setup on a new volume), you can pre-cache the data files to avoid repeated network fetches:

```bash
# Download and cache development data subset
docker compose --profile data-management run --rm data-downloader
```

The `--dev` flag (default) downloads the same subset loaded by the development entrypoint. This cached data persists in the `watershed_data` volume until the volume is removed.

#### Data Downloader Options

The downloader's default is `--dev`, but you can override it by passing different arguments:

```bash
# Download development subset (default, recommended)
docker compose --profile data-management run --rm data-downloader
# or explicitly: docker compose --profile data-management run --rm data-downloader --dev

# Download specific watersheds by runid
docker compose --profile data-management run --rm data-downloader --runids <runid1> <runid2>

# Download ALL data (warning: very large, production only)
docker compose --profile data-management run --rm data-downloader --all
```

#### Loading Watershed Data
```bash
# Load development subset (uses cache if available, else fetches remote)
docker compose exec server python manage.py load_watershed_data --runids <runid1> <runid2>

# Preview what would be loaded (safe to test)
docker compose exec server python manage.py load_watershed_data --dry-run

# Force reload data (clears existing data first)
docker compose exec server python manage.py load_watershed_data --force

# Verbose output for debugging
docker compose exec server python manage.py load_watershed_data --verbosity=2
```

#### Resetting Data
```bash
# Remove all services and data (database + downloaded files)
docker compose down -v

# Remove only the data file volume (clears cache)
docker volume rm utility-watershed-analytics_watershed_data

# Force reload data into database
docker compose exec server python manage.py load_watershed_data --force

# Force reload specific watersheds only
docker compose exec server python manage.py load_watershed_data --force --runids <runid1> <runid2>
```

### Full Container Management
```bash
# Stop all containers
docker compose down

# Start all containers
docker compose up -d

# Rebuild all containers
docker compose up --build -d

# View all logs
docker compose logs -f
```

> **Note:** For production deployment and container management, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Troubleshooting Tips
1. **Docker Issues**:
* Run `docker compose down` and `docker compose up --build` to reset containers.
* Check logs with `docker compose logs`.
2. **Data Issues**: a common point of failure may be achieving the correct data configuration.
* If running into `relation does not exist` errors, you may need to run migrations to sync the database:
    ```bash
    docker compose exec server python manage.py migrate
    ```

## Running Tests

As the featureset expands, we're working on integrating a test-driven development approach.

To run backend tests (Django/DRF), use either of the following commands:

```bash
docker compose exec server python manage.py test
```

Or, if you are inside the backend container:

```bash
python manage.py test
```
