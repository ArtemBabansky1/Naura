#!/usr/bin/env python3
"""
Quick setup check for Naura Personal CRM API
"""

import os
import sys
from pathlib import Path

def check_environment():
    """Check if environment is properly configured."""
    print("🔍 Checking environment setup...")
    
    # Check if .env file exists
    if Path(".env").exists():
        print("✅ .env file found")
    else:
        print("❌ .env file not found - please copy .env.example to .env")
        return False
    
    # Check required environment variables
    required_vars = [
        "DATABASE_URL",
        "REDIS_URL", 
        "JWT_SECRET_KEY",
        "APP_SECRET_KEY",
        "CELERY_BROKER_URL",
        "CELERY_RESULT_BACKEND"
    ]
    
    from app.core.config import settings
    
    missing_vars = []
    for var in required_vars:
        if not hasattr(settings, var) or not getattr(settings, var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print("✅ All required environment variables set")
    
    return True


def check_database():
    """Check database connection."""
    print("\n🗄️  Checking database connection...")
    
    try:
        from app.core.database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


def check_redis():
    """Check Redis connection."""
    print("\n🔴 Checking Redis connection...")
    
    try:
        from app.core.redis import redis_client
        
        redis_client.ping()
        print("✅ Redis connection successful")
        return True
        
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        return False


def check_imports():
    """Check if all imports work."""
    print("\n📦 Checking imports...")
    
    try:
        from app.main import app
        from app.models import User, Contact, UserContact, ConnectedAccount
        from app.services.oauth import GoogleOAuth, LinkedInOAuth
        from app.tasks.contact_sync import sync_contacts_from_account
        print("✅ All imports successful")
        return True
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False


def main():
    """Run all checks."""
    print("🚀 Naura Personal CRM - Setup Check\n")
    
    checks = [
        check_environment,
        check_imports,
        check_database,
        check_redis
    ]
    
    passed = 0
    total = len(checks)
    
    for check in checks:
        if check():
            passed += 1
    
    print(f"\n📊 Setup Check Results: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 Setup is complete! You can now start the API server.")
        print("\nNext steps:")
        print("1. Run migrations: alembic upgrade head")
        print("2. Start the API: python run.py")
        print("3. Start Celery worker: celery -A app.worker worker --loglevel=info")
        print("4. Visit docs: http://localhost:8000/api/v1/docs")
    else:
        print("❌ Setup incomplete. Please fix the issues above.")
        sys.exit(1)


if __name__ == "__main__":
    main()