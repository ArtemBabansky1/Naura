from typing import Any, List
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
import logging

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.connected_account import ConnectedAccount
from app.schemas.connected_account import (
    ConnectedAccountResponse,
    OAuthConnect,
    SyncResponse,
    SyncStatus
)
from app.services.oauth import get_oauth_service
from app.tasks.contact_sync import sync_contacts_from_account

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=List[ConnectedAccountResponse])
def get_connected_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """List all connected social media accounts."""
    
    accounts = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.is_active == True
    ).all()
    
    return [ConnectedAccountResponse.from_orm(account) for account in accounts]


@router.post("/connect/{provider}", response_model=ConnectedAccountResponse, status_code=status.HTTP_201_CREATED)
async def connect_account(
    provider: str,
    oauth_data: OAuthConnect,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Connect a social media account via OAuth."""
    
    # Validate provider
    valid_providers = ["google", "linkedin", "facebook", "vk"]
    if provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider. Must be one of: {', '.join(valid_providers)}"
        )
    
    # Check if account already connected
    existing_account = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.provider == provider,
        ConnectedAccount.is_active == True
    ).first()
    
    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{provider.title()} account already connected"
        )
    
    try:
        # Get OAuth service
        oauth_service = get_oauth_service(provider)
        
        # Exchange code for token
        token_data = await oauth_service.exchange_code_for_token(
            oauth_data.authorization_code,
            oauth_data.redirect_uri
        )
        
        # Get user info from provider
        user_info = await oauth_service.get_user_info(token_data["access_token"])
        
        # Create connected account
        account = ConnectedAccount(
            user_id=current_user.id,
            provider=provider,
            provider_user_id=str(user_info.get("id")),
            provider_email=user_info.get("email"),
            access_token=token_data["access_token"],
            refresh_token=token_data.get("refresh_token"),
            token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600)),
            scopes=oauth_service.scopes,
            sync_status="pending"
        )
        
        db.add(account)
        db.commit()
        db.refresh(account)
        
        # Trigger background sync job
        sync_contacts_from_account.delay(str(current_user.id), str(account.id))
        
        logger.info(f"Connected {provider} account for user {current_user.id}")
        
        return ConnectedAccountResponse.from_orm(account)
        
    except Exception as e:
        logger.error(f"Failed to connect {provider} account for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect {provider} account"
        )


@router.post("/{account_id}/sync", response_model=SyncResponse)
def sync_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Manually trigger contact synchronization."""
    
    try:
        account_uuid = uuid.UUID(account_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account ID format"
        )
    
    # Get connected account
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_uuid,
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.is_active == True
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found"
        )
    
    # Update sync status
    account.sync_status = "pending"
    db.commit()
    
    # Trigger Celery background job for sync
    task = sync_contacts_from_account.delay(str(current_user.id), str(account.id))
    
    logger.info(f"Started contact sync job {task.id} for account {account_id}")
    
    return SyncResponse(
        message="Sync job started",
        job_id=task.id,
        estimated_time_minutes=3
    )


@router.get("/{account_id}/sync-status", response_model=SyncStatus)
def get_sync_status(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Check sync job status."""
    
    try:
        account_uuid = uuid.UUID(account_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account ID format"
        )
    
    # Get connected account
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_uuid,
        ConnectedAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found"
        )
    
    return SyncStatus(
        account_id=account.id,
        provider=account.provider,
        sync_status=account.sync_status,
        progress_percentage=0 if account.sync_status == "pending" else 100,
        contacts_imported=0,  # Would be tracked in sync job
        last_sync_at=account.last_sync_at,
        sync_error=account.sync_error
    )


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def disconnect_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Disconnect a social media account."""
    
    try:
        account_uuid = uuid.UUID(account_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account ID format"
        )
    
    # Get connected account
    account = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_uuid,
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.is_active == True
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connected account not found"
        )
    
    # Soft delete - deactivate account
    account.is_active = False
    db.commit()
    
    # TODO: Revoke OAuth tokens with provider
    
    return None