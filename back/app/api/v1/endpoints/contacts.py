from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import uuid

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.models.contact import Contact, UserContact
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactList
)

router = APIRouter()


@router.get("", response_model=ContactList)
def get_contacts(
    search: Optional[str] = Query(None, description="Search in name, email, company"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    source: Optional[str] = Query(None, description="Filter by import source"),
    sort_by: str = Query("name", description="Sort field: name, created_at, updated_at"),
    order: str = Query("asc", description="Sort order: asc, desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=200, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get user's contacts with filtering and pagination."""
    
    # Base query for user's non-archived contacts
    query = db.query(Contact, UserContact).join(
        UserContact, Contact.id == UserContact.contact_id
    ).filter(
        UserContact.user_id == current_user.id,
        UserContact.is_archived == False
    )
    
    # Apply search filter
    if search:
        search_filter = or_(
            Contact.first_name.ilike(f"%{search}%"),
            Contact.last_name.ilike(f"%{search}%"),
            Contact.email.ilike(f"%{search}%"),
            Contact.company.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Apply tags filter
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",")]
        query = query.filter(UserContact.tags.overlap(tag_list))
    
    # Apply source filter
    if source:
        query = query.filter(UserContact.import_source == source)
    
    # Count total results
    total = query.count()
    
    # Apply sorting
    if sort_by == "name":
        if order == "desc":
            query = query.order_by(Contact.first_name.desc(), Contact.last_name.desc())
        else:
            query = query.order_by(Contact.first_name.asc(), Contact.last_name.asc())
    elif sort_by == "created_at":
        if order == "desc":
            query = query.order_by(UserContact.created_at.desc())
        else:
            query = query.order_by(UserContact.created_at.asc())
    elif sort_by == "updated_at":
        if order == "desc":
            query = query.order_by(UserContact.updated_at.desc())
        else:
            query = query.order_by(UserContact.updated_at.asc())
    
    # Apply pagination
    offset = (page - 1) * limit
    results = query.offset(offset).limit(limit).all()
    
    # Format response
    contacts = []
    for contact, user_contact in results:
        contact_data = ContactResponse.from_orm(contact)
        # Add user-specific data
        contact_data.tags = user_contact.tags or []
        contact_data.private_notes = user_contact.private_notes
        contact_data.import_source = user_contact.import_source
        contact_data.import_date = user_contact.import_date
        contacts.append(contact_data)
    
    return ContactList(
        contacts=contacts,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get contact details."""
    
    try:
        contact_uuid = uuid.UUID(contact_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid contact ID format"
        )
    
    # Get contact with user relationship
    result = db.query(Contact, UserContact).join(
        UserContact, Contact.id == UserContact.contact_id
    ).filter(
        UserContact.user_id == current_user.id,
        Contact.id == contact_uuid,
        UserContact.is_archived == False
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    contact, user_contact = result
    
    # Format response
    contact_data = ContactResponse.from_orm(contact)
    contact_data.tags = user_contact.tags or []
    contact_data.private_notes = user_contact.private_notes
    contact_data.import_source = user_contact.import_source
    contact_data.import_date = user_contact.import_date
    
    return contact_data


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    contact_data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create a new contact manually."""
    
    # Check for existing contact by email or social IDs
    existing_contact = None
    if contact_data.email:
        existing_contact = db.query(Contact).filter(Contact.email == contact_data.email).first()
    
    if not existing_contact and contact_data.linkedin_id:
        existing_contact = db.query(Contact).filter(Contact.linkedin_id == contact_data.linkedin_id).first()
    
    # Create or use existing contact
    if existing_contact:
        contact = existing_contact
    else:
        # Create new contact
        contact_dict = contact_data.dict(exclude={"tags", "private_notes"})
        contact = Contact(**contact_dict, source_provider="manual")
        db.add(contact)
        db.flush()  # Get the ID
    
    # Check if user already has this contact
    existing_user_contact = db.query(UserContact).filter(
        UserContact.user_id == current_user.id,
        UserContact.contact_id == contact.id
    ).first()
    
    if existing_user_contact:
        if existing_user_contact.is_archived:
            # Restore archived contact
            existing_user_contact.is_archived = False
            existing_user_contact.tags = contact_data.tags
            existing_user_contact.private_notes = contact_data.private_notes
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Contact already exists in your network"
            )
    else:
        # Create user-contact relationship
        user_contact = UserContact(
            user_id=current_user.id,
            contact_id=contact.id,
            tags=contact_data.tags,
            private_notes=contact_data.private_notes,
            import_source="manual"
        )
        db.add(user_contact)
    
    db.commit()
    
    # Format response
    contact_data = ContactResponse.from_orm(contact)
    if existing_user_contact:
        contact_data.tags = existing_user_contact.tags or []
        contact_data.private_notes = existing_user_contact.private_notes
        contact_data.import_source = existing_user_contact.import_source
    else:
        contact_data.tags = contact_data.tags
        contact_data.private_notes = contact_data.private_notes
        contact_data.import_source = "manual"
    
    return contact_data


@router.patch("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: str,
    update_data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Update contact information."""
    
    try:
        contact_uuid = uuid.UUID(contact_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid contact ID format"
        )
    
    # Get contact and user relationship
    result = db.query(Contact, UserContact).join(
        UserContact, Contact.id == UserContact.contact_id
    ).filter(
        UserContact.user_id == current_user.id,
        Contact.id == contact_uuid,
        UserContact.is_archived == False
    ).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    contact, user_contact = result
    
    # Update contact data
    contact_fields = {
        "first_name", "last_name", "email", "phone_number", "company", 
        "position", "bio", "location", "linkedin_id", "facebook_id", 
        "vk_id", "telegram_username", "whatsapp_number"
    }
    
    update_dict = update_data.dict(exclude_unset=True)
    
    for field, value in update_dict.items():
        if field in contact_fields:
            setattr(contact, field, value)
        elif field == "tags":
            user_contact.tags = value
        elif field == "private_notes":
            user_contact.private_notes = value
    
    db.commit()
    
    # Format response
    contact_data = ContactResponse.from_orm(contact)
    contact_data.tags = user_contact.tags or []
    contact_data.private_notes = user_contact.private_notes
    contact_data.import_source = user_contact.import_source
    contact_data.import_date = user_contact.import_date
    
    return contact_data


@router.delete("/{contact_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> None:
    """Archive (soft delete) a contact."""
    
    try:
        contact_uuid = uuid.UUID(contact_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid contact ID format"
        )
    
    # Get user-contact relationship
    user_contact = db.query(UserContact).filter(
        UserContact.user_id == current_user.id,
        UserContact.contact_id == contact_uuid,
        UserContact.is_archived == False
    ).first()
    
    if not user_contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    # Soft delete
    user_contact.is_archived = True
    db.commit()
    
    return None