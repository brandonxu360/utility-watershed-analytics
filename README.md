# Utility Watershed Analytics Web App

## Project Overview
A full-stack web app providing water utility management with interactive geospatial insights and analytics for informed decision-making in water resource management.

The key technologies include:

* **Frontend**: React with TypeScript (ReactTS) using [Vite](https://vite.dev/) for fast builds and hot module replacement.
* **Backend**: Django with [Django REST Framework (DRF)](https://www.django-rest-framework.org/), [GeoDjango](https://docs.djangoproject.com/en/5.1/ref/contrib/gis/), and [DRF-GIS](https://github.com/openwisp/django-rest-framework-gis/tree/master) for geospatial functionality.
* **Database**: PostgreSQL with [PostGIS](https://postgis.net/) enabled for spatial data.
* **Tooling**: [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) for containerized services, with development containers ([devcontainers](https://code.visualstudio.com/docs/devcontainers/containers)) integrated into VS Code.

## System Requirements
* **Hardware**: The hardware requirements have not been tested but the majority of modern computers with at least 4GB of RAM should suffice.
* **Software**: Docker and VS Code installed with the Dev Containers extension.

## Prerequisites
1. **Install Docker**: Follow instructions for your operating system to install [Docker](https://docs.docker.com/get-started/get-docker/). Note that Linux systems can install the leaner [Docker Engine](https://docs.docker.com/engine/install/) and use the Docker CLI, which may be preferable.
2. **Install VS Code**: Download and install [VS Code](https://code.visualstudio.com/).
3. **Install Extensions**: Install the [Dev Containers](vscode:extension/ms-vscode-remote.remote-containers) extension from the VS Code marketplace.
4. **Clone Repository**:
```bash
git clone https://github.com/brandonxu360/fullstack-gis-webapp.git
cd fullstack-gis-webapp
```
5. **Environment Variables**: Ensure the an `.env` file exists in the root of your project with the following attributes. Example values are provided below for convenience, do not use these values in production:
```env
POSTGRES_USER=admin
POSTGRES_PW=password
POSTGRES_DB=pg4django
PGADMIN_MAIL=admin@example.com
PGADMIN_PW=password

DJANGO_SUPERUSER_USERNAME=devcontainer
DJANGO_SUPERUSER_EMAIL=devcontainer@gmail.com
DJANGO_SUPERUSER_PASSWORD=password
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
7. **Data**: Grab the data [here](https://wepp.cloud/share/roger/NASA-Roses/) and download both OR and WA data sets making sure to change their extension to .geojson. Place the watershed data in `fullstack-gis-webapp/server/server/watershed/` and ensure that the folder is named `data`. If a custom data folder is to be used, changes are required for the `load.py` script in the `server` Django project.

## Usage
1. **Start Docker Services**: Use the provided `compose.yml` to start all the services. Note that this is not required, as VSCode devcontainers will automatically start the services upon reopening the project in a container.
```bash
docker compose up --build
```
2. **Verify Services**:
* **Client**: Access the React app at http://localhost:5173.
* **Server**: Access the Django API at http://localhost:8000/admin. Note that the base url is http://localhost:8000, but I don't think there is an endpoint mapped to it.
* **pgAdmin**: Access pgAdmin at http://localhost:5050. Login with the credentials provided in the `.env` file and add the server if the `pgadmin-server.json` is not provided.
* **Database**: PostgreSQL is running at localhost:5432.
3. **Devcontainers Setup (VSCode)**: VSCode will detect the devcontainer configurations upon opening the project and will prompt you to reopen the project in a container. Choose the container based on which service you want to work on (you can open another VSCode window to work on both at the same time). You can reopen the project at any point without being prompted by opening the VSCode Command Palette and using `Dev Containers: Reopen in Container`.

**Additional Notes**:
* All migrations, the creation of a superuser, and loading of the watershed data into the database is automatically handled by the `entrypoint.sh` file on container start.

## Troubleshooting Tips
1. **Docker Issues**:
* Run `docker compose down` and `docker compose up --build` to reset containers.
* Check logs with `docker compose logs`.
2. **Data Issues**: a common point of failure may be achieving the correct data configuration. Ensure that:
* You have the correct data directory at `fullstack-gis-webapp/server/server/watershed/data`
* Review the `load.py` script to see how the data is being handled.



