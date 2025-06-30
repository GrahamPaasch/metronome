#!/usr/bin/env python3
"""
Simple test script to verify the backend OMR API is working correctly.
"""

import requests
import json
from PIL import Image, ImageDraw, ImageFont
import io
import sys
import os

def create_test_image():
    """Create a simple test image with some basic musical elements"""
    # Create a white image
    img = Image.new('RGB', (800, 600), 'white')
    draw = ImageDraw.Draw(img)
    
    # Draw some basic staff lines
    for i in range(5):
        y = 200 + i * 20
        draw.line([(50, y), (750, y)], fill='black', width=2)
    
    # Draw treble clef placeholder (simple circle)
    draw.ellipse([60, 180, 100, 280], outline='black', width=3)
    
    # Draw some note heads (circles)
    note_positions = [(150, 200), (200, 180), (250, 160), (300, 200)]
    for x, y in note_positions:
        draw.ellipse([x-8, y-4, x+8, y+4], fill='black')
    
    # Save to bytes
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer

def test_backend_api():
    """Test the backend API with a simple image"""
    print("Testing Musical Practice Companion Backend API...")
    
    # Test health endpoint
    try:
        response = requests.get('http://localhost:8000/')
        print(f"Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        return False
    
    # Create test image
    print("Creating test image...")
    test_image = create_test_image()
    
    # Test transcription endpoint
    try:
        files = {'file': ('test_music.png', test_image, 'image/png')}
        response = requests.post('http://localhost:8000/transcribe-sheet-music', files=files)
        
        print(f"Transcription response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("Transcription successful!")
            print(f"Key signature: {result.get('key_signature', 'Unknown')}")
            print(f"Time signature: {result.get('time_signature', 'Unknown')}")
            print(f"Tempo: {result.get('tempo_bpm', 'Unknown')} BPM")
            print(f"Confidence: {result.get('confidence_score', 0):.2f}")
            print(f"Chord progression: {result.get('chord_progression', [])}")
            print(f"Number of measures: {len(result.get('measures', []))}")
            
            # Check if analysis notes are present
            if 'analysis_notes' in result:
                print(f"Analysis notes: {result['analysis_notes']}")
            
            return True
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error during analysis: {e}")
        return False

if __name__ == "__main__":
    success = test_backend_api()
    sys.exit(0 if success else 1)
