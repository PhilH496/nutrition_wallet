from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from ..supabase_client import supabase, get_current_user, security

router = APIRouter(prefix="/foods", tags=["foods"])


from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from typing import List, Dict, Any
from ..supabase_client import supabase, get_current_user, security

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("/")
async def get_user_foods(
    user = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get all foods for the current user
    """
    try:
        token = credentials.credentials
        supabase.postgrest.auth(token)
        
        result = supabase.table("foods").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute()
        
        return {
            "success": True,
            "data": result.data,
            "count": len(result.data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching foods: {str(e)}")


@router.delete("/{food_id}")
async def delete_food(
    food_id: str, 
    user = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Delete a specific food
    """
    try:
        token = credentials.credentials
        supabase.postgrest.auth(token)
        
        result = supabase.table("foods").delete().eq("id", food_id).eq("user_id", user["id"]).execute()
        
        return {
            "success": True,
            "message": "Food deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting food: {str(e)}")


@router.delete("/{food_id}")
async def delete_food(food_id: str, user = Depends(get_current_user)):
    """
    Delete a specific food
    """
    try:
        result = supabase.table("foods").delete().eq("id", food_id).eq("user_id", user["id"]).execute()
        
        return {
            "success": True,
            "message": "Food deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting food: {str(e)}")