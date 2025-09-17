#!/bin/sh

echo "=== DEVELOPMENT STARTUP ==="

# Run migrations
echo "Running Migrations"
python manage.py makemigrations
python manage.py migrate

CONTAINER_ALREADY_STARTED="/tmp/container_already_started"
if [ ! -e $CONTAINER_ALREADY_STARTED ]; then
    echo "-- First container startup tasks --"
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

    # Check if watershed data exists, if not provide helpful message
    if [ -d "/app/server/watershed/data" ] && [ "$(ls -A /app/server/watershed/data 2>/dev/null)" ]; then
        echo "Watershed data found, loading into database..."
        python manage.py load_watershed_data --verbosity=2
    else
        echo "   No watershed data found in volume."
        echo "   To download data, run in another terminal:"
        echo "   docker compose --profile data-management run --rm data-downloader"
        echo "   Then restart this container or run:"
        echo "   docker compose exec server python manage.py load_watershed_data"
    fi

    # Touch the flag file to indicate this logic has been run
    touch "$CONTAINER_ALREADY_STARTED"

else
    echo "-- Container already initialized, skipping first-time tasks --"
fi

echo "=== DEVELOPMENT STARTUP COMPLETE ==="
echo "Starting Django development server..."
exec "$@"