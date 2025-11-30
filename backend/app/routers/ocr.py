from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
from typing import Dict, Any
import time
import re
import io
from datetime import datetime
from ..config import settings
from ..supabase_client import get_current_user, security

router = APIRouter(prefix="/ocr", tags=["ocr"])

# Initialize Azure Computer Vision client with credentials
credentials = CognitiveServicesCredentials(settings.azure_vision_key)
vision_client = ComputerVisionClient(settings.azure_vision_endpoint, credentials)


def parse_nutrition_info(text: str) -> Dict[str, Any]:
    nutrition_data = {
        "food_name": None,
        "serving_size": None,
        "serving_unit": None,
        "calories": None,
        "protein": None,
        "carbs": None,
        "sugars": None
    }
    
    text_lower = text.lower()
    
    # Regex patterns for common nutrition label formats (FDA standard)
    patterns = {
        "calories": r"calories[:\s]+(\d+)",
        "protein": r"protein[:\s]+(\d+\.?\d*)g?",
        "carbs": r"total carbohydrate[s]?[:\s]+(\d+\.?\d*)g?",
        "sugars": r"(?:total )?sugars?[:\s]+(\d+\.?\d*)g?",
        "serving_size": r"serving size[:\s]+(\d+\.?\d*)",
        "serving_unit": r"serving size[:\s]+\d+\.?\d*\s*([a-z]+)"
    }
    
    # Extract values using regex and convert to appropriate types
    for key, pattern in patterns.items():
        match = re.search(pattern, text_lower)
        if match:
            try:
                if key in ["serving_size", "calories", "protein", "carbs", "sugars"]:
                    nutrition_data[key] = float(match.group(1))
                else:
                    nutrition_data[key] = match.group(1).strip()
            except:
                nutrition_data[key] = match.group(1).strip()
    
    return nutrition_data
async def log_user_nutrition(nutrition_fact_id: str, user, credentials, consumed_at=None):
    """Create log entry for this user + nutrition fact"""
    from ..supabase_client import supabase

    token = credentials.credentials
    supabase.postgrest.auth(token)

    if consumed_at is None:
        consumed_at = datetime.utcnow().isoformat()

    result = supabase.table("user_nutrition_log").insert({
        "user_id": user["id"],
        "nutrition_fact_id": nutrition_fact_id,
        "consumed_at": consumed_at,    # None → DB default NOW()
    }).execute()

    return {"success": True, "data": result.data}

@router.post("/scan-label")
async def scan_nutrition_label(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    """
    Upload a nutrition label image and extract nutrition information using Azure Computer Vision OCR.
    Returns: JSON response with extracted nutrition data and confidence level
    """
    try:
        # Read uploaded image data
        image_data = await file.read()
        image_stream = io.BytesIO(image_data)
        
        # Send image to Azure Computer Vision Read API for OCR processing
        read_response = vision_client.read_in_stream(
            image=image_stream,
            raw=True
        )
        
        # Extract operation ID from response headers for polling
        read_operation_location = read_response.headers["Operation-Location"]
        operation_id = read_operation_location.split("/")[-1]
        
        # Poll Azure API until OCR processing is complete (max 10 attempts)
        max_attempts = 10
        attempt = 0
        while attempt < max_attempts:
            read_result = vision_client.get_read_result(operation_id)
            if read_result.status not in [OperationStatusCodes.running, OperationStatusCodes.not_started]:
                break
            time.sleep(1)
            attempt += 1
        
        if attempt >= max_attempts:
            raise HTTPException(status_code=408, detail="OCR processing timeout")
        
        # Extract all text lines from OCR results
        extracted_text = ""
        if read_result.status == OperationStatusCodes.succeeded:
            for text_result in read_result.analyze_result.read_results:
                for line in text_result.lines:
                    extracted_text += line.text + "\n"
        else:
            raise HTTPException(status_code=500, detail="OCR processing failed")
        
        nutrition_info = parse_nutrition_info(extracted_text)
        
        # Calculate confidence level based on number of fields successfully extracted
        fields_found = sum(1 for k, v in nutrition_info.items() if v is not None and k not in ['food_name', 'serving_unit'])
        confidence = "high" if fields_found >= 4 else "medium" if fields_found >= 2 else "low"
        
        return {
            "success": True,
            "raw_text": extracted_text,
            "nutrition_data": nutrition_info,
            "confidence": confidence,
            "fields_found": fields_found
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@router.post("/save-food")
async def save_food_to_database(
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
        
        # Prepare food data with source marked as 'scan' (OCR scan) - Implement Manual and barcode later
        food_data = {
            "food_name": nutrition_data.get("food_name"),
            "serving_size": nutrition_data.get("serving_size"),
            "serving_unit": nutrition_data.get("serving_unit"),
            "calories": nutrition_data.get("calories"),
            "protein": nutrition_data.get("protein"),
            "carbs": nutrition_data.get("carbs"),
            "sugars": nutrition_data.get("sugars"),
            "source": "scan"
        }
        
        result = supabase.table("nutrition_facts").insert(food_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to insert nutrition_facts")

        nutrition_id = result.data[0]["nutrition_id"]

        log_result = await log_user_nutrition(
            nutrition_fact_id=nutrition_id,
            user=user,
            credentials=credentials,
            consumed_at=None
        )
        return {
            "success": True,
            "message": "Food saved successfully",
            "data": result.data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving to database: {str(e)}")