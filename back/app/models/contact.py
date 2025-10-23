from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Contact(Base):
    """Centralized contact storage across all users."""
    __tablename__ = "contacts"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic Info
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone_number = Column(String(50), nullable=True)
    
    # Profile
    avatar_url = Column(Text, nullable=True)
    company = Column(String(255), nullable=True)
    position = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    
    # Social IDs (for deduplication)
    linkedin_id = Column(String(255), unique=True, nullable=True, index=True)
    facebook_id = Column(String(255), unique=True, nullable=True, index=True)
    vk_id = Column(String(255), unique=True, nullable=True, index=True)
    telegram_username = Column(String(255), nullable=True)
    whatsapp_number = Column(String(50), nullable=True)
    
    # Import Info
    source_provider = Column(String(50), nullable=True)  # linkedin, facebook, google, vk, manual
    external_source_id = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user_contacts = relationship("UserContact", back_populates="contact", cascade="all, delete-orphan")
    
    @property
    def full_name(self) -> str:
        """Get contact's full name."""
        parts = []
        if self.first_name:
            parts.append(self.first_name)
        if self.last_name:
            parts.append(self.last_name)
        return " ".join(parts) or self.email or "Unnamed Contact"
    
    def __repr__(self):
        return f"<Contact(id={self.id}, name={self.full_name})>"


class UserContact(Base):
    """Junction table linking users to contacts with user-specific data."""
    __tablename__ = "user_contacts"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    
    # User-specific data
    tags = Column(ARRAY(String), default=list)  # ["colleague", "tech", "friend"]
    private_notes = Column(Text, nullable=True)
    
    # Import Info
    import_source = Column(String(50), nullable=True)  # linkedin, facebook, google, vk, manual
    import_date = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_archived = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="user_contacts")
    contact = relationship("Contact", back_populates="user_contacts")
    
    def __repr__(self):
        return f"<UserContact(user_id={self.user_id}, contact_id={self.contact_id})>"


# Create indexes for performance
Index("idx_user_contacts_user", UserContact.user_id)
Index("idx_user_contacts_user_active", UserContact.user_id, postgresql_where=UserContact.is_archived == False)
Index("idx_contacts_search", Contact.first_name, Contact.last_name, Contact.company)