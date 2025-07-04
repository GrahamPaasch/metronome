from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import cv2
import numpy as np
from PIL import Image
import io
import tempfile
import json
import fitz  # PyMuPDF
from pdf2image import convert_from_bytes
from music21 import stream, pitch, key, roman, harmony, interval, chord
from omr_processor import OMRProcessor
from harmonic_analyzer import HarmonicAnalyzer

app = FastAPI(title="Musical Practice Companion Backend", version="1.0.0")

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://localhost:5180",
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",
        "http://127.0.0.1:5178",
        "http://127.0.0.1:5179",
        "http://127.0.0.1:5180"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors
omr_processor = OMRProcessor()
harmonic_analyzer = HarmonicAnalyzer()

async def convert_pdf_to_images(pdf_content: bytes) -> List[Image.Image]:
    """
    Convert PDF content to a list of PIL Images.
    Uses PyMuPDF for conversion.
    """
    try:
        # Create a PyMuPDF document from bytes
        pdf_document = fitz.open("pdf", pdf_content)
        images = []
        
        # Convert each page to an image
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            
            # Get page as a pixmap (image)
            mat = fitz.Matrix(2.0, 2.0)  # Scale factor for better quality
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image
            img_data = pix.tobytes("ppm")
            img = Image.open(io.BytesIO(img_data))
            images.append(img)
            
        pdf_document.close()
        return images
        
    except Exception as e:
        print(f"PyMuPDF conversion failed: {e}")
        # Fallback to pdf2image
        try:
            images = convert_from_bytes(pdf_content, dpi=300)
            return images
        except Exception as e2:
            print(f"pdf2image conversion also failed: {e2}")
            raise HTTPException(status_code=400, detail=f"Could not extract images from PDF: {str(e2)}")
        
class AnalysisResult(BaseModel):
    """Analysis result from sheet music processing"""
    key_signature: str
    time_signature: str
    tempo_bpm: Optional[int] = None
    measures: List[Dict[str, Any]]
    chord_progression: List[str]
    confidence_score: float
    analysis_notes: List[str]
    harmonic_analysis: Dict[str, Any]

class ConfigSuggestion(BaseModel):
    """Configuration suggestions for the metronome"""
    tempo_bpm: int
    time_signature: str
    key: str
    chord_progression: List[str]
    accompaniment_style: str
        
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Musical Practice Companion Backend API", "status": "running"}

@app.post("/transcribe-sheet-music", response_model=AnalysisResult)
async def transcribe_sheet_music(file: UploadFile = File(...)):
    """
    Transcribe uploaded sheet music (PDF or image) to extract notes and musical elements.
    This endpoint focuses on note transcription and playback rather than harmonic analysis.
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Allowed types: {allowed_types}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Process based on file type
        if file.content_type == "application/pdf":
            # Handle PDF conversion to images
            images = await convert_pdf_to_images(file_content)
            # For now, analyze first page only
            if images:
                processed_data = await omr_processor.process_image(images[0])
            else:
                raise HTTPException(status_code=400, detail="Could not extract images from PDF")
        else:
            # Handle image files
            image = Image.open(io.BytesIO(file_content))
            processed_data = await omr_processor.process_image(image)
        
        # Perform transcription analysis (focused on notes rather than harmony)
        analysis_result = await harmonic_analyzer.analyze(processed_data)
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/analyze-sheet-music", response_model=AnalysisResult)
async def analyze_sheet_music(file: UploadFile = File(...)):
    """
    Analyze uploaded sheet music (PDF or image) for harmonic content
    and musical structure.
    
    DEPRECATED: Use /transcribe-sheet-music instead
    """
    # Redirect to new endpoint for backward compatibility
    return await transcribe_sheet_music(file)

@app.post("/suggest-config", response_model=ConfigSuggestion)
async def suggest_metronome_config(analysis: AnalysisResult):
    """
    Generate metronome configuration suggestions based on analysis results.
    """
    try:
        # Extract key parameters
        tempo = analysis.tempo_bpm or 120  # Default tempo if not detected
        
        # Determine accompaniment style based on time signature and key
        accompaniment_style = "piano"  # Default
        if analysis.time_signature in ["3/4", "6/8"]:
            accompaniment_style = "waltz"
        elif analysis.time_signature in ["4/4", "2/4"]:
            accompaniment_style = "piano" if len(analysis.chord_progression) > 4 else "simple"
        
        config = ConfigSuggestion(
            tempo_bpm=tempo,
            time_signature=analysis.time_signature,
            key=analysis.key_signature,
            chord_progression=analysis.chord_progression,
            accompaniment_style=accompaniment_style
        )
        
        return config
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Configuration generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
