# Musical Practice Companion Backend

A Python FastAPI backend for analyzing sheet music using OMR (Optical Music Recognition) and harmonic analysis.

## Features

- **Optical Music Recognition (OMR)**: Extract musical elements from sheet music images
- **Harmonic Analysis**: Generate chord progressions using music21
- **Multi-format Support**: Handle both PDF and image files
- **REST API**: Easy integration with frontend applications
- **Music Theory**: Intelligent chord progression generation based on key signatures

## Installation

1. **Clone the repository** (if not already done)

2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Install additional system dependencies** (if needed):
   
   For Windows:
   - Install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
   - Add Tesseract to your PATH
   
   For Linux/Mac:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install tesseract-ocr
   
   # macOS
   brew install tesseract
   ```

## Usage

1. **Start the development server**:
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Access the API**:
   - API runs on: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - OpenAPI spec: http://localhost:8000/openapi.json

## API Endpoints

### `POST /transcribe-sheet-music`
Upload and transcribe sheet music (PDF or image) to extract notes and musical elements.

**Request**: Multipart form with file upload
**Response**: Detailed musical transcription including:
- Key signature
- Time signature
- Notes detected
- Tempo
- Confidence score

### `POST /analyze-sheet-music` (DEPRECATED)
Legacy endpoint - redirects to `/transcribe-sheet-music` for backward compatibility.

### `POST /suggest-config`
Generate metronome configuration based on analysis results.

**Request**: Analysis result object
**Response**: Suggested metronome settings

### `GET /`
Health check endpoint.

## Development

The backend consists of several modules:

- `main.py`: FastAPI application and API endpoints
- `omr_processor.py`: Optical Music Recognition using OpenCV
- `harmonic_analyzer.py`: Musical analysis using music21
- `requirements.txt`: Python dependencies

## Configuration

Environment variables can be set in a `.env` file:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Tesseract Path (if not in PATH)
TESSERACT_CMD=/usr/bin/tesseract
```

## Testing

The backend can be tested using the interactive docs at `/docs` or with curl:

```bash
# Health check
curl http://localhost:8000/

# Analyze sheet music
curl -X POST "http://localhost:8000/analyze-sheet-music" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@path/to/sheet-music.pdf"
```

## Integration with Frontend

The backend is designed to integrate with the Musical Practice Companion frontend. Make sure:

1. Backend is running on port 8000
2. Frontend is configured to use `http://localhost:8000` as the API base URL
3. CORS is properly configured for your frontend origin

## Limitations

Current implementation has some limitations:

- OMR accuracy depends on image quality and complexity
- Template matching for note recognition is basic
- Harmonic analysis uses heuristic approaches
- PDF processing requires additional libraries for full functionality

## Future Improvements

- Enhanced OMR with machine learning models
- More sophisticated harmonic analysis
- Support for complex musical notation
- Real-time analysis capabilities
- Integration with music notation software
