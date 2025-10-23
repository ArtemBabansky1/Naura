# Naura Personal CRM - Backend API

A FastAPI-based Personal CRM system for managing professional relationships with OAuth contact synchronization.

## Features

- **Authentication**: Email/password registration and login with JWT tokens
- **OAuth Integration**: Connect Google, LinkedIn, Facebook, VK accounts with real OAuth flows
- **Contact Management**: Full CRUD operations with search, filtering, and pagination
- **Contact Sync**: Background synchronization from connected accounts using Celery
- **User Profiles**: Profile management with avatar upload
- **Contact Deduplication**: Smart deduplication across multiple sources
- **Email Notifications**: Welcome emails and password reset with HTML templates
- **Background Jobs**: Celery-powered async tasks for contact sync and maintenance

## Tech Stack

- **Backend**: FastAPI 0.104+, Python 3.11+
- **Database**: PostgreSQL 15+ with SQLAlchemy 2.0+
- **Cache**: Redis 7+
- **Background Jobs**: Celery 5+
- **Authentication**: JWT tokens with OAuth2 support

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database and Redis URLs:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/naura
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key-here
APP_SECRET_KEY=your-app-secret-here
```

### 3. Database Setup

Run Alembic migrations:

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 4. Run Development Server

#### Option 1: Automated Start (Recommended)
```bash
./scripts/start_dev.sh
```

#### Option 2: Manual Start
```bash
# Start API server
python run.py

# In separate terminals:
# Start Celery worker
celery -A app.worker worker --loglevel=info

# Start Celery beat (for periodic tasks)
celery -A app.worker beat --loglevel=info
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/api/v1/docs
- **Health**: http://localhost:8000/health

To stop all services:
```bash
./scripts/stop_dev.sh
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/oauth/{provider}` - OAuth login/registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### User Profile
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update user profile
- `POST /api/v1/users/me/avatar` - Upload avatar
- `DELETE /api/v1/users/me` - Delete account

### Contacts
- `GET /api/v1/contacts` - List contacts with search/filter
- `GET /api/v1/contacts/{id}` - Get contact details
- `POST /api/v1/contacts` - Create new contact
- `PATCH /api/v1/contacts/{id}` - Update contact
- `DELETE /api/v1/contacts/{id}` - Archive contact

### Connected Accounts
- `GET /api/v1/accounts` - List connected accounts
- `POST /api/v1/accounts/connect/{provider}` - Connect OAuth account
- `POST /api/v1/accounts/{id}/sync` - Trigger contact sync
- `GET /api/v1/accounts/{id}/sync-status` - Check sync status
- `DELETE /api/v1/accounts/{id}` - Disconnect account

## Database Schema

### Core Tables
1. **users** - User accounts and profiles
2. **contacts** - Centralized contact storage
3. **user_contacts** - User-specific contact data (tags, notes)
4. **connected_accounts** - OAuth tokens and sync status
5. **password_reset_tokens** - Password reset flow

## Development

### Code Style
```bash
# Format code
black app/
isort app/

# Type checking
mypy app/
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## OAuth Setup

### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable People API
3. Create OAuth2 credentials
4. Add to `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### LinkedIn
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create app with Sign In with LinkedIn
3. Add to `.env`: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`

### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app with Facebook Login
3. Add to `.env`: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`

### VK
1. Go to [VK Developers](https://dev.vk.com/)
2. Create app with VK Connect
3. Add to `.env`: `VK_APP_ID`, `VK_APP_SECRET`

## Background Jobs

The application uses Celery for background task processing:

### Contact Sync Jobs
- **sync_contacts_from_account**: Imports contacts from OAuth providers
- Runs automatically when connecting new accounts
- Can be triggered manually via API

### Email Jobs  
- **send_welcome_email**: Sent on user registration
- **send_password_reset_email**: Sent on password reset request

### Maintenance Jobs
- **refresh_oauth_tokens**: Refreshes expiring OAuth tokens (every 6 hours)
- **cleanup_expired_tokens**: Removes expired password reset tokens (daily)

### Monitoring Jobs
```bash
# View active tasks
celery -A app.worker inspect active

# View task stats
celery -A app.worker inspect stats

# View scheduled tasks
celery -A app.worker inspect scheduled
```

## Contact Deduplication

The system uses intelligent deduplication when importing contacts:

1. **LinkedIn ID** match (highest priority)
2. **Facebook ID** match
3. **VK ID** match  
4. **Email** exact match
5. **Name + Company** fuzzy match

This ensures contacts from multiple sources are merged correctly.

## Production Deployment

### Docker
```bash
# Build image
docker build -t naura-api .

# Run container
docker run -p 8000:8000 naura-api
```

### Environment Variables
See `.env.example` for all required environment variables.

## API Documentation

Interactive API documentation is available at `/api/v1/docs` when running the server.

## License

Private - Naura Personal CRM