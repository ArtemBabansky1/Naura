from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
import httpx
import json
from urllib.parse import urlencode, parse_qs, urlparse

from app.core.config import settings


class OAuthService(ABC):
    """Abstract base class for OAuth providers."""
    
    def __init__(self):
        self.client_id = None
        self.client_secret = None
        self.redirect_uri = None
        self.scopes = []
        self.token_url = ""
        self.user_info_url = ""
        self.contacts_url = ""
    
    @abstractmethod
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        pass
    
    @abstractmethod
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from provider."""
        pass
    
    @abstractmethod
    async def get_contacts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get contacts from provider."""
        pass
    
    @abstractmethod
    def get_authorization_url(self, state: str = None) -> str:
        """Generate authorization URL."""
        pass
    
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh access token if supported."""
        return None


class GoogleOAuth(OAuthService):
    """Google OAuth implementation."""
    
    def __init__(self):
        super().__init__()
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        self.scopes = [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/contacts.readonly"
        ]
        self.token_url = "https://oauth2.googleapis.com/token"
        self.user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        self.contacts_url = "https://people.googleapis.com/v1/people/me/connections"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Generate Google OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes),
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        if state:
            params["state"] = state
        
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for Google access token."""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, data=data)
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get Google user information."""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_info_url, headers=headers)
            response.raise_for_status()
            return response.json()
    
    async def get_contacts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get Google contacts."""
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "personFields": "names,emailAddresses,phoneNumbers,organizations,photos,urls",
            "pageSize": 1000
        }
        
        contacts = []
        next_page_token = None
        
        async with httpx.AsyncClient() as client:
            while True:
                if next_page_token:
                    params["pageToken"] = next_page_token
                
                response = await client.get(
                    self.contacts_url, 
                    headers=headers, 
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                
                if "connections" in data:
                    for person in data["connections"]:
                        contact = self._parse_google_contact(person)
                        if contact:
                            contacts.append(contact)
                
                next_page_token = data.get("nextPageToken")
                if not next_page_token:
                    break
        
        return contacts
    
    def _parse_google_contact(self, person: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse Google contact data."""
        contact = {}
        
        # Name
        if "names" in person and person["names"]:
            name = person["names"][0]
            contact["first_name"] = name.get("givenName")
            contact["last_name"] = name.get("familyName")
        
        # Email
        if "emailAddresses" in person and person["emailAddresses"]:
            contact["email"] = person["emailAddresses"][0]["value"]
        
        # Phone
        if "phoneNumbers" in person and person["phoneNumbers"]:
            contact["phone_number"] = person["phoneNumbers"][0]["value"]
        
        # Organization
        if "organizations" in person and person["organizations"]:
            org = person["organizations"][0]
            contact["company"] = org.get("name")
            contact["position"] = org.get("title")
        
        # Photo
        if "photos" in person and person["photos"]:
            contact["avatar_url"] = person["photos"][0]["url"]
        
        # Skip if no meaningful data
        if not any([contact.get("first_name"), contact.get("last_name"), contact.get("email")]):
            return None
        
        contact["source_provider"] = "google"
        return contact
    
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresh Google access token."""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.token_url, data=data)
            response.raise_for_status()
            return response.json()


class LinkedInOAuth(OAuthService):
    """LinkedIn OAuth implementation."""
    
    def __init__(self):
        super().__init__()
        self.client_id = settings.LINKEDIN_CLIENT_ID
        self.client_secret = settings.LINKEDIN_CLIENT_SECRET
        self.redirect_uri = settings.LINKEDIN_REDIRECT_URI
        self.scopes = ["r_liteprofile", "r_emailaddress"]
        self.token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        self.user_info_url = "https://api.linkedin.com/v2/people/~"
        self.email_url = "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Generate LinkedIn OAuth authorization URL."""
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(self.scopes)
        }
        if state:
            params["state"] = state
        
        return f"https://www.linkedin.com/oauth/v2/authorization?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for LinkedIn access token."""
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get LinkedIn user information."""
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            # Get profile info
            profile_response = await client.get(
                f"{self.user_info_url}?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
                headers=headers
            )
            profile_response.raise_for_status()
            profile_data = profile_response.json()
            
            # Get email
            email_response = await client.get(self.email_url, headers=headers)
            email_response.raise_for_status()
            email_data = email_response.json()
            
            # Combine data
            user_info = {
                "id": profile_data["id"],
                "first_name": profile_data.get("firstName", {}).get("localized", {}).get("en_US"),
                "last_name": profile_data.get("lastName", {}).get("localized", {}).get("en_US"),
            }
            
            if email_data.get("elements"):
                user_info["email"] = email_data["elements"][0]["handle~"]["emailAddress"]
            
            # Profile picture
            if "profilePicture" in profile_data:
                pictures = profile_data["profilePicture"].get("displayImage~", {}).get("elements", [])
                if pictures:
                    user_info["picture"] = pictures[-1]["identifiers"][0]["identifier"]
            
            return user_info
    
    async def get_contacts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get LinkedIn connections (limited by API)."""
        # Note: LinkedIn heavily restricts connection data access
        # This is a placeholder - real implementation would need special approval
        return []


class FacebookOAuth(OAuthService):
    """Facebook OAuth implementation."""
    
    def __init__(self):
        super().__init__()
        self.client_id = settings.FACEBOOK_APP_ID
        self.client_secret = settings.FACEBOOK_APP_SECRET
        self.redirect_uri = settings.FACEBOOK_REDIRECT_URI
        self.scopes = ["email", "user_friends"]
        self.token_url = "https://graph.facebook.com/v18.0/oauth/access_token"
        self.user_info_url = "https://graph.facebook.com/v18.0/me"
        self.friends_url = "https://graph.facebook.com/v18.0/me/friends"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Generate Facebook OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": ",".join(self.scopes),
            "response_type": "code"
        }
        if state:
            params["state"] = state
        
        return f"https://www.facebook.com/v18.0/dialog/oauth?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for Facebook access token."""
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": redirect_uri,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.token_url, params=params)
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get Facebook user information."""
        params = {
            "fields": "id,name,email,first_name,last_name,picture",
            "access_token": access_token
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.user_info_url, params=params)
            response.raise_for_status()
            return response.json()
    
    async def get_contacts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get Facebook friends."""
        params = {
            "fields": "id,name,first_name,last_name,picture",
            "access_token": access_token
        }
        
        contacts = []
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.friends_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if "data" in data:
                for friend in data["data"]:
                    contact = {
                        "first_name": friend.get("first_name"),
                        "last_name": friend.get("last_name"),
                        "facebook_id": friend["id"],
                        "source_provider": "facebook"
                    }
                    
                    if "picture" in friend and "data" in friend["picture"]:
                        contact["avatar_url"] = friend["picture"]["data"]["url"]
                    
                    contacts.append(contact)
        
        return contacts


class VKOAuth(OAuthService):
    """VKontakte OAuth implementation."""
    
    def __init__(self):
        super().__init__()
        self.client_id = settings.VK_APP_ID
        self.client_secret = settings.VK_APP_SECRET
        self.redirect_uri = settings.VK_REDIRECT_URI
        self.scopes = ["friends", "email"]
        self.token_url = "https://oauth.vk.com/access_token"
        self.api_url = "https://api.vk.com/method"
    
    def get_authorization_url(self, state: str = None) -> str:
        """Generate VK OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": ",".join(self.scopes),
            "response_type": "code",
            "v": "5.131"
        }
        if state:
            params["state"] = state
        
        return f"https://oauth.vk.com/authorize?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchange authorization code for VK access token."""
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": redirect_uri,
            "code": code
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.token_url, params=params)
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get VK user information."""
        params = {
            "access_token": access_token,
            "v": "5.131",
            "fields": "photo_100"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_url}/users.get", params=params)
            response.raise_for_status()
            data = response.json()
            
            if "response" in data and data["response"]:
                user = data["response"][0]
                return {
                    "id": user["id"],
                    "first_name": user.get("first_name"),
                    "last_name": user.get("last_name"),
                    "picture": user.get("photo_100")
                }
            
            return {}
    
    async def get_contacts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get VK friends."""
        params = {
            "access_token": access_token,
            "v": "5.131",
            "fields": "photo_100"
        }
        
        contacts = []
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_url}/friends.get", params=params)
            response.raise_for_status()
            data = response.json()
            
            if "response" in data and "items" in data["response"]:
                for friend in data["response"]["items"]:
                    contact = {
                        "first_name": friend.get("first_name"),
                        "last_name": friend.get("last_name"),
                        "vk_id": str(friend["id"]),
                        "avatar_url": friend.get("photo_100"),
                        "source_provider": "vk"
                    }
                    contacts.append(contact)
        
        return contacts


def get_oauth_service(provider: str) -> OAuthService:
    """Get OAuth service instance for provider."""
    services = {
        "google": GoogleOAuth,
        "linkedin": LinkedInOAuth,
        "facebook": FacebookOAuth,
        "vk": VKOAuth
    }
    
    if provider not in services:
        raise ValueError(f"Unsupported OAuth provider: {provider}")
    
    return services[provider]()