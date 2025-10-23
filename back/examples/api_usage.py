#!/usr/bin/env python3
"""
Naura Personal CRM API Usage Examples

This script demonstrates how to use the Naura API endpoints.
Run this after starting the API server: python run.py
"""

import requests
import json
from typing import Dict, Any

# API Base URL
BASE_URL = "http://localhost:8000/api/v1"

class NauraAPIClient:
    """Simple API client for demonstration."""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
    
    def register(self, email: str, password: str, first_name: str, last_name: str) -> Dict[str, Any]:
        """Register a new user."""
        data = {
            "email": email,
            "password": password,
            "first_name": first_name,
            "last_name": last_name
        }
        
        response = self.session.post(f"{self.base_url}/auth/register", json=data)
        response.raise_for_status()
        
        result = response.json()
        self.access_token = result["access_token"]
        self.session.headers.update({
            "Authorization": f"Bearer {self.access_token}"
        })
        
        return result
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login user."""
        data = {
            "email": email,
            "password": password
        }
        
        response = self.session.post(f"{self.base_url}/auth/login", json=data)
        response.raise_for_status()
        
        result = response.json()
        self.access_token = result["access_token"]
        self.session.headers.update({
            "Authorization": f"Bearer {self.access_token}"
        })
        
        return result
    
    def get_profile(self) -> Dict[str, Any]:
        """Get user profile."""
        response = self.session.get(f"{self.base_url}/users/me")
        response.raise_for_status()
        return response.json()
    
    def create_contact(self, contact_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new contact."""
        response = self.session.post(f"{self.base_url}/contacts", json=contact_data)
        response.raise_for_status()
        return response.json()
    
    def get_contacts(self, search: str = None, tags: str = None, limit: int = 50) -> Dict[str, Any]:
        """Get contacts list."""
        params = {"limit": limit}
        if search:
            params["search"] = search
        if tags:
            params["tags"] = tags
        
        response = self.session.get(f"{self.base_url}/contacts", params=params)
        response.raise_for_status()
        return response.json()
    
    def get_contact(self, contact_id: str) -> Dict[str, Any]:
        """Get contact details."""
        response = self.session.get(f"{self.base_url}/contacts/{contact_id}")
        response.raise_for_status()
        return response.json()
    
    def update_contact(self, contact_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update contact."""
        response = self.session.patch(f"{self.base_url}/contacts/{contact_id}", json=update_data)
        response.raise_for_status()
        return response.json()
    
    def get_connected_accounts(self) -> List[Dict[str, Any]]:
        """Get connected accounts."""
        response = self.session.get(f"{self.base_url}/accounts")
        response.raise_for_status()
        return response.json()
    
    def trigger_sync(self, account_id: str) -> Dict[str, Any]:
        """Trigger contact sync."""
        response = self.session.post(f"{self.base_url}/accounts/{account_id}/sync")
        response.raise_for_status()
        return response.json()


def demo_basic_workflow():
    """Demonstrate basic API workflow."""
    print("🚀 Naura Personal CRM API Demo")
    print("=" * 50)
    
    client = NauraAPIClient()
    
    # 1. Register user
    print("\n1. Registering new user...")
    try:
        result = client.register(
            email="demo@example.com",
            password="DemoPassword123!",
            first_name="Demo",
            last_name="User"
        )
        print(f"✅ User registered: {result['user']['email']}")
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 409:
            print("ℹ️  User already exists, logging in...")
            result = client.login("demo@example.com", "DemoPassword123!")
            print(f"✅ User logged in: {result['user']['email']}")
        else:
            raise
    
    # 2. Get profile
    print("\n2. Getting user profile...")
    profile = client.get_profile()
    print(f"✅ Profile: {profile['first_name']} {profile['last_name']} ({profile['email']})")
    
    # 3. Create some contacts
    print("\n3. Creating sample contacts...")
    contacts_data = [
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "company": "Tech Corp",
            "position": "Software Engineer",
            "tags": ["colleague", "tech"]
        },
        {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane@example.com",
            "company": "Design Studio",
            "position": "UX Designer",
            "tags": ["designer", "freelancer"],
            "private_notes": "Great designer, worked on mobile app project"
        },
        {
            "first_name": "Bob",
            "last_name": "Johnson",
            "email": "bob@startup.com",
            "company": "AI Startup",
            "position": "Founder",
            "tags": ["startup", "ai", "founder"]
        }
    ]
    
    created_contacts = []
    for contact_data in contacts_data:
        try:
            contact = client.create_contact(contact_data)
            created_contacts.append(contact)
            print(f"✅ Created contact: {contact['full_name']}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 409:
                print(f"ℹ️  Contact {contact_data['first_name']} {contact_data['last_name']} already exists")
            else:
                print(f"❌ Failed to create contact: {e}")
    
    # 4. Search contacts
    print("\n4. Searching contacts...")
    
    # Search by company
    result = client.get_contacts(search="Tech Corp")
    print(f"✅ Found {len(result['contacts'])} contacts at Tech Corp")
    
    # Search by tags
    result = client.get_contacts(tags="startup,founder")
    print(f"✅ Found {len(result['contacts'])} startup founders")
    
    # Get all contacts
    all_contacts = client.get_contacts()
    print(f"✅ Total contacts: {all_contacts['pagination']['total']}")
    
    # 5. Update a contact
    if created_contacts:
        print("\n5. Updating contact...")
        contact = created_contacts[0]
        updated = client.update_contact(contact['id'], {
            "tags": contact['tags'] + ["updated"],
            "private_notes": "Updated during API demo"
        })
        print(f"✅ Updated {updated['full_name']} with new tags: {updated['tags']}")
    
    # 6. Get connected accounts
    print("\n6. Checking connected accounts...")
    accounts = client.get_connected_accounts()
    print(f"✅ Connected accounts: {len(accounts)}")
    
    if accounts:
        for account in accounts:
            print(f"   - {account['provider']}: {account['sync_status']}")
    else:
        print("   No connected accounts. Connect OAuth accounts to sync contacts automatically.")
    
    print("\n🎉 Demo completed successfully!")
    print("\nNext steps:")
    print("- Visit http://localhost:8000/api/v1/docs for interactive API documentation")
    print("- Connect OAuth accounts to sync contacts from LinkedIn, Google, etc.")
    print("- Use the API to build your frontend application")


def demo_oauth_workflow():
    """Demonstrate OAuth workflow (requires actual OAuth setup)."""
    print("\n🔗 OAuth Integration Demo")
    print("=" * 30)
    print("To test OAuth integration:")
    print("1. Set up OAuth credentials in .env file")
    print("2. Use the authorization URLs from the OAuth services")
    print("3. Complete the OAuth flow in your frontend")
    print("4. Send the authorization code to: POST /api/v1/auth/oauth/{provider}")
    print("\nExample OAuth providers:")
    print("- Google: /api/v1/auth/oauth/google")
    print("- LinkedIn: /api/v1/auth/oauth/linkedin")
    print("- Facebook: /api/v1/auth/oauth/facebook")
    print("- VK: /api/v1/auth/oauth/vk")


if __name__ == "__main__":
    try:
        # Check if API is running
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health")
        response.raise_for_status()
        print("✅ API server is running")
        
        # Run demos
        demo_basic_workflow()
        demo_oauth_workflow()
        
    except requests.exceptions.ConnectionError:
        print("❌ API server is not running!")
        print("Please start the server first:")
        print("   python run.py")
        print("Or:")
        print("   ./scripts/start_dev.sh")
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()