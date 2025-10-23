#!/bin/bash

# Naura Personal CRM - Stop Development Services

echo "🛑 Stopping Naura Personal CRM Development Services"

# Stop Celery worker
if [ -f celery.pid ]; then
    echo "📋 Stopping Celery worker..."
    kill -TERM $(cat celery.pid)
    rm celery.pid
fi

# Stop Celery beat
if [ -f celerybeat.pid ]; then
    echo "⏰ Stopping Celery beat..."
    kill -TERM $(cat celerybeat.pid)
    rm celerybeat.pid
fi

# Clean up beat schedule file
if [ -f celerybeat-schedule ]; then
    rm celerybeat-schedule
fi

echo "✅ All services stopped"