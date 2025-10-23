from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging

from app.models.user import User
from app.models.contact import Contact, UserContact
from app.models.connected_account import ConnectedAccount
from app.services.oauth import get_oauth_service

logger = logging.getLogger(__name__)


class ContactSyncService:
    """Service for synchronizing contacts from OAuth providers."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def sync_contacts_from_account(
        self, 
        user_id: str, 
        account_id: str
    ) -> Dict[str, Any]:
        """Sync contacts from a connected account."""
        
        # Get connected account
        account = self.db.query(ConnectedAccount).filter(
            ConnectedAccount.id == account_id,
            ConnectedAccount.user_id == user_id,
            ConnectedAccount.is_active == True
        ).first()
        
        if not account:
            raise ValueError("Connected account not found")
        
        # Update sync status
        account.sync_status = "syncing"
        account.sync_error = None
        self.db.commit()
        
        try:
            # Get OAuth service
            oauth_service = get_oauth_service(account.provider)
            
            # Fetch contacts from provider
            raw_contacts = await oauth_service.get_contacts(account.access_token)
            
            # Process and save contacts
            sync_results = await self._process_contacts(
                user_id=user_id,
                raw_contacts=raw_contacts,
                provider=account.provider
            )
            
            # Update sync status
            account.sync_status = "completed"
            account.last_sync_at = datetime.now(timezone.utc)
            self.db.commit()
            
            logger.info(f"Successfully synced {sync_results['imported']} contacts for user {user_id}")
            
            return sync_results
            
        except Exception as e:
            # Update sync status with error
            account.sync_status = "error"
            account.sync_error = str(e)
            self.db.commit()
            
            logger.error(f"Contact sync failed for user {user_id}: {e}")
            raise
    
    async def _process_contacts(
        self, 
        user_id: str, 
        raw_contacts: List[Dict[str, Any]], 
        provider: str
    ) -> Dict[str, Any]:
        """Process and save contacts to database."""
        
        stats = {
            "total": len(raw_contacts),
            "imported": 0,
            "skipped": 0,
            "updated": 0,
            "errors": []
        }
        
        for contact_data in raw_contacts:
            try:
                result = await self._import_contact(user_id, contact_data, provider)
                if result == "imported":
                    stats["imported"] += 1
                elif result == "updated":
                    stats["updated"] += 1
                else:
                    stats["skipped"] += 1
                    
            except Exception as e:
                stats["errors"].append({
                    "contact": contact_data,
                    "error": str(e)
                })
                logger.warning(f"Failed to import contact: {e}")
        
        return stats
    
    async def _import_contact(
        self, 
        user_id: str, 
        contact_data: Dict[str, Any], 
        provider: str
    ) -> str:
        """Import a single contact."""
        
        # Skip contacts with no meaningful data
        if not self._is_valid_contact(contact_data):
            return "skipped"
        
        # Find existing contact using deduplication strategy
        existing_contact = self._find_existing_contact(contact_data)
        
        if existing_contact:
            contact = existing_contact
            # Update contact data if needed
            self._update_contact_data(contact, contact_data)
            action = "updated"
        else:
            # Create new contact
            contact = self._create_contact(contact_data)
            action = "imported"
        
        # Check if user already has this contact
        existing_user_contact = self.db.query(UserContact).filter(
            UserContact.user_id == user_id,
            UserContact.contact_id == contact.id
        ).first()
        
        if existing_user_contact:
            if existing_user_contact.is_archived:
                # Restore archived contact
                existing_user_contact.is_archived = False
                existing_user_contact.import_source = provider
                existing_user_contact.import_date = datetime.now(timezone.utc)
            # Skip if already exists and active
            return "skipped"
        else:
            # Create user-contact relationship
            user_contact = UserContact(
                user_id=user_id,
                contact_id=contact.id,
                import_source=provider,
                import_date=datetime.now(timezone.utc),
                tags=[provider]  # Add provider as default tag
            )
            self.db.add(user_contact)
        
        self.db.commit()
        return action
    
    def _is_valid_contact(self, contact_data: Dict[str, Any]) -> bool:
        """Check if contact has minimum required data."""
        has_name = contact_data.get("first_name") or contact_data.get("last_name")
        has_email = contact_data.get("email")
        has_social_id = (
            contact_data.get("linkedin_id") or 
            contact_data.get("facebook_id") or 
            contact_data.get("vk_id")
        )
        
        return has_name or has_email or has_social_id
    
    def _find_existing_contact(self, contact_data: Dict[str, Any]) -> Optional[Contact]:
        """Find existing contact using deduplication strategy."""
        
        # 1. Check by LinkedIn ID
        if contact_data.get("linkedin_id"):
            contact = self.db.query(Contact).filter(
                Contact.linkedin_id == contact_data["linkedin_id"]
            ).first()
            if contact:
                return contact
        
        # 2. Check by Facebook ID
        if contact_data.get("facebook_id"):
            contact = self.db.query(Contact).filter(
                Contact.facebook_id == contact_data["facebook_id"]
            ).first()
            if contact:
                return contact
        
        # 3. Check by VK ID
        if contact_data.get("vk_id"):
            contact = self.db.query(Contact).filter(
                Contact.vk_id == contact_data["vk_id"]
            ).first()
            if contact:
                return contact
        
        # 4. Check by email (exact match)
        if contact_data.get("email"):
            contact = self.db.query(Contact).filter(
                Contact.email.ilike(contact_data["email"])
            ).first()
            if contact:
                return contact
        
        # 5. Check by name + company (potential duplicate)
        first_name = contact_data.get("first_name")
        last_name = contact_data.get("last_name")
        company = contact_data.get("company")
        
        if first_name and last_name and company:
            contact = self.db.query(Contact).filter(
                Contact.first_name.ilike(first_name),
                Contact.last_name.ilike(last_name),
                Contact.company.ilike(company)
            ).first()
            if contact:
                return contact
        
        return None
    
    def _create_contact(self, contact_data: Dict[str, Any]) -> Contact:
        """Create new contact from data."""
        contact = Contact(
            first_name=contact_data.get("first_name"),
            last_name=contact_data.get("last_name"),
            email=contact_data.get("email"),
            phone_number=contact_data.get("phone_number"),
            company=contact_data.get("company"),
            position=contact_data.get("position"),
            bio=contact_data.get("bio"),
            location=contact_data.get("location"),
            avatar_url=contact_data.get("avatar_url"),
            linkedin_id=contact_data.get("linkedin_id"),
            facebook_id=contact_data.get("facebook_id"),
            vk_id=contact_data.get("vk_id"),
            telegram_username=contact_data.get("telegram_username"),
            whatsapp_number=contact_data.get("whatsapp_number"),
            source_provider=contact_data.get("source_provider"),
            external_source_id=contact_data.get("external_source_id")
        )
        
        self.db.add(contact)
        self.db.flush()  # Get the ID
        return contact
    
    def _update_contact_data(self, contact: Contact, contact_data: Dict[str, Any]):
        """Update existing contact with new data."""
        
        # Update fields if new data is more complete
        for field in [
            "first_name", "last_name", "email", "phone_number", 
            "company", "position", "bio", "location", "avatar_url",
            "linkedin_id", "facebook_id", "vk_id", 
            "telegram_username", "whatsapp_number"
        ]:
            new_value = contact_data.get(field)
            if new_value and not getattr(contact, field):
                setattr(contact, field, new_value)
    
    async def refresh_account_token(self, account_id: str) -> bool:
        """Refresh OAuth token for account if possible."""
        
        account = self.db.query(ConnectedAccount).filter(
            ConnectedAccount.id == account_id,
            ConnectedAccount.is_active == True
        ).first()
        
        if not account or not account.refresh_token:
            return False
        
        try:
            oauth_service = get_oauth_service(account.provider)
            
            # Try to refresh token
            token_data = await oauth_service.refresh_token(account.refresh_token)
            
            if token_data:
                account.access_token = token_data["access_token"]
                if "refresh_token" in token_data:
                    account.refresh_token = token_data["refresh_token"]
                if "expires_in" in token_data:
                    account.token_expires_at = datetime.now(timezone.utc) + \
                        timedelta(seconds=token_data["expires_in"])
                
                self.db.commit()
                return True
                
        except Exception as e:
            logger.error(f"Token refresh failed for account {account_id}: {e}")
        
        return False
    
    def get_sync_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get sync statistics for user."""
        
        # Get all connected accounts
        accounts = self.db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == user_id,
            ConnectedAccount.is_active == True
        ).all()
        
        # Get contact counts by source
        contact_stats = {}
        for account in accounts:
            count = self.db.query(UserContact).filter(
                UserContact.user_id == user_id,
                UserContact.import_source == account.provider,
                UserContact.is_archived == False
            ).count()
            
            contact_stats[account.provider] = {
                "count": count,
                "last_sync": account.last_sync_at,
                "sync_status": account.sync_status
            }
        
        return {
            "connected_accounts": len(accounts),
            "contact_sources": contact_stats,
            "total_synced_contacts": sum(stats["count"] for stats in contact_stats.values())
        }