"""Celery configuration for Naura CRM."""

from datetime import timedelta
from app.core.config import settings

# Broker and backend
broker_url = settings.CELERY_BROKER_URL
result_backend = settings.CELERY_RESULT_BACKEND

# Task serialization
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']

# Timezone
timezone = 'UTC'
enable_utc = True

# Task execution
task_track_started = True
task_time_limit = 30 * 60  # 30 minutes
task_soft_time_limit = 25 * 60  # 25 minutes
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 1000

# Task routing
task_routes = {
    'app.tasks.sync_contacts_from_account': {'queue': 'sync'},
    'app.tasks.send_password_reset_email': {'queue': 'email'},
    'app.tasks.send_welcome_email': {'queue': 'email'},
    'app.tasks.refresh_oauth_tokens': {'queue': 'maintenance'},
    'app.tasks.cleanup_expired_tokens': {'queue': 'maintenance'},
}

# Beat schedule for periodic tasks
beat_schedule = {
    'refresh-oauth-tokens': {
        'task': 'app.tasks.refresh_oauth_tokens',
        'schedule': timedelta(hours=6),  # Every 6 hours
    },
    'cleanup-expired-tokens': {
        'task': 'app.tasks.cleanup_expired_tokens',
        'schedule': timedelta(hours=24),  # Daily
    },
}

# Worker settings
worker_log_level = 'INFO'
worker_hijack_root_logger = False