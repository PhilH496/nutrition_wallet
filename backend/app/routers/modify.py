from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from typing import Dict, Any, List
import time
import re
import io
from datetime import datetime
from ..config import settings
from ..supabase_client import get_current_user, security

router = APIRouter(prefix="/modify", tags=["modify"])

@router.post('/edit-food')
async def edit_nutrition_log(
    nutrition_data: Dict[str, Any],
    user = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Save parsed nutrition data to Supabase database
    """
    try:
        from ..supabase_client import supabase
        # Extract JWT token for Supabase authentication
        token = credentials.credentials
        
        # Set user context for Supabase query (required for RLS policies)
        supabase.postgrest.auth(token)
        
        food_data = {
            "food_name": nutrition_data.get("food_name"),
            "serving_size": nutrition_data.get("serving_size"),
            "serving_unit": nutrition_data.get("serving_unit"),
            "calories": nutrition_data.get("calories"),
            "protein": nutrition_data.get("protein"),
            "carbs": nutrition_data.get("carbs"),
            "sugars": nutrition_data.get("sugars"),
            "source": nutrition_data.get("source")
        }

        print
        
        result = supabase.table("nutrition_facts").update(food_data).eq("nutrition_id", nutrition_data.get("nutrition_id")).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to edit nutrition_fact")

        return {
            "success": True,
            "message": "Food edited successfully",
            "data": result.data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving to database: {str(e)}")
    
@router.post('/delete-log')
async def delete_nutrition_log(
    log_ids: List[str],
    user = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Save parsed nutrition data to Supabase database
    """
    try:
        print(log_ids)
        from ..supabase_client import supabase
        # Extract JWT token for Supabase authentication
        token = credentials.credentials
        
        # Set user context for Supabase query (required for RLS policies)
        supabase.postgrest.auth(token)

        result = supabase.table("user_nutrition_log").delete().eq("user_id", user["id"]).in_("log_id", log_ids).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to delete nutrition_log")

        return {
            "success": True,
            "message": "Log deleted successfully",
            "data": result.data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting from database: {str(e)}")

