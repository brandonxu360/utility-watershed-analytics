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

WORKDIR /app

# Install Python, PIP, and GEOS
RUN apk add --no-cache python3 py3-pip geos

# Create an activate virtual environment
RUN python3 -m venv /venv

# Set environment path so virtual environment is used by default
# when running python commands
ENV VIRTUAL_ENV=/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies (notably Django and psycopg)
COPY requirements.txt .
RUN pip install -r requirements.txt

# We use a volume mount in the Compose file instead of COPY here
# COPY . .

# Make sure scripts in venv are executable
RUN chmod +x /venv/bin/*