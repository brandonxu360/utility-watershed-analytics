# https://docs.djangoproject.com/en/5.1/ref/contrib/gis/install/
# We need the following for GeoDjango:
#   Python and Django (GeoDjango included with Django)
#   Spatial database (not a responsibility of this dockerfile, see compose)
#   Geospatial libraries (GEOS, GDAL, PROJ)
# All requirements for GeoDjango should be fulfilled in this 
# DockerFile (excluding the spatial database, which will live 
# in a seperate container)

# Official GDAL image, comes with PROJ (GEOS not included)
FROM ghcr.io/osgeo/gdal:alpine-small-latest

# Debugging purposes - Python output straight to terminal
ENV PYTHONUNBUFFERED=1

# Install Python, PIP, GEOS, and git
RUN apk add --no-cache python3 py3-pip geos git

# Create and activate virtual environment
RUN python3 -m venv /venv

# Set environment path so virtual environment is used by default
# when running python commands
ENV VIRTUAL_ENV=/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Configuration to allow django-admin to function properly
ENV PYTHONPATH=/app/server
ENV DJANGO_SETTINGS_MODULE=server.settings

# Install Python dependencies (notably Django and psycopg)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Make sure scripts in venv are executable
RUN chmod +x /venv/bin/*

# Set up entrypoint shell script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create non-root user
RUN addgroup -g 1000 devcontainer && \
    adduser -D -u 1000 -G devcontainer devcontainer

USER devcontainer