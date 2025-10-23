# Naura Personal CRM - Backend Technical Specification

## 1. Executive Summary

**Product Name:** Naura  
**Purpose:** Personal CRM system for managing and nurturing professional relationships  
**Technology Stack:** FastAPI (Python), PostgreSQL, Redis (caching), Celery (background tasks)  
**Target Scale:** 10,000+ users, 800-2,000 contacts per user average

### Core Value Proposition
Naura transforms scattered contacts into an organized, living network by:
- Aggregating contacts from multiple sources (LinkedIn, Facebook, VK, email, phone)
- Calculating Friendship Scores and Diversity Index
- Providing intelligent follow-up recommendations via Cadence Engine
- Enabling verified connections through direct handshakes or mutual intros

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture
```
┌─────────────┐
│   Client    │
│ (iOS/Web)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      FastAPI Backend            │
│  - REST API Endpoints           │
│  - OAuth2 Authentication        │
│  - Business Logic               │
│  - Background Tasks Queue       │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────┐
│PostgreSQL│ │  Redis   │
│Database  │ │  Cache   │
└─────────┘ └──────────┘
```

### 2.2 Core Modules
1. **Authentication & User Management**
2. **Contact Management & Synchronization**
3. **Relationship Intelligence (Friendship Score, Diversity Index)**
4. **Cadence Engine (Follow-up Recommendations)**
5. **Permissions & Connection Management**
6. **Analytics & Statistics**

---

## 3. Database Architecture & Design Decisions

### 3.1 Critical Design Decision: Contact Storage Strategy

**Problem:** With 800-2,000 contacts per user and 10,000+ users, we face potential scalability challenges.

**Recommended Approach: SINGLE UNIFIED CONTACTS TABLE** ✅

**Rationale:**
1. **PostgreSQL Performance:** Modern PostgreSQL handles millions of rows efficiently with proper indexing
2. **Deduplication:** Multiple users may share the same contacts (same LinkedIn profile, email)
3. **Data Integrity:** Centralized contact data ensures consistency
4. **Network Analysis:** Easy to analyze global network patterns and suggest mutual connections
5. **Storage Efficiency:** Avoid duplicating contact information across user-specific tables

**Performance Optimizations:**
- **B-tree indexes** on user_id, external_ids, email, phone
- **GIN indexes** for full-text search on names
- **Partial indexes** for frequently queried subsets
- **Partition by user_id range** if scale exceeds 50M+ contacts (future consideration)
- **Redis caching** for frequently accessed contact lists

**Expected Scale:**
- 10,000 users × 2,000 contacts = 20M contacts
- With proper indexing, queries remain under 50ms for 95th percentile
- PostgreSQL handles 100M+ rows efficiently with modern hardware

### 3.2 Database Schema

#### **Users Table**
Stores registered user accounts and their profile information.

**Fields:**
- `id` - UUID, primary key
- `email` - String (255), unique, required
- `first_name` - String (255)
- `last_name` - String (255)
- `phone_number` - String (50), optional
- `password_hash` - String (255), for email/password auth
- `avatar_url` - Text, URL to user's profile picture
- `timezone` - String (50), default 'UTC'
- `language` - String (10), default 'en'
- `notification_preferences` - JSONB, stores user notification settings
- `oauth_provider` - String (50), e.g., 'google', 'apple', 'linkedin'
- `oauth_provider_id` - String (255), unique ID from OAuth provider
- `is_active` - Boolean, default true
- `last_login_at` - Timestamp
- `onboarding_completed` - Boolean, default false
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Unique index on email
- Unique composite index on (oauth_provider, oauth_provider_id)
- Index on is_active for filtering active users

---

#### **Contacts Table** (Centralized Storage)
Stores all contact information across all users. Single source of truth for contact data.

**Fields:**
- `id` - UUID, primary key
- `first_name` - String (255)
- `last_name` - String (255)
- `full_name` - String (500), computed field combining first + last name
- `nickname` - String (255), optional
- `email` - String (255)
- `phone_number` - String (50)
- `avatar_url` - Text, URL to contact's profile picture
- `company` - String (255), current company
- `position` - String (255), job title
- `bio` - Text, contact's biography/description
- `location` - String (255), city/country
- `website` - Text, personal website URL
- `linkedin_id` - String (255), unique, for deduplication
- `facebook_id` - String (255), unique
- `vk_id` - String (255), unique
- `telegram_username` - String (255)
- `whatsapp_number` - String (50)
- `source_provider` - String (50), where contact was imported from
- `external_source_id` - String (255), ID from source provider
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Index on email (for lookups)
- Index on phone_number
- Unique indexes on linkedin_id, facebook_id, vk_id (for deduplication)
- Full-text search index on (first_name, last_name, company, position)

**Why centralized?**
- Deduplication: Same person (same LinkedIn profile) can be in multiple users' networks
- Network analysis: Easy to find mutual connections
- Data consistency: Single source of truth
- Storage efficiency: No duplicate contact data

---

#### **User_Contacts** (Junction Table - Many-to-Many)
Links users to their contacts and stores **user-specific** relationship data. This is where personalization happens.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users table
- `contact_id` - UUID, foreign key to contacts table
- `closeness_level` - Integer (1-5)
  - 1 = Acquaintance
  - 2 = Colleague  
  - 3 = Friend
  - 4 = Close Friend
  - 5 = Best Friend
- `friendship_score` - Decimal (0-100), calculated relationship strength
- `last_interaction_date` - Date, when user last interacted with contact
- `interaction_frequency` - Integer, interactions per month
- `tags` - Array of strings, **custom user-defined tags** (e.g., ["tech", "startup", "mentor"])
- `private_notes` - Text, user's private notes about contact (never shared)
- `connection_type` - String (50), 'direct_handshake', 'mutual_intro', 'imported', 'unverified'
- `verified_at` - Timestamp, when connection was verified
- `introduced_by_user_id` - UUID, optional, who introduced them
- `import_source` - String (50), 'linkedin', 'facebook', 'google', 'manual'
- `import_date` - Timestamp
- `is_archived` - Boolean, default false (soft delete)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Unique Constraint:** (user_id, contact_id) - one relationship per user-contact pair

**Indexes:**
- Index on user_id (for getting user's contacts)
- Index on (user_id, closeness_level) for filtering
- Index on (user_id, friendship_score DESC) for sorting
- GIN index on tags for tag-based search
- Index on (user_id, last_interaction_date DESC)

**Key Feature: Custom Tags**
Each user can add their own custom tags to any contact. Tags are stored as an array of strings, enabling:
- Flexible categorization (no predefined list)
- Multi-tag support (a contact can have many tags)
- Fast filtering using GIN index
- Examples: "ai-expert", "potential-client", "conference-2024", "needs-follow-up"

---

#### **Interactions Table** (Activity Log)
Records all interactions between users and their contacts.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users
- `contact_id` - UUID, foreign key to contacts
- `interaction_type` - String (50), 'meeting', 'call', 'email', 'message', 'event', 'intro_made', 'intro_received'
- `interaction_date` - Timestamp, when interaction occurred
- `duration_minutes` - Integer, optional
- `notes` - Text, user's notes about the interaction
- `location` - String (255), optional, where meeting happened
- `calendar_event_id` - String (255), optional, link to calendar event
- `messenger_type` - String (50), 'telegram', 'whatsapp', 'imessage', etc.
- `sentiment_score` - Integer (-5 to +5), optional, how positive the interaction was
- `interaction_quality` - String (20), 'brief', 'normal', 'deep'
- `created_at` - Timestamp

**Indexes:**
- Index on (user_id, interaction_date DESC)
- Index on (contact_id, interaction_date DESC)
- Index on (user_id, interaction_type)

---

#### **Connected_Accounts Table** (OAuth Integrations)
Stores OAuth tokens and sync status for connected social media accounts.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users
- `provider` - String (50), 'linkedin', 'facebook', 'vk', 'google', 'apple'
- `provider_user_id` - String (255), user's ID on the provider
- `provider_email` - String (255), email from provider
- `access_token` - Text, encrypted OAuth access token
- `refresh_token` - Text, encrypted OAuth refresh token
- `token_expires_at` - Timestamp
- `scopes` - Array of strings, OAuth permissions granted
- `is_active` - Boolean, default true
- `last_sync_at` - Timestamp, last successful sync
- `sync_status` - String (50), 'pending', 'syncing', 'completed', 'error'
- `sync_error` - Text, error message if sync failed
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Unique Constraint:** (user_id, provider, provider_user_id)

**Indexes:**
- Index on user_id
- Index on provider
- Index on (user_id, last_sync_at)

---

#### **Follow_Up_Recommendations Table** (Cadence Engine Output)
Stores AI-generated follow-up recommendations for users.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users
- `contact_id` - UUID, foreign key to contacts
- `recommendation_type` - String (50)
  - 'overdue' - haven't contacted in a while
  - 'upcoming' - birthday, anniversary
  - 'relationship_building' - strengthen weak connections
  - 'diversity_gap' - fill network gaps
  - 'mutual_intro' - introduce two contacts
- `priority_score` - Decimal (0-100), how urgent/important
- `recommended_action` - Text, suggested action ("Reach out for coffee")
- `reasoning` - Text, why this recommendation ("You haven't connected in 2 months...")
- `recommended_date` - Date, when to follow up
- `status` - String (50), 'pending', 'accepted', 'dismissed', 'completed', 'snoozed'
- `snoozed_until` - Date, optional
- `completed_at` - Timestamp, optional
- `user_feedback` - String (20), 'helpful', 'not_helpful', 'irrelevant'
- `created_at` - Timestamp
- `expires_at` - Timestamp, auto-dismiss if not acted upon

**Unique Constraint:** (user_id, contact_id, status) WHERE status = 'pending'

**Indexes:**
- Index on (user_id, status, priority_score DESC) for pending recommendations
- Index on (user_id, recommended_date)

---

#### **Network_Insights Table** (Diversity Index & Analytics)
Stores calculated network analytics and diversity metrics.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users
- `calculation_date` - Date, when metrics were calculated
- `diversity_index` - Decimal (0-100), overall network diversity
- `industry_diversity_score` - Decimal (0-100)
- `geographic_diversity_score` - Decimal (0-100)
- `role_diversity_score` - Decimal (0-100)
- `avg_friendship_score` - Decimal (0-100)
- `active_relationships_count` - Integer
- `dormant_relationships_count` - Integer
- `new_connections_this_month` - Integer
- `industry_distribution` - JSONB, {"tech": 45, "finance": 30, ...}
- `location_distribution` - JSONB, {"New York": 40, "SF": 25, ...}
- `closeness_distribution` - JSONB, {"1": 500, "2": 200, ...}
- `missing_categories` - Array of strings, underrepresented areas
- `created_at` - Timestamp

**Unique Constraint:** (user_id, calculation_date)

**Indexes:**
- Index on (user_id, calculation_date DESC)

---

#### **Contact_Shares Table** (Permissions & Introductions)
Manages introduction requests and contact sharing permissions.

**Fields:**
- `id` - UUID, primary key
- `owner_user_id` - UUID, user who owns the contact
- `contact_id` - UUID, the contact being shared
- `shared_with_user_id` - UUID, user requesting intro
- `permission_level` - String (50), 'view', 'intro_request', 'full_profile'
- `intro_message` - Text, message from requester
- `intro_status` - String (50), 'pending', 'accepted', 'declined', 'completed'
- `created_at` - Timestamp
- `responded_at` - Timestamp, optional

**Unique Constraint:** (owner_user_id, contact_id, shared_with_user_id)

**Indexes:**
- Index on owner_user_id
- Index on (shared_with_user_id, intro_status)

---

#### **Password_Reset_Tokens Table**
Temporary tokens for password reset flow.

**Fields:**
- `id` - UUID, primary key
- `user_id` - UUID, foreign key to users
- `token_hash` - String (255), hashed token
- `expires_at` - Timestamp, token expiration
- `used_at` - Timestamp, optional, when token was used
- `created_at` - Timestamp

**Indexes:**
- Unique index on token_hash
- Index on (user_id, expires_at)

---

## 4. API Endpoints Specification

### 4.1 Authentication & User Management

#### POST `/api/v1/auth/register`
**Purpose:** User registration with email/password or OAuth

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "oauth_provider": "google", // optional
  "oauth_token": "..." // optional
}
```

**Response (201):**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "access_token": "jwt_token",
  "refresh_token": "jwt_refresh",
  "token_type": "bearer"
}
```

#### POST `/api/v1/auth/login`
**Purpose:** User login

**Request Body:**
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
  "refresh_token": "jwt_refresh",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "onboarding_completed": false
  }
}
```

#### POST `/api/v1/auth/oauth/linkedin`
**Purpose:** OAuth authentication with LinkedIn

**Request Body:**
```json
{
  "authorization_code": "code_from_oauth_flow",
  "redirect_uri": "https://app.naura.com/callback"
}
```

**Response (200):** Same as login response

#### POST `/api/v1/auth/refresh`
**Purpose:** Refresh access token

**Request Body:**
```json
{
  "refresh_token": "jwt_refresh"
}
```

#### POST `/api/v1/auth/forgot-password`
**Purpose:** Request password reset

**Request Body:**
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

#### POST `/api/v1/auth/reset-password`
**Purpose:** Reset password with token

**Request Body:**
```json
{
  "token": "reset_token",
  "new_password": "NewSecurePass123!"
}
```

---

### 4.2 User Profile Management

#### GET `/api/v1/users/me`
**Purpose:** Get current user profile

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "avatar_url": "https://...",
  "timezone": "America/New_York",
  "language": "en",
  "onboarding_completed": true,
  "created_at": "2025-01-15T10:00:00Z",
  "notification_preferences": {
    "email_notifications": true,
    "push_notifications": true,
    "follow_up_reminders": true
  }
}
```

#### PATCH `/api/v1/users/me`
**Purpose:** Update user profile

**Request Body:**
```json
{
  "full_name": "John Doe Jr.",
  "phone_number": "+1234567890",
  "timezone": "Europe/London",
  "notification_preferences": {
    "email_notifications": false
  }
}
```

#### POST `/api/v1/users/me/avatar`
**Purpose:** Upload user avatar

**Request:** multipart/form-data with file

**Response (200):**
```json
{
  "avatar_url": "https://cdn.naura.com/avatars/uuid.jpg"
}
```

---

### 4.3 Connected Accounts & OAuth Integrations

#### GET `/api/v1/accounts/connected`
**Purpose:** List all connected social accounts

**Response (200):**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "provider": "linkedin",
      "provider_email": "user@example.com",
      "is_active": true,
      "last_sync_at": "2025-10-20T15:30:00Z",
      "sync_status": "completed",
      "created_at": "2025-10-01T10:00:00Z"
    }
  ]
}
```

#### POST `/api/v1/accounts/connect/{provider}`
**Purpose:** Connect a social media account

**Path Parameters:**
- `provider`: linkedin | facebook | vk | google | apple

**Request Body:**
```json
{
  "authorization_code": "oauth_code",
  "redirect_uri": "https://app.naura.com/callback"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "provider": "linkedin",
  "is_active": true,
  "sync_status": "pending"
}
```

#### POST `/api/v1/accounts/{account_id}/sync`
**Purpose:** Trigger manual sync of contacts from a connected account

**Response (202):**
```json
{
  "message": "Sync initiated",
  "job_id": "uuid",
  "estimated_time": "2-5 minutes"
}
```

#### DELETE `/api/v1/accounts/{account_id}`
**Purpose:** Disconnect a social account

**Response (204):** No content

---

### 4.4 Contact Management

#### GET `/api/v1/contacts`
**Purpose:** List user's contacts with filtering and search

**Query Parameters:**
- `search`: string (search by name, company, email)
- `tags`: comma-separated tags
- `closeness_level`: 1-5
- `min_friendship_score`: 0-100
- `sort_by`: name | last_interaction | friendship_score | created_at
- `order`: asc | desc
- `page`: integer (default: 1)
- `limit`: integer (default: 50, max: 200)
- `is_archived`: boolean

**Response (200):**
```json
{
  "contacts": [
    {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "phone_number": "+1234567890",
      "company": "Tech Corp",
      "position": "Senior Engineer",
      "avatar_url": "https://...",
      "closeness_level": 3,
      "friendship_score": 75.5,
      "tags": ["colleague", "tech"],
      "last_interaction_date": "2025-10-15",
      "connection_type": "direct_handshake",
      "linkedin_id": "linkedin_id",
      "created_at": "2025-09-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "total_pages": 25
  }
}
```

#### GET `/api/v1/contacts/{contact_id}`
**Purpose:** Get detailed contact information

**Response (200):**
```json
{
  "id": "uuid",
  "first_name": "Jane",
  "last_name": "Smith",
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone_number": "+1234567890",
  "company": "Tech Corp",
  "position": "Senior Engineer",
  "avatar_url": "https://...",
  "location": "New York, NY",
  "bio": "Passionate about AI and machine learning",
  "website": "https://janesmith.com",
  
  // User-specific relationship data
  "closeness_level": 3,
  "friendship_score": 75.5,
  "last_interaction_date": "2025-10-15",
  "interaction_frequency": 4,
  "tags": ["colleague", "tech", "ai"],
  "private_notes": "Met at AI conference 2024",
  "connection_type": "direct_handshake",
  "verified_at": "2024-11-20T10:00:00Z",
  
  // Social profiles
  "linkedin_id": "linkedin_id",
  "facebook_id": null,
  "telegram_username": "@janesmith",
  
  // Recent interactions
  "recent_interactions": [
    {
      "id": "uuid",
      "interaction_type": "meeting",
      "interaction_date": "2025-10-15T14:00:00Z",
      "duration_minutes": 60,
      "notes": "Discussed ML project collaboration"
    }
  ],
  
  "created_at": "2025-09-01T10:00:00Z",
  "updated_at": "2025-10-15T14:30:00Z"
}
```

#### POST `/api/v1/contacts`
**Purpose:** Create new contact manually

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "company": "Startup Inc",
  "position": "Founder",
  "linkedin_id": "linkedin_id", // optional
  "closeness_level": 2,
  "tags": ["startup", "founder"],
  "private_notes": "Met at networking event",
  "connection_type": "direct_handshake"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "email": "john@example.com",
  "closeness_level": 2,
  "friendship_score": 0.0,
  "created_at": "2025-10-22T10:00:00Z"
}
```

#### PATCH `/api/v1/contacts/{contact_id}`
**Purpose:** Update contact information or relationship data

**Request Body:**
```json
{
  "closeness_level": 4,
  "tags": ["colleague", "tech", "mentor"],
  "private_notes": "Updated notes",
  "company": "New Company",
  "position": "CTO"
}
```

#### DELETE `/api/v1/contacts/{contact_id}`
**Purpose:** Archive (soft delete) a contact

**Response (204):** No content

#### POST `/api/v1/contacts/{contact_id}/restore`
**Purpose:** Restore an archived contact

**Response (200):**
```json
{
  "message": "Contact restored",
  "contact_id": "uuid"
}
```

#### POST `/api/v1/contacts/bulk-import`
**Purpose:** Import contacts from CSV/JSON file

**Request:** multipart/form-data with file

**Response (202):**
```json
{
  "message": "Import job created",
  "job_id": "uuid",
  "estimated_contacts": 500
}
```

#### GET `/api/v1/contacts/import-status/{job_id}`
**Purpose:** Check import job status

**Response (200):**
```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": 45,
  "total_contacts": 500,
  "processed": 225,
  "successful": 220,
  "failed": 5,
  "errors": [
    {
      "row": 15,
      "error": "Invalid email format"
    }
  ]
}
```

---

### 4.5 Interactions & Activity Tracking

#### GET `/api/v1/interactions`
**Purpose:** List interactions

**Query Parameters:**
- `contact_id`: filter by contact
- `interaction_type`: meeting | call | email | message | event
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `page`: integer
- `limit`: integer

**Response (200):**
```json
{
  "interactions": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "contact_name": "Jane Smith",
      "interaction_type": "meeting",
      "interaction_date": "2025-10-15T14:00:00Z",
      "duration_minutes": 60,
      "notes": "Discussed project collaboration",
      "location": "Coffee Shop",
      "interaction_quality": "deep",
      "created_at": "2025-10-15T14:30:00Z"
    }
  ],
  "pagination": {...}
}
```

#### POST `/api/v1/interactions`
**Purpose:** Log a new interaction

**Request Body:**
```json
{
  "contact_id": "uuid",
  "interaction_type": "meeting",
  "interaction_date": "2025-10-22T10:00:00Z",
  "duration_minutes": 30,
  "notes": "Quick coffee chat",
  "location": "Starbucks",
  "interaction_quality": "normal",
  "sentiment_score": 4
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "contact_id": "uuid",
  "interaction_type": "meeting",
  "interaction_date": "2025-10-22T10:00:00Z",
  "created_at": "2025-10-22T10:15:00Z"
}
```

#### PATCH `/api/v1/interactions/{interaction_id}`
**Purpose:** Update interaction

#### DELETE `/api/v1/interactions/{interaction_id}`
**Purpose:** Delete interaction

---

### 4.6 Relationship Intelligence & Scoring

#### GET `/api/v1/contacts/{contact_id}/friendship-score`
**Purpose:** Get detailed friendship score breakdown

**Response (200):**
```json
{
  "contact_id": "uuid",
  "friendship_score": 75.5,
  "last_calculated_at": "2025-10-22T08:00:00Z",
  "components": {
    "recency": 20.0, // out of 25
    "frequency": 18.5, // out of 25
    "depth": 22.0, // out of 25
    "reciprocity": 15.0 // out of 25
  },
  "interpretation": "Strong relationship",
  "trend": "improving" // "improving", "stable", "declining"
}
```

#### POST `/api/v1/contacts/{contact_id}/calculate-score`
**Purpose:** Trigger friendship score recalculation

**Response (200):**
```json
{
  "contact_id": "uuid",
  "new_score": 78.2,
  "previous_score": 75.5,
  "change": 2.7
}
```

#### GET `/api/v1/network/diversity-index`
**Purpose:** Get network diversity analysis

**Response (200):**
```json
{
  "diversity_index": 68.5,
  "last_calculated_at": "2025-10-22T00:00:00Z",
  "breakdown": {
    "industry_diversity": 72.0,
    "geographic_diversity": 65.0,
    "role_diversity": 68.5
  },
  "distributions": {
    "industries": {
      "Technology": 35,
      "Finance": 20,
      "Healthcare": 15,
      "Education": 10,
      "Other": 20
    },
    "locations": {
      "New York": 40,
      "San Francisco": 25,
      "London": 15,
      "Remote": 10,
      "Other": 10
    },
    "roles": {
      "Engineering": 30,
      "Management": 25,
      "Sales": 15,
      "Design": 10,
      "Other": 20
    }
  },
  "recommendations": [
    "Consider connecting with more people in healthcare",
    "Your network is heavily concentrated in New York - consider expanding geographically"
  ]
}
```

---

### 4.7 Cadence Engine & Follow-Up Recommendations

#### GET `/api/v1/recommendations`
**Purpose:** Get personalized follow-up recommendations

**Query Parameters:**
- `status`: pending | accepted | dismissed | completed
- `priority_min`: 0-100
- `recommendation_type`: overdue | upcoming | relationship_building | diversity_gap
- `limit`: integer

**Response (200):**
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "contact": {
        "id": "uuid",
        "full_name": "Jane Smith",
        "avatar_url": "https://...",
        "company": "Tech Corp",
        "last_interaction_date": "2025-08-15"
      },
      "recommendation_type": "overdue",
      "priority_score": 85.0,
      "recommended_action": "Reach out for a coffee chat",
      "reasoning": "You haven't connected in 2 months. Jane is a close friend (closeness: 4) and your typical interaction frequency is monthly.",
      "recommended_date": "2025-10-23",
      "status": "pending",
      "created_at": "2025-10-22T08:00:00Z"
    },
    {
      "id": "uuid",
      "contact": {
        "id": "uuid",
        "full_name": "Bob Johnson",
        "avatar_url": "https://...",
        "company": "Healthcare Inc"
      },
      "recommendation_type": "diversity_gap",
      "priority_score": 70.0,
      "recommended_action": "Strengthen this connection to improve network diversity",
      "reasoning": "Bob works in healthcare, an underrepresented industry in your network (only 5%).",
      "recommended_date": "2025-10-25",
      "status": "pending",
      "created_at": "2025-10-22T08:00:00Z"
    }
  ],
  "summary": {
    "total_pending": 12,
    "overdue_count": 5,
    "upcoming_count": 4,
    "diversity_gap_count": 3
  }
}
```

#### POST `/api/v1/recommendations/{recommendation_id}/accept`
**Purpose:** Accept a recommendation (mark as will-do)

**Response (200):**
```json
{
  "id": "uuid",
  "status": "accepted",
  "updated_at": "2025-10-22T10:00:00Z"
}
```

#### POST `/api/v1/recommendations/{recommendation_id}/dismiss`
**Purpose:** Dismiss a recommendation

**Request Body:**
```json
{
  "feedback": "not_helpful" // optional: helpful | not_helpful | irrelevant
}
```

#### POST `/api/v1/recommendations/{recommendation_id}/complete`
**Purpose:** Mark recommendation as completed

**Request Body:**
```json
{
  "interaction_id": "uuid" // optional: link to logged interaction
}
```

#### POST `/api/v1/recommendations/{recommendation_id}/snooze`
**Purpose:** Snooze recommendation

**Request Body:**
```json
{
  "snooze_until": "2025-10-30"
}
```

---

### 4.8 Analytics & Statistics

#### GET `/api/v1/analytics/dashboard`
**Purpose:** Get main screen dashboard statistics

**Response (200):**
```json
{
  "overview": {
    "total_contacts": 1250,
    "active_contacts": 850,
    "dormant_contacts": 400,
    "new_this_month": 15,
    "interactions_this_month": 45
  },
  "relationship_health": {
    "avg_friendship_score": 62.5,
    "closeness_distribution": {
      "1": 500,
      "2": 350,
      "3": 250,
      "4": 100,
      "5": 50
    }
  },
  "diversity_index": 68.5,
  "pending_recommendations": 12,
  "recent_activity": [
    {
      "type": "interaction",
      "contact_name": "Jane Smith",
      "description": "Had a meeting",
      "timestamp": "2025-10-21T14:00:00Z"
    }
  ]
}
```

#### GET `/api/v1/analytics/relationship-trends`
**Purpose:** Get relationship trends over time

**Query Parameters:**
- `period`: week | month | quarter | year
- `contact_id`: optional, for specific contact

**Response (200):**
```json
{
  "period": "month",
  "data_points": [
    {
      "date": "2025-09-01",
      "avg_friendship_score": 60.5,
      "total_interactions": 38,
      "new_connections": 12
    },
    {
      "date": "2025-10-01",
      "avg_friendship_score": 62.5,
      "total_interactions": 45,
      "new_connections": 15
    }
  ]
}
```

#### GET `/api/v1/analytics/contact-stats/{contact_id}`
**Purpose:** Get detailed statistics for a specific contact

**Response (200):**
```json
{
  "contact_id": "uuid",
  "total_interactions": 24,
  "first_interaction": "2024-06-15T10:00:00Z",
  "last_interaction": "2025-10-15T14:00:00Z",
  "avg_interaction_frequency": 2.5, // per month
  "interaction_types": {
    "meeting": 12,
    "call": 8,
    "message": 4
  },
  "relationship_journey": [
    {
      "date": "2024-06-15",
      "event": "First meeting",
      "closeness_level": 1,
      "friendship_score": 0
    },
    {
      "date": "2025-10-15",
      "event": "Latest interaction",
      "closeness_level": 3,
      "friendship_score": 75.5
    }
  ]
}
```

---

### 4.9 Connection Verification & Introductions

#### POST `/api/v1/connections/verify-handshake`
**Purpose:** Verify connection through mutual handshake

**Request Body:**
```json
{
  "contact_id": "uuid",
  "verification_method": "direct_handshake",
  "meeting_date": "2025-10-22" // optional
}
```

**Response (200):**
```json
{
  "contact_id": "uuid",
  "connection_type": "direct_handshake",
  "verified_at": "2025-10-22T10:00:00Z"
}
```

#### POST `/api/v1/introductions/request`
**Purpose:** Request introduction to someone in another user's network

**Request Body:**
```json
{
  "contact_id": "uuid",
  "owner_user_id": "uuid",
  "message": "Hi, I'd love to be introduced to Jane for a potential collaboration on AI projects."
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "contact_id": "uuid",
  "owner_user_id": "uuid",
  "intro_status": "pending",
  "created_at": "2025-10-22T10:00:00Z"
}
```

#### GET `/api/v1/introductions/pending`
**Purpose:** Get pending introduction requests (incoming)

**Response (200):**
```json
{
  "incoming_requests": [
    {
      "id": "uuid",
      "requester": {
        "id": "uuid",
        "full_name": "Bob Johnson",
        "avatar_url": "https://..."
      },
      "contact": {
        "id": "uuid",
        "full_name": "Jane Smith"
      },
      "message": "Hi, I'd love to be introduced...",
      "intro_status": "pending",
      "created_at": "2025-10-21T15:00:00Z"
    }
  ]
}
```

#### POST `/api/v1/introductions/{intro_id}/accept`
**Purpose:** Accept introduction request

**Request Body:**
```json
{
  "intro_message": "Jane, meet Bob. Bob, meet Jane. You both work in AI!"
}
```

#### POST `/api/v1/introductions/{intro_id}/decline`
**Purpose:** Decline introduction request

**Request Body:**
```json
{
  "reason": "optional reason text"
}
```

---

### 4.10 Search & Discovery

#### GET `/api/v1/search/contacts`
**Purpose:** Advanced contact search with full-text

**Query Parameters:**
- `q`: search query
- `filters`: JSON object with filters
- `limit`: integer

**Response (200):**
```json
{
  "results": [
    {
      "id": "uuid",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "company": "Tech Corp",
      "position": "Senior Engineer",
      "avatar_url": "https://...",
      "closeness_level": 3,
      "match_score": 0.95,
      "match_fields": ["name", "company"]
    }
  ],
  "total": 15
}
```

#### GET `/api/v1/search/suggest-connections`
**Purpose:** Suggest potential connections based on network gaps

**Response (200):**
```json
{
  "suggestions": [
    {
      "reason": "Industry diversity",
      "description": "Connect with more people in Healthcare",
      "suggested_actions": [
        "Reach out to Bob Johnson (Healthcare Inc)",
        "Attend healthcare industry events"
      ]
    }
  ]
}
```

---

## 5. Background Jobs & Async Processing

### 5.1 Celery Tasks

#### Contact Sync Job
```python
@celery.task
def sync_contacts_from_provider(user_id: str, account_id: str, provider: str):
    """
    Synchronize contacts from external provider (LinkedIn, Facebook, etc.)
    - Fetch contacts from provider API
    - Deduplicate against existing contacts table
    - Create user_contacts relationships
    - Update sync status
    """
    pass
```

#### Friendship Score Calculation
```python
@celery.task
def calculate_friendship_scores(user_id: str):
    """
    Calculate friendship scores for all user contacts
    Runs daily at midnight user's timezone
    
    Components:
    - Recency: days since last interaction (max 25 points)
    - Frequency: interactions per month (max 25 points)
    - Depth: avg interaction duration/quality (max 25 points)
    - Reciprocity: two-way engagement (max 25 points)
    """
    pass
```

#### Diversity Index Calculation
```python
@celery.task
def calculate_diversity_index(user_id: str):
    """
    Calculate network diversity index
    Runs weekly
    
    Metrics:
    - Industry diversity (Shannon entropy)
    - Geographic diversity
    - Role diversity
    - Relationship strength distribution
    """
    pass
```

#### Cadence Engine - Generate Recommendations
```python
@celery.task
def generate_follow_up_recommendations(user_id: str):
    """
    Generate follow-up recommendations using Cadence Engine
    Runs daily at 6 AM user's timezone
    
    Logic:
    1. Identify overdue contacts (last interaction > expected frequency)
    2. Identify upcoming birthdays/anniversaries
    3. Identify diversity gaps
    4. Calculate priority scores
    5. Create recommendations
    """
    pass
```

#### Email Notifications
```python
@celery.task
def send_daily_digest(user_id: str):
    """
    Send daily email digest with:
    - Top 3 follow-up recommendations
    - Recent network activity
    - Weekly/monthly insights
    """
    pass
```

---

## 6. Business Logic Details

### 6.1 Friendship Score Algorithm

**Formula:**
```
Friendship Score = (Recency_Score * 0.25) + 
                   (Frequency_Score * 0.25) + 
                   (Depth_Score * 0.25) + 
                   (Reciprocity_Score * 0.25)
```

**Components:**

1. **Recency Score (0-25 points)**
   - 0-7 days: 25 points
   - 8-14 days: 20 points
   - 15-30 days: 15 points
   - 31-60 days: 10 points
   - 61-90 days: 5 points
   - 90+ days: 0 points

2. **Frequency Score (0-25 points)**
   - Based on interactions per month over last 6 months
   - 8+ interactions/month: 25 points
   - 4-7 interactions/month: 20 points
   - 2-3 interactions/month: 15 points
   - 1 interaction/month: 10 points
   - <1 interaction/month: 5 points
   - 0 interactions: 0 points

3. **Depth Score (0-25 points)**
   - Based on interaction quality and duration
   - Deep interactions (>60 min, quality="deep"): 25 points
   - Normal interactions (30-60 min, quality="normal"): 15 points
   - Brief interactions (<30 min, quality="brief"): 10 points
   - Weighted average over last 10 interactions

4. **Reciprocity Score (0-25 points)**
   - Measures two-way engagement
   - User manually logging interactions indicates engagement
   - Balanced give/take in relationship
   - Connected via mutual intro: bonus points
   - Direct handshake verified: bonus points

### 6.2 Diversity Index Algorithm

**Shannon Entropy Formula:**
```
H = -Σ(p_i * log2(p_i))

where p_i = proportion of contacts in category i
```

**Normalize to 0-100:**
```
Diversity_Index = (H / H_max) * 100

where H_max = log2(number_of_categories)
```

**Categories Measured:**
- Industry (15+ standard categories)
- Geographic location (city/country)
- Job role (10+ standard categories)
- Relationship strength (closeness_level 1-5)

**Final Diversity Index:**
```
Overall_Diversity = (Industry_Diversity * 0.4) +
                    (Geographic_Diversity * 0.3) +
                    (Role_Diversity * 0.3)
```

### 6.3 Cadence Engine Logic

**Priority Score Calculation:**
```python
def calculate_priority(contact, user_network):
    base_score = 50
    
    # Factor 1: Days overdue
    days_overdue = days_since_last_interaction - expected_frequency_days
    if days_overdue > 0:
        base_score += min(days_overdue * 0.5, 30)  # max +30
    
    # Factor 2: Closeness level
    closeness_multiplier = {5: 2.0, 4: 1.5, 3: 1.2, 2: 1.0, 1: 0.8}
    base_score *= closeness_multiplier[contact.closeness_level]
    
    # Factor 3: Friendship score declining
    if friendship_score_trend == "declining":
        base_score += 15
    
    # Factor 4: Strategic importance (diversity gap)
    if contact_fills_diversity_gap(contact, user_network):
        base_score += 20
    
    # Factor 5: Upcoming events
    if has_upcoming_birthday(contact):
        base_score += 25
    
    return min(base_score, 100)
```

**Recommendation Types:**

1. **Overdue** (days since last interaction > expected)
   - Priority: High for close friends, medium for others
   - Action: "Reach out for [coffee/call/message]"

2. **Upcoming** (birthdays, anniversaries, events)
   - Priority: High if within 7 days
   - Action: "Send birthday wishes" or "Congratulate on work anniversary"

3. **Relationship Building** (low friendship score, high potential)
   - Priority: Medium
   - Action: "Schedule a deeper conversation"

4. **Diversity Gap** (contact fills underrepresented category)
   - Priority: Medium-Low
   - Action: "Strengthen this connection to improve network balance"

5. **Mutual Intro Opportunity**
   - Priority: Low-Medium
   - Action: "Introduce [Contact A] to [Contact B]"

---

## 7. Security & Privacy Requirements

### 7.1 Authentication & Authorization
- JWT tokens with 1-hour access token expiry, 30-day refresh token
- OAuth 2.0 for social login integrations
- Bcrypt password hashing (cost factor: 12)
- Rate limiting: 100 requests/minute per user
- CORS configured for web/mobile clients

### 7.2 Data Privacy
- Private notes are NEVER shared or accessible to other users
- Friendship scores and closeness levels are user-private
- Contact sharing requires explicit permission
- Users can only see introduction requests, not full contact details
- GDPR compliance: right to export and delete data

### 7.3 OAuth Token Security
- Store access tokens encrypted at rest (AES-256)
- Refresh tokens encrypted and rotated on use
- Token expiration monitoring and auto-refresh
- Revoke access on user disconnect

### 7.4 API Security
- HTTPS only (TLS 1.3)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection
- CSRF tokens for state-changing operations

### 7.5 Data Retention
- Soft delete for contacts (can restore within 30 days)
- Hard delete after 30 days or on user request
- Audit log for sensitive operations (retain 1 year)

---

## 8. Performance Requirements

### 8.1 Response Times (95th percentile)
- API endpoints: <200ms
- Contact list (50 items): <100ms
- Contact search: <150ms
- Dashboard load: <300ms
- Friendship score calculation: <50ms per contact

### 8.2 Scalability Targets
- Support 10,000 active users initially
- 2,000 contacts per user average
- 20M total contacts in database
- 100 concurrent OAuth sync jobs
- 1,000 requests/second peak load

### 8.3 Caching Strategy
- Redis for:
  - User sessions (JWT blacklist)
  - Contact list cache (TTL: 5 minutes)
  - Dashboard statistics (TTL: 1 hour)
  - Diversity index (TTL: 24 hours)
- Invalidate cache on write operations

### 8.4 Database Optimization
- Connection pooling (min: 10, max: 50)
- Read replicas for analytics queries
- Batch insert for contact imports (1000 rows/batch)
- Background job for score calculations (off-peak hours)

---

## 9. Third-Party Integrations

### 9.1 OAuth Providers

#### LinkedIn
- **Scopes:** `r_basicprofile`, `r_emailaddress`, `r_1st_connections_capped`
- **API:** LinkedIn Profile API, Connections API
- **Rate Limits:** 100 calls/day for connections

#### Facebook
- **Scopes:** `email`, `user_friends`, `user_location`
- **API:** Graph API
- **Rate Limits:** 200 calls/hour

#### VK (VKontakte)
- **Scopes:** `friends`, `email`
- **API:** VK API
- **Rate Limits:** 3 requests/second

#### Google
- **Scopes:** `contacts.readonly`, `profile`, `email`
- **API:** People API (Google Contacts)
- **Rate Limits:** 1,200 queries/minute

### 9.2 Email Service
- **Provider:** SendGrid or AWS SES
- **Use Cases:**
  - Password reset emails
  - Daily digest notifications
  - Welcome emails
  - Follow-up reminders

### 9.3 File Storage
- **Provider:** AWS S3 or Cloudflare R2
- **Use Cases:**
  - User avatars
  - Contact avatars (cached from LinkedIn, etc.)
  - CSV import files

### 9.4 Analytics (Optional)
- **Provider:** Mixpanel or Amplitude
- **Events:**
  - User registration
  - Contact added
  - Interaction logged
  - Recommendation accepted/dismissed
  - OAuth account connected

---

## 10. Error Handling & Logging

### 10.1 HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success with no response body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Maintenance or overload

### 10.2 Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "email_format"
    },
    "request_id": "uuid"
  }
}
```

### 10.3 Logging
- **Levels:** DEBUG, INFO, WARNING, ERROR, CRITICAL
- **Log aggregation:** Sentry or DataDog
- **Log contents:**
  - Request/response metadata
  - Error stack traces
  - Performance metrics
  - User actions (audit trail)
- **PII handling:** Never log passwords, tokens, or private notes

---

## 11. Testing Requirements

### 11.1 Unit Tests
- 80%+ code coverage
- Test all business logic functions
- Mock external API calls
- Pytest framework

### 11.2 Integration Tests
- API endpoint tests with test database
- OAuth flow testing (mocked)
- Database transaction tests
- Background job tests

### 11.3 Performance Tests
- Load testing with Locust or k6
- 1,000 requests/second target
- Database query performance benchmarks
- Friendship score calculation at scale

---

## 12. Deployment & DevOps

### 12.1 Environment Setup
- **Development:** Local Docker Compose
- **Staging:** AWS/DigitalOcean with CI/CD
- **Production:** Kubernetes or managed service

### 12.2 Infrastructure Components
- **Application:** FastAPI containers (2+ instances)
- **Database:** PostgreSQL (managed service recommended)
- **Cache:** Redis (managed service)
- **Queue:** Celery + Redis broker
- **Load Balancer:** Nginx or cloud provider LB
- **Monitoring:** Prometheus + Grafana

### 12.3 CI/CD Pipeline
1. Git push to main branch
2. Run linters (flake8, mypy)
3. Run unit tests
4. Run integration tests
5. Build Docker image
6. Push to container registry
7. Deploy to staging
8. Run smoke tests
9. Manual approval for production
10. Blue-green deployment to production

### 12.4 Database Migrations
- Alembic for schema migrations
- Version controlled migration files
- Rollback plan for each migration
- Test migrations on staging first

---

## 13. MVP Development Phases

### Phase 1: Core Authentication & User Management (Week 1-2)
- [ ] User registration and login
- [ ] OAuth integration (LinkedIn, Google)
- [ ] JWT authentication
- [ ] User profile CRUD
- [ ] Database schema setup

### Phase 2: Contact Management (Week 3-4)
- [ ] Create, read, update, delete contacts
- [ ] Manual contact addition
- [ ] Contact search and filtering
- [ ] Tags and closeness level
- [ ] Basic contact list UI API

### Phase 3: OAuth Contact Sync (Week 5-6)
- [ ] LinkedIn contact import
- [ ] Google Contacts import
- [ ] Background sync jobs
- [ ] Deduplication logic
- [ ] Sync status tracking

### Phase 4: Interactions & Activity Tracking (Week 7)
- [ ] Log interactions API
- [ ] Interaction history
- [ ] Interaction types
- [ ] Basic statistics

### Phase 5: Relationship Intelligence (Week 8-9)
- [ ] Friendship score calculation
- [ ] Diversity index calculation
- [ ] Background job scheduling
- [ ] Analytics dashboard API

### Phase 6: Cadence Engine (Week 10-11)
- [ ] Follow-up recommendation logic
- [ ] Priority score calculation
- [ ] Recommendation CRUD
- [ ] Notification system

### Phase 7: Introductions & Verification (Week 12)
- [ ] Connection verification
- [ ] Introduction requests
- [ ] Mutual intro flow

### Phase 8: Testing & Polish (Week 13-14)
- [ ] Unit test coverage
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] Deployment setup

---

## 14. API Versioning & Deprecation

- API version in URL path: `/api/v1/`
- Maintain backward compatibility for 6 months
- Deprecation warnings in response headers
- Version changelog documentation

---

## 15. Monitoring & Observability

### Key Metrics to Track:
1. **System Health**
   - API response times (p50, p95, p99)
   - Error rate
   - Database connection pool usage
   - Redis cache hit rate

2. **Business Metrics**
   - Daily active users
   - Contacts added per user
   - Interaction log rate
   - Recommendation acceptance rate
   - OAuth sync success rate

3. **Alerts**
   - API error rate >5%
   - Response time >500ms
   - Database connection pool exhausted
   - Background job failures
   - OAuth sync failures >20%

---

## 16. Future Enhancements (Post-MVP)

1. **AI-Powered Features**
   - Smart interaction summarization
   - Sentiment analysis on notes
   - Predictive relationship decay detection

2. **Mobile Apps**
   - iOS native app
   - Android native app
   - Push notifications

3. **Calendar Integration**
   - Google Calendar sync
   - Apple Calendar sync
   - Meeting auto-logging

4. **Messenger Integration**
   - WhatsApp message tracking
   - Telegram integration
   - iMessage analysis (iOS)

5. **Advanced Analytics**
   - Network visualization
   - Relationship heatmaps
   - Cohort analysis

6. **Team Features**
   - Shared contacts (for small teams)
   - Team diversity insights
   - Collaborative relationship management

---

## 17. Appendix

### A. Database Indexes Summary
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id);

-- Contacts
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vector);
CREATE INDEX idx_contacts_linkedin ON contacts(linkedin_id);

-- User_Contacts (CRITICAL for performance)
CREATE INDEX idx_user_contacts_user ON user_contacts(user_id) WHERE is_archived = FALSE;
CREATE INDEX idx_user_contacts_score ON user_contacts(user_id, friendship_score DESC);
CREATE INDEX idx_user_contacts_tags ON user_contacts USING GIN(tags);

-- Interactions
CREATE INDEX idx_interactions_user ON interactions(user_id, interaction_date DESC);
CREATE INDEX idx_interactions_contact ON interactions(contact_id, interaction_date DESC);

-- Recommendations
CREATE INDEX idx_recommendations_user_pending ON follow_up_recommendations(user_id, status, priority_score DESC);
```

### B. Environment Variables
```bash
# Application
APP_ENV=production
APP_SECRET_KEY=your-secret-key
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/naura
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

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

# Email
SENDGRID_API_KEY=your-api-key
FROM_EMAIL=noreply@naura.com

# Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=naura-uploads
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO

# Celery
CELERY_BROKER_URL=redis://host:6379/1
CELERY_RESULT_BACKEND=redis://host:6379/2
```

### C. Tech Stack Summary
- **Backend Framework:** FastAPI 0.104+
- **Database:** PostgreSQL 15+
- **ORM:** SQLAlchemy 2.0+
- **Migration:** Alembic
- **Cache:** Redis 7+
- **Task Queue:** Celery 5+
- **Authentication:** PyJWT, python-jose
- **Password Hashing:** bcrypt
- **HTTP Client:** httpx (for OAuth)
- **Validation:** Pydantic 2.0+
- **Testing:** Pytest
- **Deployment:** Docker, Kubernetes (optional)

---

## 18. Contact & Support

For questions regarding this specification:
- **Project Lead:** [Your Name]
- **Backend Team:** [Team Contact]
- **Documentation:** [Confluence/Notion Link]

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Status:** Ready for Development