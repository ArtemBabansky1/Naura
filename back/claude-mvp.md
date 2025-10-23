# Naura Personal CRM - MVP Technical Specification

## 1. Project Overview

**Product Name:** Naura  
**MVP Goal:** Build a minimal viable personal CRM that allows users to register, connect their social accounts (LinkedIn, Facebook, VK), synchronize contacts, and manage them.

**Technology Stack:** 
- Backend: FastAPI (Python 3.11+)
- Database: PostgreSQL 15+
- Cache: Redis 7+
- Task Queue: Celery + Redis
- Authentication: JWT (PyJWT)

**MVP Timeline:** 6-8 weeks

---

## 2. MVP Scope - Core Modules Only

The MVP focuses on three essential modules based on the flow diagram:

### ✅ Module 1: Authentication & User Management
- User registration (email + password)
- OAuth authentication (Google, LinkedIn, Facebook, VK, Apple)
- User login/logout
- Password reset
- User profile CRUD

### ✅ Module 2: Contact Synchronization
- Connect social media accounts (OAuth)
- Import contacts from connected accounts
- Background sync jobs
- Sync status tracking

### ✅ Module 3: Contact Management (CRUD)
- View list of contacts
- Search and filter contacts
- Add manual contacts
- Update contact information
- Delete (archive) contacts
- View contact details

### ❌ Out of MVP Scope (Future Phases)
- Friendship Score calculation
- Diversity Index
- Cadence Engine (follow-up recommendations)
- Interactions tracking
- Analytics dashboard
- Introduction requests
- Network insights

---

## 3. Database Schema (MVP)

### **Users**
Stores user account information.

**Fields:**
- `id` - UUID, primary key
- `email` - String (255), unique, required
- `first_name` - String (255)
- `last_name` - String (255)
- `phone_number` - String (50), optional
- `password_hash` - String (255), nullable (for OAuth-only users)
- `avatar_url` - Text, optional
- `timezone` - String (50), default 'UTC'
- `language` - String (10), default 'en'
- `oauth_provider` - String (50), e.g., 'google', 'linkedin', 'facebook', 'vk', 'apple'
- `oauth_provider_id` - String (255), unique ID from OAuth provider
- `is_active` - Boolean, default true
- `last_login_at` - Timestamp
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Unique index on email
- Unique composite index on (oauth_provider, oauth_provider_id)

---

### **Contacts**
Centralized storage for all contacts across all users.

**Fields:**
- `id` - UUID, primary key
- `first_name` - String (255)
- `last_name` - String (255)
- `email` - String (255)
- `phone_number` - String (50)
- `avatar_url` - Text
- `company` - String (255)
- `position` - String (255)
- `bio` - Text
- `location` - String (255)
- `linkedin_id` - String (255), unique, for deduplication
- `facebook_id` - String (255), unique
- `vk_id` - String (255), unique
- `telegram_username` - String (255)
- `whatsapp_number` - String (50)
- `source_provider` - String (50), 'linkedin', 'facebook', 'google', 'vk', 'manual'
- `external_source_id` - String (255), ID from the source provider
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Index on email
- Unique indexes on linkedin_id, facebook_id, vk_id (for deduplication)
- Full-text search index on (first_name, last_name, company)

**Why centralized?**
- Prevents duplicate contact data when same person is in multiple users' networks
- Enables future features like mutual connection discovery
- More efficient storage

---

### **User_Contacts**
Junction table linking users to their contacts with user-specific data.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users
- `contact_id` - UUID, foreign key to contacts
- `tags` - Array of strings, custom user-defined tags (e.g., ["colleague", "tech", "friend"])
- `private_notes` - Text, user's private notes about the contact
- `import_source` - String (50), 'linkedin', 'facebook', 'google', 'vk', 'manual'
- `import_date` - Timestamp
- `is_archived` - Boolean, default false (soft delete)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Unique Constraint:** (user_id, contact_id)

**Indexes:**
- Index on user_id (for fetching user's contacts)
- Index on contact_id
- GIN index on tags (for tag-based filtering)

---

### **Connected_Accounts**
Stores OAuth tokens for connected social media accounts.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users
- `provider` - String (50), 'linkedin', 'facebook', 'vk', 'google'
- `provider_user_id` - String (255), user's ID on the provider
- `provider_email` - String (255)
- `access_token` - Text, encrypted OAuth access token
- `refresh_token` - Text, encrypted OAuth refresh token
- `token_expires_at` - Timestamp
- `scopes` - Array of strings, OAuth permissions
- `is_active` - Boolean, default true
- `last_sync_at` - Timestamp, last successful sync
- `sync_status` - String (50), 'pending', 'syncing', 'completed', 'error'
- `sync_error` - Text, error message if sync failed
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Unique Constraint:** (user_id, provider)

**Indexes:**
- Index on user_id
- Index on provider

---

### **Password_Reset_Tokens**
Temporary tokens for password reset.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users
- `token_hash` - String (255), hashed token
- `expires_at` - Timestamp
- `used_at` - Timestamp, nullable
- `created_at` - Timestamp

**Indexes:**
- Unique index on token_hash
- Index on (user_id, expires_at)

---

## 4. API Endpoints (MVP)

### 4.1 Authentication Module

#### `POST /api/v1/auth/register`
Register new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890"
}
```

**Response (201):**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "access_token": "jwt_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer"
}
```

---

#### `POST /api/v1/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://...",
    "created_at": "2025-10-01T10:00:00Z"
  }
}
```

---

#### `POST /api/v1/auth/oauth/{provider}`
OAuth login/registration. Provider can be: `google`, `linkedin`, `facebook`, `vk`, `apple`

**Request:**
```json
{
  "authorization_code": "oauth_authorization_code",
  "redirect_uri": "https://app.naura.com/callback"
}
```

**Response (200):**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://...",
    "oauth_provider": "google"
  }
}
```

---

#### `POST /api/v1/auth/refresh`
Refresh access token.

**Request:**
```json
{
  "refresh_token": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "access_token": "new_jwt_token",
  "token_type": "bearer"
}
```

---

#### `POST /api/v1/auth/logout`
Logout user (invalidate tokens).

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

---

#### `POST /api/v1/auth/forgot-password`
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

---

#### `POST /api/v1/auth/reset-password`
Reset password with token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Password successfully reset"
}
```

---

### 4.2 User Profile Module

#### `GET /api/v1/users/me`
Get current user profile.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "avatar_url": "https://...",
  "timezone": "America/New_York",
  "language": "en",
  "oauth_provider": "google",
  "created_at": "2025-10-01T10:00:00Z",
  "last_login_at": "2025-10-22T08:30:00Z"
}
```

---

#### `PATCH /api/v1/users/me`
Update user profile.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe Jr.",
  "phone_number": "+1234567890",
  "timezone": "Europe/London",
  "language": "ru"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe Jr.",
  "phone_number": "+1234567890",
  "timezone": "Europe/London",
  "language": "ru",
  "updated_at": "2025-10-22T10:00:00Z"
}
```

---

#### `POST /api/v1/users/me/avatar`
Upload user avatar.

**Headers:** `Authorization: Bearer {access_token}`

**Request:** multipart/form-data with file field

**Response (200):**
```json
{
  "avatar_url": "https://cdn.naura.com/avatars/user-uuid.jpg"
}
```

---

#### `DELETE /api/v1/users/me`
Delete user account (with confirmation).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "password": "CurrentPassword123!",
  "confirm": true
}
```

**Response (204):** No content

---

### 4.3 Connected Accounts Module

#### `GET /api/v1/accounts`
List all connected social media accounts.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "provider": "linkedin",
      "provider_email": "user@example.com",
      "is_active": true,
      "last_sync_at": "2025-10-22T08:00:00Z",
      "sync_status": "completed",
      "created_at": "2025-10-01T12:00:00Z"
    },
    {
      "id": "uuid",
      "provider": "google",
      "provider_email": "user@gmail.com",
      "is_active": true,
      "last_sync_at": "2025-10-21T20:00:00Z",
      "sync_status": "completed",
      "created_at": "2025-10-05T09:00:00Z"
    }
  ]
}
```

---

#### `POST /api/v1/accounts/connect/{provider}`
Connect a social media account. Provider: `linkedin`, `facebook`, `vk`, `google`

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "authorization_code": "oauth_code_from_provider",
  "redirect_uri": "https://app.naura.com/callback"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "provider": "linkedin",
  "provider_email": "user@example.com",
  "is_active": true,
  "sync_status": "pending",
  "created_at": "2025-10-22T10:00:00Z"
}
```

---

#### `POST /api/v1/accounts/{account_id}/sync`
Manually trigger contact synchronization from a connected account.

**Headers:** `Authorization: Bearer {access_token}`

**Response (202):**
```json
{
  "message": "Sync job started",
  "job_id": "uuid",
  "estimated_time_minutes": 3
}
```

---

#### `GET /api/v1/accounts/{account_id}/sync-status`
Check sync job status.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "account_id": "uuid",
  "provider": "linkedin",
  "sync_status": "syncing",
  "progress_percentage": 45,
  "contacts_imported": 225,
  "last_sync_at": "2025-10-22T10:00:00Z",
  "sync_error": null
}
```

---

#### `DELETE /api/v1/accounts/{account_id}`
Disconnect a social media account (does not delete imported contacts).

**Headers:** `Authorization: Bearer {access_token}`

**Response (204):** No content

---

### 4.4 Contacts Module (CRUD)

#### `GET /api/v1/contacts`
Get list of user's contacts with pagination, filtering, and search.

**Headers:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- `search` - String, search in name, email, company (optional)
- `tags` - Comma-separated tags (optional)
- `source` - Filter by import source: linkedin, facebook, google, vk, manual (optional)
- `sort_by` - Sort field: name, created_at, updated_at (default: name)
- `order` - asc or desc (default: asc)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50, max: 200)

**Response (200):**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com",
      "phone_number": "+1234567890",
      "avatar_url": "https://...",
      "company": "Tech Corp",
      "position": "Senior Engineer",
      "location": "New York, NY",
      "tags": ["colleague", "tech", "linkedin"],
      "import_source": "linkedin",
      "created_at": "2025-09-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 847,
    "total_pages": 17
  }
}
```

---

#### `GET /api/v1/contacts/{contact_id}`
Get detailed information about a specific contact.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "id": "uuid",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone_number": "+1234567890",
  "avatar_url": "https://...",
  "company": "Tech Corp",
  "position": "Senior Engineer",
  "bio": "Passionate about AI and machine learning",
  "location": "New York, NY",
  
  // Social profiles
  "linkedin_id": "janesmith-linkedin",
  "facebook_id": null,
  "telegram_username": "@janesmith",
  "whatsapp_number": "+1234567890",
  
  // User-specific data
  "tags": ["colleague", "tech", "ai-expert"],
  "private_notes": "Met at AI conference 2024. Very knowledgeable about ML.",
  "import_source": "linkedin",
  "import_date": "2025-09-15T10:00:00Z",
  
  "created_at": "2025-09-15T10:00:00Z",
  "updated_at": "2025-10-10T14:30:00Z"
}
```

---

#### `POST /api/v1/contacts`
Manually add a new contact.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "first_name": "Bob",
  "last_name": "Johnson",
  "email": "bob@example.com",
  "phone_number": "+1234567890",
  "company": "Startup Inc",
  "position": "Founder",
  "bio": "Serial entrepreneur",
  "location": "San Francisco, CA",
  "linkedin_id": "bobjohnson-linkedin",
  "telegram_username": "@bobjohnson",
  "tags": ["startup", "founder", "san-francisco"],
  "private_notes": "Met at networking event. Interested in AI collaboration."
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "first_name": "Bob",
  "last_name": "Johnson",
  "email": "bob@example.com",
  "phone_number": "+1234567890",
  "company": "Startup Inc",
  "position": "Founder",
  "tags": ["startup", "founder", "san-francisco"],
  "import_source": "manual",
  "created_at": "2025-10-22T10:00:00Z"
}
```

---

#### `PATCH /api/v1/contacts/{contact_id}`
Update contact information or user-specific data.

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "phone_number": "+9876543210",
  "company": "New Company Inc",
  "position": "CTO",
  "tags": ["startup", "founder", "cto", "mentor"],
  "private_notes": "Now working as CTO. Great mentor for technical advice."
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "first_name": "Bob",
  "last_name": "Johnson",
  "email": "bob@example.com",
  "phone_number": "+9876543210",
  "company": "New Company Inc",
  "position": "CTO",
  "tags": ["startup", "founder", "cto", "mentor"],
  "private_notes": "Now working as CTO. Great mentor for technical advice.",
  "updated_at": "2025-10-22T10:30:00Z"
}
```

---

#### `DELETE /api/v1/contacts/{contact_id}`
Archive (soft delete) a contact.

**Headers:** `Authorization: Bearer {access_token}`

**Response (204):** No content

---

#### `POST /api/v1/contacts/bulk-import`
Import contacts from CSV or JSON file.

**Headers:** `Authorization: Bearer {access_token}`

**Request:** multipart/form-data with file field

**Response (202):**
```json
{
  "message": "Import job created",
  "job_id": "uuid",
  "estimated_contacts": 500
}
```

---

#### `GET /api/v1/contacts/import-status/{job_id}`
Check bulk import job status.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress_percentage": 60,
  "total_contacts": 500,
  "processed": 300,
  "successful": 295,
  "failed": 5,
  "errors": [
    {
      "row": 15,
      "error": "Invalid email format"
    },
    {
      "row": 127,
      "error": "Missing required field: first_name"
    }
  ]
}
```

---

## 5. Background Jobs (Celery Tasks)

### Contact Sync Job
```python
@celery.task
def sync_contacts_from_provider(user_id: str, account_id: str, provider: str):
    """
    Background job to sync contacts from OAuth provider.
    
    Steps:
    1. Fetch contacts from provider API (LinkedIn, Google, Facebook, VK)
    2. For each contact:
       - Check if contact exists in contacts table (by linkedin_id, email, etc.)
       - If exists, use existing contact_id
       - If not exists, create new contact
       - Create user_contacts relationship
    3. Update sync status and timestamp
    """
    pass
```

### Bulk Import Job
```python
@celery.task
def import_contacts_from_file(user_id: str, file_path: str, file_format: str):
    """
    Background job to import contacts from CSV/JSON file.
    
    Steps:
    1. Parse file (CSV or JSON)
    2. Validate each row
    3. For each valid contact:
       - Check for duplicates
       - Create contact if not exists
       - Create user_contacts relationship
    4. Return import summary with errors
    """
    pass
```

---

## 6. OAuth Integration Details

### Providers Configuration

#### LinkedIn
- **OAuth Endpoint:** `https://www.linkedin.com/oauth/v2/authorization`
- **Token Endpoint:** `https://www.linkedin.com/oauth/v2/accessToken`
- **Scopes:** `r_liteprofile`, `r_emailaddress`, `r_basicprofile`
- **Contacts API:** LinkedIn Connections API (limited to 500 connections)

#### Google
- **OAuth Endpoint:** `https://accounts.google.com/o/oauth2/v2/auth`
- **Token Endpoint:** `https://oauth2.googleapis.com/token`
- **Scopes:** `https://www.googleapis.com/auth/contacts.readonly`, `profile`, `email`
- **Contacts API:** Google People API

#### Facebook
- **OAuth Endpoint:** `https://www.facebook.com/v18.0/dialog/oauth`
- **Token Endpoint:** `https://graph.facebook.com/v18.0/oauth/access_token`
- **Scopes:** `email`, `user_friends`
- **Contacts API:** Graph API `/me/friends`

#### VK (VKontakte)
- **OAuth Endpoint:** `https://oauth.vk.com/authorize`
- **Token Endpoint:** `https://oauth.vk.com/access_token`
- **Scopes:** `friends`, `email`
- **Contacts API:** VK API `friends.get`

### Contact Deduplication Strategy
When importing contacts, check for existing contacts in this order:
1. If `linkedin_id` matches → use existing contact
2. Else if `facebook_id` matches → use existing contact
3. Else if `vk_id` matches → use existing contact
4. Else if `email` matches (exact) → use existing contact
5. Else if `first_name + last_name + company` matches → potential duplicate (ask user?)
6. Else → create new contact

---

## 7. Security Requirements

### Authentication
- JWT access token expiry: 1 hour
- JWT refresh token expiry: 30 days
- Bcrypt password hashing (cost factor: 12)
- Rate limiting: 100 requests/minute per user
- HTTPS only (TLS 1.3)

### OAuth Security
- Store access tokens encrypted at rest (AES-256)
- Refresh tokens rotated on each use
- Token expiration monitoring
- Revoke tokens on account disconnect

### Data Privacy
- Private notes are never shared
- Contact data is private to each user
- Users can only access their own contacts
- Soft delete for contacts (30-day recovery window)

### API Security
- Input validation using Pydantic
- SQL injection prevention (parameterized queries)
- XSS protection
- CORS configured for specific origins
- Rate limiting per endpoint

---

## 8. Error Handling

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `202 Accepted` - Async job started
- `204 No Content` - Success with no body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    },
    "request_id": "uuid"
  }
}
```

---

## 9. Performance Requirements

### Response Times (95th percentile)
- Authentication endpoints: <200ms
- Contact list (50 items): <150ms
- Contact details: <50ms
- Contact search: <200ms

### Scalability
- Support 1,000 concurrent users
- 100 contacts synced per second
- Database: 1M contacts initially
- Redis cache for contact lists (TTL: 5 minutes)

### Caching Strategy
- User session data in Redis
- Contact lists cached per user (invalidate on write)
- OAuth tokens encrypted in database

---

## 10. Testing Requirements

### Unit Tests
- All business logic functions
- Authentication flow
- Contact CRUD operations
- OAuth token management
- Target: 80%+ code coverage

### Integration Tests
- API endpoints with test database
- OAuth flow (mocked providers)
- Background job execution
- Database transactions

### Manual Testing Checklist
- [ ] User can register with email/password
- [ ] User can login with OAuth (Google, LinkedIn)
- [ ] User can connect LinkedIn and import contacts
- [ ] User can connect Google Contacts and import
- [ ] User can manually add a contact
- [ ] User can edit contact details and tags
- [ ] User can search and filter contacts
- [ ] User can delete (archive) a contact
- [ ] User can update their profile
- [ ] User can reset password via email

---

## 11. Deployment

### Environment Variables
```bash
# Application
APP_ENV=production
APP_SECRET_KEY=your-secret-key-here
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/naura
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://host:6379/0
REDIS_CACHE_TTL=300

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# OAuth - LinkedIn
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_REDIRECT_URI=https://app.naura.com/callback/linkedin

# OAuth - Google
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://app.naura.com/callback/google

# OAuth - Facebook
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret

# OAuth - VK
VK_APP_ID=your-app-id
VK_APP_SECRET=your-app-secret

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@naura.com
SMTP_PASSWORD=your-smtp-password
FROM_EMAIL=noreply@naura.com

# File Storage (for avatars)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=naura-uploads
AWS_REGION=us-east-1

# Celery
CELERY_BROKER_URL=redis://host:6379/1
CELERY_RESULT_BACKEND=redis://host:6379/2
```

### Infrastructure
- **Application:** Docker container with FastAPI
- **Database:** PostgreSQL 15 (managed service recommended)
- **Cache & Queue:** Redis 7 (managed service)
- **Worker:** Celery container for background jobs
- **File Storage:** AWS S3 or compatible service
- **Email:** SMTP (Gmail, SendGrid, AWS SES)

---

## 12. MVP Development Phases

### Phase 1: Project Setup & Authentication (Week 1-2)
- [ ] Project initialization (FastAPI, PostgreSQL, Redis)
- [ ] Database schema creation
- [ ] User registration with email/password
- [ ] User login/logout
- [ ] JWT authentication middleware
- [ ] Password reset flow
- [ ] User profile CRUD

### Phase 2: OAuth Integration (Week 2-3)
- [ ] OAuth flow implementation (Google, LinkedIn)
- [ ] OAuth providers: Facebook, VK
- [ ] Token storage and encryption
- [ ] OAuth login/registration

### Phase 3: Contact Sync Module (Week 3-4)
- [ ] Connect account endpoints
- [ ] LinkedIn contact import
- [ ] Google Contacts import
- [ ] Background sync jobs (Celery)
- [ ] Sync status tracking
- [ ] Contact deduplication logic

### Phase 4: Contact Management CRUD (Week 4-5)
- [ ] List contacts with pagination
- [ ] Search and filter contacts
- [ ] Get contact details
- [ ] Add manual contact
- [ ] Update contact
- [ ] Delete (archive) contact
- [ ] Tags management

### Phase 5: File Upload & Polish (Week 5-6)
- [ ] Avatar upload for users
- [ ] Bulk contact import (CSV)
- [ ] Error handling improvements
- [ ] API documentation (Swagger)
- [ ] Rate limiting
- [ ] Security audit

### Phase 6: Testing & Deployment (Week 6-7)
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] Manual testing
- [ ] Docker setup
- [ ] Deployment to staging
- [ ] Production deployment
- [ ] Monitoring setup

### Phase 7: Bug Fixes & Documentation (Week 7-8)
- [ ] Fix bugs from testing
- [ ] API documentation
- [ ] User guide
- [ ] Admin documentation
- [ ] Performance optimization
- [ ] Final production deployment

---

## 13. Tech Stack Summary

**Backend:**
- FastAPI 0.104+
- Python 3.11+
- Pydantic 2.0+ (validation)
- SQLAlchemy 2.0+ (ORM)
- Alembic (migrations)

**Database & Cache:**
- PostgreSQL 15+
- Redis 7+

**Background Jobs:**
- Celery 5+
- Redis (broker)

**Authentication:**
- PyJWT
- python-jose
- bcrypt

**HTTP Client:**
- httpx (for OAuth)

**Testing:**
- Pytest
- pytest-asyncio

**Deployment:**
- Docker
- Docker Compose

---

## 14. API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## 15. Future Enhancements (Post-MVP)

After MVP is complete and validated with users:
1. Friendship Score calculation
2. Interaction tracking
3. Cadence Engine (follow-up recommendations)
4. Diversity Index
5. Analytics dashboard
6. Introduction requests
7. Mobile apps (iOS, Android)
8. Calendar integration
9. Messenger integration
10. AI-powered insights

---

## 16. Success Metrics (MVP)

**Technical Metrics:**
- API response time <200ms (p95)
- 99.9% uptime
- Zero data loss
- Successful OAuth sync rate >90%

**User Metrics:**
- 100 active users
- Average 500 contacts per user
- 80% OAuth connection success rate
- 50% weekly active users

---

**Document Version:** 1.0 MVP  
**Last Updated:** October 22, 2025  
**Status:** Ready for Development  
**Estimated Timeline:** 6-8 weeks