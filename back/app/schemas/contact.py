from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
from uuid import UUID


class ContactBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    linkedin_id: Optional[str] = None
    facebook_id: Optional[str] = None
    vk_id: Optional[str] = None
    telegram_username: Optional[str] = None
    whatsapp_number: Optional[str] = None


class ContactCreate(ContactBase):
    # User-specific fields
    tags: List[str] = []
    private_notes: Optional[str] = None


class ContactUpdate(BaseModel):
    # Contact fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    linkedin_id: Optional[str] = None
    facebook_id: Optional[str] = None
    vk_id: Optional[str] = None
    telegram_username: Optional[str] = None
    whatsapp_number: Optional[str] = None
    
    # User-specific fields
    tags: Optional[List[str]] = None
    private_notes: Optional[str] = None


class ContactResponse(ContactBase):
    id: UUID
    avatar_url: Optional[str] = None
    source_provider: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # User-specific data (from UserContact)
    tags: List[str] = []
    private_notes: Optional[str] = None
    import_source: Optional[str] = None
    import_date: Optional[datetime] = None
    
    @property
    def full_name(self) -> str:
        parts = []
        if self.first_name:
            parts.append(self.first_name)
        if self.last_name:
            parts.append(self.last_name)
        return " ".join(parts) or self.email or "Unnamed Contact"
    
    class Config:
        from_attributes = True


class UserContactResponse(BaseModel):
    """Response for user-contact relationship data."""
    id: UUID
    user_id: UUID
    contact_id: UUID
    tags: List[str] = []
    private_notes: Optional[str] = None
    import_source: Optional[str] = None
    import_date: Optional[datetime] = None
    is_archived: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Include contact data
    contact: ContactResponse
    
    class Config:
        from_attributes = True


class ContactList(BaseModel):
    """Response for contact list with pagination."""
    contacts: List[ContactResponse]
    pagination: dict
    
    class Config:
        from_attributes = True


class ContactSearch(BaseModel):
    """Contact search parameters."""
    search: Optional[str] = None
    tags: Optional[List[str]] = None
    source: Optional[str] = None
    sort_by: str = "name"
    order: str = "asc"
    page: int = 1
    limit: int = 50