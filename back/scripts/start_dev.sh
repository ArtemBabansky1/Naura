#!/bin/bash

# Naura Personal CRM - Development Server Startup Script

echo "🚀 Starting Naura Personal CRM Development Environment"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration"
    exit 1
fi

# Check if virtual environment is active
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  No virtual environment detected. Activating..."
    if [ -f venv/bin/activate ]; then
        source venv/bin/activate
    elif [ -f .venv/bin/activate ]; then
        source .venv/bin/activate
    else
        echo "❌ No virtual environment found. Please create one:"
        echo "   python -m venv venv"
        echo "   source venv/bin/activate"
        echo "   pip install -r requirements.txt"
        exit 1
    fi
fi

# Install dependencies if needed
echo "📦 Checking dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

# Run setup check
echo "🔍 Running setup check..."
python check_setup.py

if [ $? -ne 0 ]; then
    echo "❌ Setup check failed. Please fix issues above."
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

if [ $? -ne 0 ]; then
    echo "⚠️  Database migration failed. Creating initial migration..."
    alembic revision --autogenerate -m "Initial migration"
    alembic upgrade head
fi

# Start services
echo "🚀 Starting development servers..."

# Start Celery worker in background
echo "📋 Starting Celery worker..."
celery -A app.worker worker --loglevel=info --detach --pidfile=celery.pid

# Start Celery beat for periodic tasks
echo "⏰ Starting Celery beat..."
celery -A app.worker beat --loglevel=info --detach --pidfile=celerybeat.pid

# Start FastAPI server
echo "🌐 Starting FastAPI server..."
echo "API will be available at: http://localhost:8000"
echo "API docs will be available at: http://localhost:8000/api/v1/docs"
echo ""
echo "Press Ctrl+C to stop all services"

python run.py