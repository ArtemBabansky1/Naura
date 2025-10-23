from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID


class ConnectedAccountBase(BaseModel):
    provider: str
    provider_user_id: str
    provider_email: Optional[str] = None
    scopes: List[str] = []


class ConnectedAccountCreate(ConnectedAccountBase):
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None


class ConnectedAccountResponse(BaseModel):
    id: UUID
    provider: str
    provider_email: Optional[str] = None
    is_active: bool
    last_sync_at: Optional[datetime] = None
    sync_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class OAuthConnect(BaseModel):
    """OAuth connection request."""
    authorization_code: str
    redirect_uri: str


class SyncResponse(BaseModel):
    """Response for sync operations."""
    message: str
    job_id: UUID
    estimated_time_minutes: int = 3


class SyncStatus(BaseModel):
    """Sync status response."""
    account_id: UUID
    provider: str
    sync_status: str
    progress_percentage: int = 0
    contacts_imported: int = 0
    last_sync_at: Optional[datetime] = None
    sync_error: Optional[str] = None