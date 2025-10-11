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

# Initialize Azure Computer Vision client
credentials = CognitiveServicesCredentials(settings.azure_vision_key)
vision_client = ComputerVisionClient(settings.azure_vision_endpoint, credentials)


def parse_nutrition_info(text: str) -> Dict[str, Any]:
    """
    Parse extracted text to find nutrition information
    """
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
    
    # Convert to lowercase for easier matching
    text_lower = text.lower()
    
    # Regex patterns for common nutrition label formats
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
    
    # Extract values using regex
    for key, pattern in patterns.items():
        match = re.search(pattern, text_lower)
        if match:
            try:
                # Try to convert to float for numeric values
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
    Upload a nutrition label image and extract nutrition information using Azure Computer Vision
    """
    try:
        # Read the image file
        image_data = await file.read()
        image_stream = io.BytesIO(image_data)
        
        # Call Azure Computer Vision Read API (OCR)
        read_response = vision_client.read_in_stream(
            image=image_stream,
            raw=True
        )
        
        # Get the operation location (URL with operation ID)
        read_operation_location = read_response.headers["Operation-Location"]
        operation_id = read_operation_location.split("/")[-1]
        
        # Wait for the operation to complete (polling)
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
        
        # Extract text from the result
        extracted_text = ""
        if read_result.status == OperationStatusCodes.succeeded:
            for text_result in read_result.analyze_result.read_results:
                for line in text_result.lines:
                    extracted_text += line.text + "\n"
        else:
            raise HTTPException(status_code=500, detail="OCR processing failed")
        
        # Parse nutrition information from extracted text
        nutrition_info = parse_nutrition_info(extracted_text)
        
        # Determine confidence based on how many fields were extracted
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
        
        # Get the user's JWT token
        token = credentials.credentials
        
        # Set the user context for this request
        supabase.postgrest.auth(token)
        
        print("=" * 50)
        print(f"DEBUG: User ID: {user['id']}")
        print(f"DEBUG: Nutrition data: {nutrition_data}")
        
        # Add user_id to the data
        food_data = {
            "user_id": user["id"],
            **nutrition_data
        }
        
        print(f"DEBUG: Food data to insert: {food_data}")
        
        # Insert into Supabase with user context
        result = supabase.table("foods").insert(food_data).execute()
        
        print(f"DEBUG: Insert successful!")
        print("=" * 50)
        
        return {
            "success": True,
            "message": "Food saved successfully",
            "data": result.data
        }
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error saving to database: {str(e)}")