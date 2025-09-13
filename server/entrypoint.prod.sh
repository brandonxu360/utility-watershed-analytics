#!/bin/sh

echo "=== PRODUCTION STARTUP ==="

#Run migrations
echo "Running Migrations"
python manage.py makemigrations
python manage.py migrate

# Health check
echo "Running health checks..."
python manage.py check --deploy

echo "=== PRODUCTION STARTUP COMPLETE ==="
echo "Starting Gunicorn server..."
exec "$@"