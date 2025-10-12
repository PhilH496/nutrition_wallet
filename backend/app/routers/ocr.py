from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
from typing import Dict, Any
import time
import re
import io
from ..config import settings
from ..supabase_client import get_current_user, security

router = APIRouter(prefix="/ocr", tags=["ocr"])

# Initialize Azure Computer Vision client with credentials
credentials = CognitiveServicesCredentials(settings.azure_vision_key)
vision_client = ComputerVisionClient(settings.azure_vision_endpoint, credentials)


def parse_nutrition_info(text: str) -> Dict[str, Any]:
    nutrition_data = {
        "name": None,
        "serving_size": None,
        "calories": None,
        "total_fat": None,
        "saturated_fat": None,
        "trans_fat": None,
        "cholesterol": None,
        "sodium": None,
        "total_carbs": None,
        "fiber": None,
        "sugar": None,
        "protein": None
    }
    
    text_lower = text.lower()
    
    # Regex patterns for common nutrition label formats (FDA standard)
    patterns = {
        "calories": r"calories[:\s]+(\d+)",
        "total_fat": r"total fat[:\s]+(\d+\.?\d*)g?",
        "saturated_fat": r"saturated fat[:\s]+(\d+\.?\d*)g?",
        "trans_fat": r"trans fat[:\s]+(\d+\.?\d*)g?",
        "cholesterol": r"cholesterol[:\s]+(\d+\.?\d*)mg?",
        "sodium": r"sodium[:\s]+(\d+\.?\d*)mg?",
        "total_carbs": r"total carbohydrate[s]?[:\s]+(\d+\.?\d*)g?",
        "fiber": r"dietary fiber[:\s]+(\d+\.?\d*)g?",
        "sugar": r"(?:total )?sugars?[:\s]+(\d+\.?\d*)g?",
        "protein": r"protein[:\s]+(\d+\.?\d*)g?",
        "serving_size": r"serving size[:\s]+([^\n]+)"
    }
    
    # Extract values using regex and convert to appropriate types
    for key, pattern in patterns.items():
        match = re.search(pattern, text_lower)
        if match:
            try:
                if key != "serving_size" and key != "name":
                    nutrition_data[key] = float(match.group(1))
                else:
                    nutrition_data[key] = match.group(1).strip()
            except:
                nutrition_data[key] = match.group(1).strip()
    
    return nutrition_data


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
        
        # Parse extracted text to identify nutrition values
        nutrition_info = parse_nutrition_info(extracted_text)
        
        # Calculate confidence level based on number of fields successfully extracted
        fields_found = sum(1 for v in nutrition_info.values() if v is not None)
        confidence = "high" if fields_found >= 5 else "medium" if fields_found >= 3 else "low"
        
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
        
        food_data = {
            "user_id": user["id"],
            **nutrition_data
        }
        
        result = supabase.table("foods").insert(food_data).execute()
        
        return {
            "success": True,
            "message": "Food saved successfully",
            "data": result.data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving to database: {str(e)}")