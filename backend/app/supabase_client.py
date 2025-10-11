from supabase import create_client, Client
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

# Security scheme for JWT token
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token and return current user
    """
    try:
        token = credentials.credentials
        
        # Verify the token with Supabase
        user = supabase.auth.get_user(token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        return user.user
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {str(e)}")