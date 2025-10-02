# https://docs.djangoproject.com/en/5.1/ref/contrib/gis/install/
# We need the following for GeoDjango:
#   Python and Django (GeoDjango included with Django)
#   Spatial database (not a responsibility of this dockerfile, see compose)
#   Geospatial libraries (GEOS, GDAL, PROJ)
# All requirements for GeoDjango should be fulfilled in this 
# DockerFile (excluding the spatial database, which will live 
# in a seperate container)

# Official GDAL image, comes with PROJ (GEOS not included)
# Base stage with common dependencies - this is a multistage dockerfile to 
# support both development and production environments
FROM ghcr.io/osgeo/gdal:alpine-small-latest AS base

# Debugging purposes - Python output straight to terminal
ENV PYTHONUNBUFFERED=1

# Install Python, PIP, GEOS, and git
RUN apk add --no-cache python3 py3-pip geos git

# Create non-root user
RUN addgroup -g 1000 devcontainer && \
    adduser -D -u 1000 -G devcontainer devcontainer

WORKDIR /app/server

# Create virtual environment directory and set ownership
RUN python3 -m venv /venv && \
    chown -R devcontainer:devcontainer /venv

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

# Development stage
FROM base AS development

# Copy development entrypoint
COPY entrypoint.dev.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER devcontainer

# Production stage  
FROM base AS production

# Copy application files
COPY . .

# Copy production entrypoint
COPY entrypoint.prod.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER devcontainer