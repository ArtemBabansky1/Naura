from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, contacts, accounts

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["Contacts"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Connected Accounts"])