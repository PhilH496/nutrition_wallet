from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.supabase_client import supabase

router = APIRouter(prefix="/api/auth", tags=["auth"])

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    username: str

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
async def sign_up(data: SignUpRequest):
    # Validate inputs
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    if len(data.username) < 3 or len(data.username) > 20:
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters")
    
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password
        })
        
        # Check if user already exists
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="This email address already exists")
        
        # Create profile entry
        try:
            supabase.table('profiles').insert({
                "id": auth_response.user.id,
                "username": data.username
            }).execute()
        except Exception as profile_error:
            error_str = str(profile_error)
            if "duplicate key" in error_str or "profiles_username_key" in error_str:
                raise HTTPException(status_code=400, detail="This username is already taken")
            raise HTTPException(status_code=400, detail=f"Failed to create profile: {error_str}")
        
        return {"message": "User created successfully", "user": auth_response.user}
        
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e).lower()
        
        if "user already registered" in error_str or "already been registered" in error_str:
            raise HTTPException(status_code=400, detail="This email address already exists")
        elif "invalid email" in error_str:
            raise HTTPException(status_code=400, detail="Invalid email format")
        elif "password" in error_str and ("weak" in error_str or "short" in error_str):
            raise HTTPException(status_code=400, detail="Password is too weak")
        else:
            raise HTTPException(status_code=400, detail="Signup failed. Please try again")

@router.post("/signin")
async def sign_in(data: SignInRequest):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        return {
            "access_token": auth_response.session.access_token,
            "user": auth_response.user
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")