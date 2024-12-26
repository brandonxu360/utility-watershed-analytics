#!/bin/sh

#Run migrations
echo "Running Migrations"
python manage.py makemigrations
python manage.py migrate

# Create superuser
echo "Creating superuser"
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    python manage.py createsuperuser \
        --noinput \
        --username="$DJANGO_SUPERUSER_USERNAME" \
        --email="$DJANGO_SUPERUSER_EMAIL"
else
    echo "Environment variables not set properly, could not create superuser"
fi

# Load the watershed data from shp into database
echo "Loading watershed data"
python manage.py shell << EOF
from server.watershed.load import run
run()
EOF

echo "Starting server"
exec "$@"