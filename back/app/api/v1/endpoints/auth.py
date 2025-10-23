from datetime import datetime, timezone, timedelta
from typing import Any
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
    generate_reset_token,
    hash_reset_token
)
from app.core.deps import security
from app.models.user import User
from app.models.password_reset_token import PasswordResetToken
from app.schemas.user import (
    UserRegister,
    UserLogin,
    Token,
    TokenResponse,
    TokenRefresh,
    PasswordReset,
    PasswordResetConfirm,
    UserResponse
)
from app.services.oauth import get_oauth_service
from app.models.connected_account import ConnectedAccount
from app.tasks.email import send_password_reset_email, send_welcome_email

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
) -> Any:
    """Register a new user with email and password."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone_number=user_data.phone_number,
        password_hash=get_password_hash(user_data.password),
        timezone=user_data.timezone,
        language=user_data.language,
        last_login_at=datetime.now(timezone.utc)
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send welcome email
    send_welcome_email.delay(user.email, user.first_name or "")
    
    # Create tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.from_orm(user)
    )


@router.post("/login", response_model=Token)
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
) -> Any:
    """Login user with email and password."""
    
    # Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    # Verify password
    if not user.password_hash or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    
    # Create tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.from_orm(user)
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db)
) -> Any:
    """Refresh access token using refresh token."""
    
    # Verify refresh token
    user_id = verify_token(token_data.refresh_token, token_type="refresh")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check if user exists and is active
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    access_token = create_access_token(subject=str(user.id))
    
    return TokenResponse(access_token=access_token)


@router.post("/logout")
def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Any:
    """Logout user (token blacklisting would be implemented here in production)."""
    
    # In a production environment, you would:
    # 1. Add the token to a blacklist in Redis
    # 2. Set expiration time equal to token's remaining time
    
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
def forgot_password(
    password_data: PasswordReset,
    db: Session = Depends(get_db)
) -> Any:
    """Request password reset email."""
    
    # Find user by email
    user = db.query(User).filter(User.email == password_data.email).first()
    if not user:
        # Don't reveal whether email exists for security
        return {"message": "Password reset email sent"}
    
    # Generate reset token
    reset_token = generate_reset_token()
    token_hash = hash_reset_token(reset_token)
    
    # Create password reset token
    db_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    
    db.add(db_token)
    db.commit()
    
    # Send reset email with token
    send_password_reset_email.delay(user.email, reset_token, user.first_name)
    
    return {"message": "Password reset email sent"}


@router.post("/reset-password")
def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
) -> Any:
    """Reset password with token."""
    
    # Hash the provided token
    token_hash = hash_reset_token(reset_data.token)
    
    # Find valid token
    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at == None,
        PasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Get user
    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.password_hash = get_password_hash(reset_data.new_password)
    
    # Mark token as used
    db_token.used_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"message": "Password successfully reset"}


@router.post("/oauth/{provider}", response_model=Token)
async def oauth_login(
    provider: str,
    oauth_data: dict,
    db: Session = Depends(get_db)
) -> Any:
    """OAuth login/registration."""
    
    # Validate provider
    valid_providers = ["google", "linkedin", "facebook", "vk"]
    if provider not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider. Must be one of: {', '.join(valid_providers)}"
        )
    
    try:
        # Get OAuth service
        oauth_service = get_oauth_service(provider)
        
        # Exchange code for token
        token_data = await oauth_service.exchange_code_for_token(
            oauth_data["authorization_code"],
            oauth_data["redirect_uri"]
        )
        
        # Get user info from provider
        user_info = await oauth_service.get_user_info(token_data["access_token"])
        
        # Find or create user
        provider_id = str(user_info.get("id"))
        provider_email = user_info.get("email")
        
        # Look for existing user by OAuth provider
        user = db.query(User).filter(
            User.oauth_provider == provider,
            User.oauth_provider_id == provider_id
        ).first()
        
        # If not found, look by email
        if not user and provider_email:
            user = db.query(User).filter(User.email == provider_email).first()
            if user:
                # Link OAuth account to existing user
                user.oauth_provider = provider
                user.oauth_provider_id = provider_id
        
        # Create new user if not found
        if not user:
            if not provider_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email address required for registration"
                )
            
            user = User(
                email=provider_email,
                first_name=user_info.get("first_name") or user_info.get("given_name"),
                last_name=user_info.get("last_name") or user_info.get("family_name"),
                avatar_url=user_info.get("picture") or user_info.get("avatar_url"),
                oauth_provider=provider,
                oauth_provider_id=provider_id,
                last_login_at=datetime.now(timezone.utc)
            )
            
            db.add(user)
            db.flush()  # Get user ID
            
            # Send welcome email for new users
            send_welcome_email.delay(user.email, user.first_name or "")
        else:
            # Update last login for existing user
            user.last_login_at = datetime.now(timezone.utc)
        
        # Create or update connected account
        connected_account = db.query(ConnectedAccount).filter(
            ConnectedAccount.user_id == user.id,
            ConnectedAccount.provider == provider
        ).first()
        
        if connected_account:
            # Update existing account
            connected_account.access_token = token_data["access_token"]
            connected_account.refresh_token = token_data.get("refresh_token")
            if "expires_in" in token_data:
                connected_account.token_expires_at = datetime.now(timezone.utc) + \
                    timedelta(seconds=token_data["expires_in"])
            connected_account.is_active = True
        else:
            # Create new connected account
            connected_account = ConnectedAccount(
                user_id=user.id,
                provider=provider,
                provider_user_id=provider_id,
                provider_email=provider_email,
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                token_expires_at=datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600)),
                scopes=oauth_service.scopes
            )
            db.add(connected_account)
        
        db.commit()
        db.refresh(user)
        
        # Create JWT tokens
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth login failed for provider {provider}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth authentication failed"
        )