"""
AI-Suite Auth Service

Complete authentication and authorization service.
Supports JWT, OAuth2, SSO, MFA, and role-based access control.
"""

from fastapi import FastAPI, HTTPException, Depends, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID, uuid4
from enum import Enum
import jwt
import bcrypt
import structlog
import uvicorn
import secrets

logger = structlog.get_logger(__name__)

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


# ============================================
# ENUMS
# ============================================

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    GUEST = "guest"


class AuthProvider(str, Enum):
    LOCAL = "local"
    GOOGLE = "google"
    MICROSOFT = "microsoft"
    GITHUB = "github"
    APPLE = "apple"


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"
    RESET_PASSWORD = "reset_password"
    EMAIL_VERIFICATION = "email_verification"
    MFA = "mfa"


# ============================================
# MODELS
# ============================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: UserRole = UserRole.USER


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    provider: AuthProvider
    avatar_url: Optional[str]
    created_at: datetime
    last_login: Optional[datetime]


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class TokenRefresh(BaseModel):
    refresh_token: str


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class MFASetup(BaseModel):
    method: str = "totp"  # totp, sms, email


class MFAVerify(BaseModel):
    code: str


class OAuthCallback(BaseModel):
    code: str
    state: str
    provider: AuthProvider


class Session(BaseModel):
    id: UUID
    user_id: UUID
    token_hash: str
    device_info: Dict[str, Any]
    ip_address: str
    created_at: datetime
    expires_at: datetime
    is_active: bool


class Permission(BaseModel):
    id: str
    name: str
    description: str
    resource: str
    actions: List[str]


class RolePermissions(BaseModel):
    role: UserRole
    permissions: List[str]


# ============================================
# IN-MEMORY STORAGE (Replace with database)
# ============================================

users_db: Dict[UUID, Dict] = {}
sessions_db: Dict[UUID, Dict] = {}
refresh_tokens_db: Dict[str, Dict] = {}
password_reset_tokens: Dict[str, Dict] = {}
mfa_secrets: Dict[UUID, str] = {}

# Default permissions per role
ROLE_PERMISSIONS = {
    UserRole.ADMIN: ["*"],
    UserRole.MANAGER: [
        "docs:*", "sheets:*", "slides:*", "mail:*",
        "calendar:*", "drive:*", "collab:*", "notes:*",
        "forms:*", "tasks:*", "analytics:read", "users:read"
    ],
    UserRole.USER: [
        "docs:read", "docs:write", "docs:delete:own",
        "sheets:read", "sheets:write", "sheets:delete:own",
        "slides:read", "slides:write", "slides:delete:own",
        "mail:*", "calendar:*", "drive:*", "collab:*",
        "notes:*", "forms:*", "tasks:*"
    ],
    UserRole.GUEST: [
        "docs:read", "sheets:read", "slides:read"
    ]
}


# ============================================
# HELPER FUNCTIONS
# ============================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_token(
    data: Dict[str, Any],
    token_type: TokenType,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT token."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": token_type.value,
        "jti": str(uuid4())
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email."""
    for user in users_db.values():
        if user["email"] == email:
            return user
    return None


def get_user_by_id(user_id: UUID) -> Optional[Dict]:
    """Get user by ID."""
    return users_db.get(user_id)


# ============================================
# OAUTH2 SETUP
# ============================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    """Get current authenticated user from token."""
    payload = decode_token(token)

    if payload.get("type") != TokenType.ACCESS.value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    user_id = UUID(payload.get("sub"))
    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is inactive"
        )

    return user


async def get_current_active_user(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """Ensure user is active."""
    if not current_user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_permissions(required: List[str]):
    """Dependency to check user permissions."""
    async def permission_checker(
        current_user: Dict = Depends(get_current_active_user)
    ) -> Dict:
        user_role = UserRole(current_user["role"])
        user_permissions = ROLE_PERMISSIONS.get(user_role, [])

        # Admin has all permissions
        if "*" in user_permissions:
            return current_user

        # Check each required permission
        for perm in required:
            if perm not in user_permissions:
                # Check for wildcard permissions
                resource = perm.split(":")[0]
                if f"{resource}:*" not in user_permissions:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Permission denied: {perm}"
                    )

        return current_user

    return permission_checker


# ============================================
# APPLICATION
# ============================================

app = FastAPI(
    title="AI-Suite Auth Service",
    description="Authentication and authorization service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# ENDPOINTS
# ============================================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "auth"}


# ========== REGISTRATION ==========

@app.post("/api/v1/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user."""
    # Check if email exists
    if get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user_id = uuid4()
    now = datetime.utcnow()

    user = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "role": user_data.role.value,
        "is_active": True,
        "is_verified": False,
        "provider": AuthProvider.LOCAL.value,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now,
        "last_login": None,
        "mfa_enabled": False,
    }

    users_db[user_id] = user
    logger.info("User registered", user_id=str(user_id), email=user_data.email)

    # TODO: Send verification email

    return UserResponse(**{
        **user,
        "role": UserRole(user["role"]),
        "provider": AuthProvider(user["provider"])
    })


# ========== LOGIN ==========

@app.post("/api/v1/auth/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with email and password."""
    user = get_user_by_email(form_data.username)

    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled"
        )

    # Check MFA if enabled
    if user.get("mfa_enabled"):
        # Return partial token for MFA verification
        mfa_token = create_token(
            {"sub": str(user["id"]), "mfa_pending": True},
            TokenType.MFA,
            timedelta(minutes=5)
        )
        return {
            "access_token": mfa_token,
            "refresh_token": "",
            "token_type": "mfa_required",
            "expires_in": 300,
            "user": None
        }

    # Create tokens
    access_token = create_token(
        {"sub": str(user["id"]), "role": user["role"]},
        TokenType.ACCESS,
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    refresh_token = create_token(
        {"sub": str(user["id"])},
        TokenType.REFRESH,
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    # Store refresh token
    refresh_tokens_db[refresh_token] = {
        "user_id": user["id"],
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    }

    # Update last login
    user["last_login"] = datetime.utcnow()

    logger.info("User logged in", user_id=str(user["id"]))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(**{
            **user,
            "role": UserRole(user["role"]),
            "provider": AuthProvider(user["provider"])
        })
    )


# ========== TOKEN REFRESH ==========

@app.post("/api/v1/auth/refresh", response_model=TokenResponse)
async def refresh_token(data: TokenRefresh):
    """Refresh access token using refresh token."""
    payload = decode_token(data.refresh_token)

    if payload.get("type") != TokenType.REFRESH.value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    # Check if refresh token is valid
    if data.refresh_token not in refresh_tokens_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found or revoked"
        )

    user_id = UUID(payload.get("sub"))
    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Create new access token
    access_token = create_token(
        {"sub": str(user["id"]), "role": user["role"]},
        TokenType.ACCESS,
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Optionally rotate refresh token
    new_refresh_token = create_token(
        {"sub": str(user["id"])},
        TokenType.REFRESH,
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    # Remove old, add new refresh token
    del refresh_tokens_db[data.refresh_token]
    refresh_tokens_db[new_refresh_token] = {
        "user_id": user["id"],
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    }

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(**{
            **user,
            "role": UserRole(user["role"]),
            "provider": AuthProvider(user["provider"])
        })
    )


# ========== LOGOUT ==========

@app.post("/api/v1/auth/logout")
async def logout(
    current_user: Dict = Depends(get_current_user),
    refresh_token: Optional[str] = None
):
    """Logout user and invalidate tokens."""
    # Remove refresh token if provided
    if refresh_token and refresh_token in refresh_tokens_db:
        del refresh_tokens_db[refresh_token]

    logger.info("User logged out", user_id=str(current_user["id"]))

    return {"status": "logged_out"}


# ========== PASSWORD RESET ==========

@app.post("/api/v1/auth/password/reset")
async def request_password_reset(data: PasswordReset):
    """Request password reset email."""
    user = get_user_by_email(data.email)

    # Always return success to prevent email enumeration
    if not user:
        return {"status": "reset_email_sent"}

    # Create reset token
    reset_token = secrets.token_urlsafe(32)
    password_reset_tokens[reset_token] = {
        "user_id": user["id"],
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }

    # TODO: Send reset email
    logger.info("Password reset requested", user_id=str(user["id"]))

    return {"status": "reset_email_sent", "token": reset_token}  # Remove token in production


@app.post("/api/v1/auth/password/reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm):
    """Confirm password reset with token."""
    token_data = password_reset_tokens.get(data.token)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    if datetime.utcnow() > token_data["expires_at"]:
        del password_reset_tokens[data.token]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )

    user = get_user_by_id(token_data["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )

    # Update password
    user["password_hash"] = hash_password(data.new_password)
    user["updated_at"] = datetime.utcnow()

    # Remove used token
    del password_reset_tokens[data.token]

    # Invalidate all refresh tokens for this user
    tokens_to_remove = [
        token for token, data in refresh_tokens_db.items()
        if data["user_id"] == user["id"]
    ]
    for token in tokens_to_remove:
        del refresh_tokens_db[token]

    logger.info("Password reset completed", user_id=str(user["id"]))

    return {"status": "password_reset_complete"}


@app.post("/api/v1/auth/password/change")
async def change_password(
    data: PasswordChange,
    current_user: Dict = Depends(get_current_active_user)
):
    """Change password for authenticated user."""
    if not verify_password(data.current_password, current_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user["password_hash"] = hash_password(data.new_password)
    current_user["updated_at"] = datetime.utcnow()

    logger.info("Password changed", user_id=str(current_user["id"]))

    return {"status": "password_changed"}


# ========== USER PROFILE ==========

@app.get("/api/v1/auth/me", response_model=UserResponse)
async def get_me(current_user: Dict = Depends(get_current_active_user)):
    """Get current user profile."""
    return UserResponse(**{
        **current_user,
        "role": UserRole(current_user["role"]),
        "provider": AuthProvider(current_user["provider"])
    })


@app.put("/api/v1/auth/me")
async def update_me(
    full_name: Optional[str] = None,
    avatar_url: Optional[str] = None,
    current_user: Dict = Depends(get_current_active_user)
):
    """Update current user profile."""
    if full_name:
        current_user["full_name"] = full_name
    if avatar_url:
        current_user["avatar_url"] = avatar_url

    current_user["updated_at"] = datetime.utcnow()

    return UserResponse(**{
        **current_user,
        "role": UserRole(current_user["role"]),
        "provider": AuthProvider(current_user["provider"])
    })


# ========== MFA ==========

@app.post("/api/v1/auth/mfa/setup")
async def setup_mfa(
    data: MFASetup,
    current_user: Dict = Depends(get_current_active_user)
):
    """Setup MFA for user."""
    import pyotp

    # Generate secret
    secret = pyotp.random_base32()
    mfa_secrets[current_user["id"]] = secret

    # Generate provisioning URI for authenticator apps
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user["email"],
        issuer_name="AI-Suite"
    )

    return {
        "secret": secret,
        "provisioning_uri": provisioning_uri,
        "method": data.method
    }


@app.post("/api/v1/auth/mfa/verify")
async def verify_mfa(
    data: MFAVerify,
    current_user: Dict = Depends(get_current_active_user)
):
    """Verify MFA code and enable MFA."""
    import pyotp

    secret = mfa_secrets.get(current_user["id"])
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not setup"
        )

    totp = pyotp.TOTP(secret)
    if not totp.verify(data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA code"
        )

    current_user["mfa_enabled"] = True
    current_user["updated_at"] = datetime.utcnow()

    return {"status": "mfa_enabled"}


@app.post("/api/v1/auth/mfa/disable")
async def disable_mfa(
    data: MFAVerify,
    current_user: Dict = Depends(get_current_active_user)
):
    """Disable MFA for user."""
    import pyotp

    secret = mfa_secrets.get(current_user["id"])
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA not enabled"
        )

    totp = pyotp.TOTP(secret)
    if not totp.verify(data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA code"
        )

    current_user["mfa_enabled"] = False
    del mfa_secrets[current_user["id"]]

    return {"status": "mfa_disabled"}


# ========== OAUTH ==========

@app.get("/api/v1/auth/oauth/{provider}")
async def oauth_redirect(provider: AuthProvider):
    """Get OAuth redirect URL for provider."""
    # OAuth configuration would come from environment
    oauth_configs = {
        AuthProvider.GOOGLE: {
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "client_id": "your-google-client-id",
            "scope": "openid email profile",
        },
        AuthProvider.MICROSOFT: {
            "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            "client_id": "your-microsoft-client-id",
            "scope": "openid email profile",
        },
        AuthProvider.GITHUB: {
            "auth_url": "https://github.com/login/oauth/authorize",
            "client_id": "your-github-client-id",
            "scope": "user:email",
        },
    }

    config = oauth_configs.get(provider)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider {provider} not supported"
        )

    state = secrets.token_urlsafe(32)
    redirect_uri = f"http://localhost:8000/api/v1/auth/oauth/{provider.value}/callback"

    auth_url = (
        f"{config['auth_url']}?"
        f"client_id={config['client_id']}&"
        f"redirect_uri={redirect_uri}&"
        f"scope={config['scope']}&"
        f"response_type=code&"
        f"state={state}"
    )

    return {"auth_url": auth_url, "state": state}


@app.post("/api/v1/auth/oauth/{provider}/callback")
async def oauth_callback(provider: AuthProvider, data: OAuthCallback):
    """Handle OAuth callback."""
    # In production, exchange code for tokens and get user info
    # This is a simplified example

    # Create or get user
    user_id = uuid4()
    now = datetime.utcnow()

    user = {
        "id": user_id,
        "email": f"oauth-user-{user_id}@example.com",
        "password_hash": None,
        "full_name": "OAuth User",
        "role": UserRole.USER.value,
        "is_active": True,
        "is_verified": True,
        "provider": provider.value,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now,
        "last_login": now,
        "mfa_enabled": False,
    }

    users_db[user_id] = user

    # Create tokens
    access_token = create_token(
        {"sub": str(user["id"]), "role": user["role"]},
        TokenType.ACCESS,
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    refresh_token = create_token(
        {"sub": str(user["id"])},
        TokenType.REFRESH,
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(**{
            **user,
            "role": UserRole(user["role"]),
            "provider": AuthProvider(user["provider"])
        })
    )


# ========== SESSIONS ==========

@app.get("/api/v1/auth/sessions")
async def get_sessions(current_user: Dict = Depends(get_current_active_user)):
    """Get all active sessions for user."""
    user_sessions = [
        session for session in sessions_db.values()
        if session["user_id"] == current_user["id"] and session["is_active"]
    ]
    return {"sessions": user_sessions}


@app.delete("/api/v1/auth/sessions/{session_id}")
async def revoke_session(
    session_id: UUID,
    current_user: Dict = Depends(get_current_active_user)
):
    """Revoke a specific session."""
    session = sessions_db.get(session_id)

    if not session or session["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    session["is_active"] = False

    return {"status": "session_revoked"}


@app.delete("/api/v1/auth/sessions")
async def revoke_all_sessions(current_user: Dict = Depends(get_current_active_user)):
    """Revoke all sessions for user."""
    for session in sessions_db.values():
        if session["user_id"] == current_user["id"]:
            session["is_active"] = False

    # Also revoke all refresh tokens
    tokens_to_remove = [
        token for token, data in refresh_tokens_db.items()
        if data["user_id"] == current_user["id"]
    ]
    for token in tokens_to_remove:
        del refresh_tokens_db[token]

    return {"status": "all_sessions_revoked"}


# ========== ADMIN ==========

@app.get("/api/v1/auth/users")
async def list_users(
    current_user: Dict = Depends(require_permissions(["users:read"]))
):
    """List all users (admin only)."""
    return {
        "users": [
            UserResponse(**{
                **user,
                "role": UserRole(user["role"]),
                "provider": AuthProvider(user["provider"])
            })
            for user in users_db.values()
        ]
    }


@app.put("/api/v1/auth/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    role: UserRole,
    current_user: Dict = Depends(require_permissions(["users:write"]))
):
    """Update user role (admin only)."""
    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user["role"] = role.value
    user["updated_at"] = datetime.utcnow()

    return {"status": "role_updated"}


@app.put("/api/v1/auth/users/{user_id}/status")
async def update_user_status(
    user_id: UUID,
    is_active: bool,
    current_user: Dict = Depends(require_permissions(["users:write"]))
):
    """Enable/disable user (admin only)."""
    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user["is_active"] = is_active
    user["updated_at"] = datetime.utcnow()

    if not is_active:
        # Revoke all sessions
        for session in sessions_db.values():
            if session["user_id"] == user_id:
                session["is_active"] = False

    return {"status": "status_updated"}


# ========== PERMISSIONS ==========

@app.get("/api/v1/auth/permissions")
async def get_permissions(current_user: Dict = Depends(get_current_active_user)):
    """Get current user's permissions."""
    user_role = UserRole(current_user["role"])
    permissions = ROLE_PERMISSIONS.get(user_role, [])

    return {
        "role": user_role,
        "permissions": permissions
    }


@app.get("/api/v1/auth/permissions/check")
async def check_permission(
    permission: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """Check if user has a specific permission."""
    user_role = UserRole(current_user["role"])
    user_permissions = ROLE_PERMISSIONS.get(user_role, [])

    has_permission = (
        "*" in user_permissions or
        permission in user_permissions or
        f"{permission.split(':')[0]}:*" in user_permissions
    )

    return {"permission": permission, "granted": has_permission}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8018,
        reload=True
    )
