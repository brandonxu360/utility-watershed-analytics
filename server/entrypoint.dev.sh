#!/bin/sh

echo "=== DEVELOPMENT STARTUP ==="

# Run migrations
echo "Running Migrations"
python manage.py makemigrations --noinput
python manage.py migrate --noinput

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

    python manage.py load_watershed_data --verbosity=2 \
    --runids 'batch;;nasa-roses-2025;;or,wa-108' \
            'batch;;nasa-roses-2025;;wa-174' \
            'batch;;nasa-roses-2025;;or-6' \
            'batch;;nasa-roses-2025;;or-202'



    # Touch the flag file to indicate this logic has been run
    touch "$CONTAINER_ALREADY_STARTED"

else
    echo "-- Container already initialized, skipping first-time tasks --"
fi

echo "=== DEVELOPMENT STARTUP COMPLETE ==="
echo "Starting Django development server..."
exec "$@"