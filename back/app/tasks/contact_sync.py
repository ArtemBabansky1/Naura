from celery import current_task
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from typing import Dict, Any
import logging

from app.worker import celery_app
from app.core.config import settings
from app.services.contact_sync import ContactSyncService

# Setup database connection for tasks
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.sync_contacts")
def sync_contacts_from_account(self, user_id: str, account_id: str) -> Dict[str, Any]:
    """
    Background task to sync contacts from OAuth provider.
    
    Args:
        user_id: UUID of the user
        account_id: UUID of the connected account
    
    Returns:
        Dict with sync results
    """
    
    # Update task state
    self.update_state(
        state="PROGRESS",
        meta={"status": "Starting contact sync", "progress": 0}
    )
    
    db = SessionLocal()
    
    try:
        # Create sync service
        sync_service = ContactSyncService(db)
        
        # Update progress
        self.update_state(
            state="PROGRESS", 
            meta={"status": "Fetching contacts from provider", "progress": 25}
        )
        
        # Perform sync
        results = sync_service.sync_contacts_from_account(user_id, account_id)
        
        # Update progress
        self.update_state(
            state="PROGRESS",
            meta={"status": "Processing contacts", "progress": 75}
        )
        
        # Final result
        self.update_state(
            state="SUCCESS",
            meta={
                "status": "Sync completed",
                "progress": 100,
                "results": results
            }
        )
        
        logger.info(f"Contact sync completed for user {user_id}: {results}")
        
        return {
            "status": "completed",
            "user_id": user_id,
            "account_id": account_id,
            "results": results
        }
        
    except Exception as exc:
        # Log error
        logger.error(f"Contact sync failed for user {user_id}: {exc}")
        
        # Update task state
        self.update_state(
            state="FAILURE",
            meta={
                "status": "Sync failed",
                "error": str(exc),
                "progress": 0
            }
        )
        
        # Re-raise exception
        raise exc
        
    finally:
        db.close()


@celery_app.task(name="app.tasks.refresh_oauth_tokens")
def refresh_oauth_tokens() -> Dict[str, Any]:
    """
    Periodic task to refresh OAuth tokens that are about to expire.
    """
    
    from datetime import datetime, timezone, timedelta
    from app.models.connected_account import ConnectedAccount
    
    db = SessionLocal()
    
    try:
        # Find tokens expiring in the next 24 hours
        expiry_threshold = datetime.now(timezone.utc) + timedelta(hours=24)
        
        accounts_to_refresh = db.query(ConnectedAccount).filter(
            ConnectedAccount.is_active == True,
            ConnectedAccount.token_expires_at <= expiry_threshold,
            ConnectedAccount.refresh_token != None
        ).all()
        
        sync_service = ContactSyncService(db)
        
        results = {
            "total_accounts": len(accounts_to_refresh),
            "refreshed": 0,
            "failed": 0,
            "errors": []
        }
        
        for account in accounts_to_refresh:
            try:
                success = sync_service.refresh_account_token(str(account.id))
                if success:
                    results["refreshed"] += 1
                else:
                    results["failed"] += 1
                    
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "account_id": str(account.id),
                    "provider": account.provider,
                    "error": str(e)
                })
        
        logger.info(f"Token refresh completed: {results}")
        return results
        
    except Exception as exc:
        logger.error(f"Token refresh task failed: {exc}")
        raise exc
        
    finally:
        db.close()


@celery_app.task(name="app.tasks.cleanup_expired_tokens")
def cleanup_expired_tokens() -> Dict[str, Any]:
    """
    Periodic task to cleanup expired password reset tokens.
    """
    
    from datetime import datetime, timezone
    from app.models.password_reset_token import PasswordResetToken
    
    db = SessionLocal()
    
    try:
        # Delete expired tokens
        expired_tokens = db.query(PasswordResetToken).filter(
            PasswordResetToken.expires_at <= datetime.now(timezone.utc)
        )
        
        count = expired_tokens.count()
        expired_tokens.delete()
        db.commit()
        
        logger.info(f"Cleaned up {count} expired password reset tokens")
        
        return {
            "status": "completed",
            "deleted_tokens": count
        }
        
    except Exception as exc:
        logger.error(f"Token cleanup task failed: {exc}")
        raise exc
        
    finally:
        db.close()