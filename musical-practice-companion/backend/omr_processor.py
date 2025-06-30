"""
Optical Music Recognition (OMR) processor for sheet music analysis.
Uses computer vision and image processing to extract musical elements.
"""

import cv2
import numpy as np
from PIL import Image
import pytesseract
from typing import Dict, List, Tuple, Optional, Any
import logging

logger = logging.getLogger(__name__)

class OMRProcessor:
    """
    Optical Music Recognition processor that extracts musical elements
    from sheet music images using computer vision techniques.
    """
    
    def __init__(self):
        """Initialize the OMR processor with default parameters."""
        self.staff_line_height = 1  # Height of staff lines in pixels
        self.staff_space_height = 4  # Height between staff lines
        self.note_templates = self._load_note_templates()
        self.clef_templates = self._load_clef_templates()
        
    async def process_image(self, image: Image.Image) -> Dict[str, Any]:
        """
        Process a sheet music image and extract musical information.
        
        Args:
            image: PIL Image of sheet music
            
        Returns:
            Dictionary containing extracted musical data
        """
        try:
            # Convert PIL image to OpenCV format
            cv_image = self._pil_to_cv(image)
            
            # Preprocessing
            processed_image = self._preprocess_image(cv_image)
            
            # Extract staff lines
            staff_lines = self._detect_staff_lines(processed_image)
            
            # Extract measures
            measures = self._detect_measures(processed_image, staff_lines)
            
            # Detect key signature
            key_signature = self._detect_key_signature(processed_image, staff_lines)
            
            # Detect time signature
            time_signature = self._detect_time_signature(processed_image, staff_lines)
            
            # Detect notes and chords
            notes_and_chords = self._detect_notes_and_chords(processed_image, staff_lines, measures)
            
            # Extract tempo markings
            tempo_bpm = self._extract_tempo_marking(cv_image)
            
            return {
                'staff_lines': staff_lines,
                'measures': measures,
                'key_signature': key_signature,
                'time_signature': time_signature,
                'notes_and_chords': notes_and_chords,
                'tempo_bpm': tempo_bpm,
                'image_dimensions': (int(image.size[0]), int(image.size[1]))
            }
            
        except Exception as e:
            logger.error(f"OMR processing failed: {e}")
            raise Exception(f"Failed to process sheet music image: {e}")
    
    def _pil_to_cv(self, pil_image: Image.Image) -> np.ndarray:
        """Convert PIL Image to OpenCV format."""
        # Convert to RGB if necessary
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Convert to numpy array and change color order from RGB to BGR
        cv_image = np.array(pil_image)
        cv_image = cv2.cvtColor(cv_image, cv2.COLOR_RGB2BGR)
        
        return cv_image
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess the image for better OMR results.
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        
        # Apply adaptive thresholding for binarization
        binary = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Invert image (make staff lines black on white background)
        binary = cv2.bitwise_not(binary)
        
        return binary
    
    def _detect_staff_lines(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect horizontal staff lines in the image.
        """
        staff_lines = []
        
        # Use HoughLinesP to detect horizontal lines
        lines = cv2.HoughLinesP(
            image, rho=1, theta=np.pi/180, threshold=100,
            minLineLength=100, maxLineGap=10
        )
        
        if lines is not None:
            # Filter for horizontal lines (small angle deviation)
            horizontal_lines = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                if abs(angle) < 5:  # Nearly horizontal
                    horizontal_lines.append({
                        'y_position': (y1 + y2) // 2,
                        'x_start': min(x1, x2),
                        'x_end': max(x1, x2),
                        'angle': angle
                    })
            
            # Group lines into staves (5 lines per staff)
            horizontal_lines.sort(key=lambda x: x['y_position'])
            
            # Simple grouping - in practice, this would be more sophisticated
            for i in range(0, len(horizontal_lines), 5):
                if i + 4 < len(horizontal_lines):
                    staff_group = horizontal_lines[i:i+5]
                    staff_lines.append({
                        'lines': staff_group,
                        'top_line': staff_group[0]['y_position'],
                        'bottom_line': staff_group[4]['y_position'],
                        'staff_height': staff_group[4]['y_position'] - staff_group[0]['y_position']
                    })
        
        return staff_lines
    
    def _detect_measures(self, image: np.ndarray, staff_lines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect measure divisions (bar lines) in the image.
        """
        measures = []
        
        if not staff_lines:
            return measures
        
        # Use HoughLinesP to detect vertical lines (bar lines)
        lines = cv2.HoughLinesP(
            image, rho=1, theta=np.pi/180, threshold=50,
            minLineLength=50, maxLineGap=5
        )
        
        if lines is not None:
            # Filter for vertical lines
            vertical_lines = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                if abs(angle - 90) < 15 or abs(angle + 90) < 15:  # Nearly vertical
                    vertical_lines.append({
                        'x_position': (x1 + x2) // 2,
                        'y_start': min(y1, y2),
                        'y_end': max(y1, y2)
                    })
            
            # Sort by x position
            vertical_lines.sort(key=lambda x: x['x_position'])
            
            # Create measures between consecutive bar lines
            for i in range(len(vertical_lines) - 1):
                measures.append({
                    'start_x': vertical_lines[i]['x_position'],
                    'end_x': vertical_lines[i + 1]['x_position'],
                    'width': vertical_lines[i + 1]['x_position'] - vertical_lines[i]['x_position'],
                    'measure_number': i + 1
                })
        
        return measures
    
    def _detect_key_signature(self, image: np.ndarray, staff_lines: List[Dict[str, Any]]) -> str:
        """
        Detect key signature from the image.
        This is a simplified implementation - real OMR would use template matching.
        """
        # Placeholder implementation
        # In a real system, this would use template matching to detect sharps/flats
        # after the clef at the beginning of each staff
        
        return "C"  # Default to C major for now
    
    def _detect_time_signature(self, image: np.ndarray, staff_lines: List[Dict[str, Any]]) -> str:
        """
        Detect time signature from the image.
        """
        # Placeholder implementation
        # Would use OCR or template matching to detect time signature numbers
        
        return "4/4"  # Default to 4/4 time
    
    def _detect_notes_and_chords(self, image: np.ndarray, staff_lines: List[Dict[str, Any]], 
                                measures: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Detect individual notes and chords in the music.
        """
        notes_and_chords = []
        
        # This is where the main note detection would happen
        # Using template matching, contour detection, etc.
        
        # Placeholder: return empty list for now
        # Real implementation would:
        # 1. Detect note heads using circular Hough transform or template matching
        # 2. Classify note types (whole, half, quarter, etc.) based on stems and flags
        # 3. Determine pitch based on staff position
        # 4. Group simultaneous notes into chords
        
        return notes_and_chords
    
    def _extract_tempo_marking(self, image: np.ndarray) -> Optional[int]:
        """
        Extract tempo marking using OCR.
        """
        try:
            # Use OCR to find tempo markings
            text = pytesseract.image_to_string(image)
            
            # Look for common tempo patterns
            import re
            tempo_patterns = [
                r'♩\s*=\s*(\d+)',  # Quarter note = number
                r'BPM\s*(\d+)',
                r'(\d+)\s*BPM',
                r'Allegro.*(\d+)',
                r'Andante.*(\d+)',
                r'Moderato.*(\d+)'
            ]
            
            for pattern in tempo_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    return int(match.group(1))
            
        except Exception as e:
            logger.warning(f"Could not extract tempo marking: {e}")
        
        return None
    
    def _load_note_templates(self) -> Dict[str, np.ndarray]:
        """Load templates for note recognition."""
        # In a real implementation, this would load actual note templates
        # from files or create them programmatically
        return {}
    
    def _load_clef_templates(self) -> Dict[str, np.ndarray]:
        """Load templates for clef recognition."""
        # In a real implementation, this would load clef templates
        return {}
