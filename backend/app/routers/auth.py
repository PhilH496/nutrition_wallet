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
async def signup(data: SignUpRequest):
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password
        })
        
        if auth_response.user:
            # Create profile entry
            supabase.table('profiles').insert({
                "id": auth_response.user.id,
                "username": data.username
            }).execute()
            
            return {"message": "User created successfully", "user": auth_response.user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/signin")
async def signin(data: SignInRequest):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })
        return {
            "access_token": auth_response.session.access_token,
            "user": auth_response.user
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")