# Sheet Music Upload Feature

## Overview

The Musical Practice Companion now includes a powerful sheet music analysis feature that allows users to upload photos of sheet music, perform optical music recognition (OMR) and harmonic analysis, and automatically configure the metronome and accompaniment settings.

## Features

### Sheet Music Upload
- **Drag & Drop Interface**: Simply drag and drop files or click to browse
- **Multiple File Formats**: Supports PDF files and image formats (JPG, PNG, etc.)
- **File Preview**: See a preview of your uploaded sheet music with file type indicator
- **File Size Limits**: Up to 20MB for PDFs, 10MB for images
- **PDF Processing**: Automatically converts PDF pages to images for analysis

### Optical Music Recognition (OMR)
- **Symbol Detection**: Identifies musical symbols including:
  - Time signatures
  - Key signatures  
  - Chord symbols
  - Notes and rests
  - Bar lines
- **Position Mapping**: Tracks the precise location of each symbol
- **Confidence Scoring**: Provides reliability scores for detected elements

### Harmonic Analysis
- **Chord Progression Extraction**: Automatically identifies chord progressions
- **Key Analysis**: Determines the key signature and tonal center
- **Tempo Detection**: Attempts to identify tempo markings
- **Measure Counting**: Counts the number of measures in the piece

### Auto-Configuration
- **Metronome Setup**: Automatically sets tempo and time signature
- **Chord Progression**: Populates the accompaniment with detected chords
- **Voicing Suggestions**: Provides appropriate chord voicings
- **One-Click Apply**: Option to automatically apply settings

## How to Use

### 1. Upload Sheet Music
1. Navigate to the "Sheet Music Analysis" section
2. Click the upload area or drag and drop a PDF or image file
3. The file will be previewed with a file type indicator (PDF/IMAGE)
4. PDFs are automatically rendered to images for processing

### 2. Analyze the Music
1. Click "Analyze Sheet Music" to start the analysis
2. Wait for the processing to complete (usually a few seconds)
3. Review the analysis results including:
   - Confidence score (shown as a percentage and color-coded bar)
   - Detected tempo
   - Time signature
   - Key signature
   - Chord progression (displayed as chips)

### 3. Apply to Practice
1. **Automatic**: Check "Auto-apply to metronome" for immediate application
2. **Manual**: Click "Apply to Practice" to manually apply the settings
3. The metronome and harmony settings will be updated based on the analysis

### 4. Analysis History
- Click "View History" to see all previous analyses
- Apply settings from any previous analysis
- Track your analysis confidence scores over time

## Technical Details

### File Format Support
The feature now supports both **PDF files** and **image files**:

#### PDF Processing (NEW!)
- **PDF.js Integration**: Uses PDF.js library for client-side PDF processing
- **First Page Rendering**: Automatically renders the first page of multi-page PDFs
- **High Resolution**: 2x scale rendering for better symbol detection
- **File Size**: Supports PDFs up to 20MB

#### Image Processing
- **Multiple Formats**: JPG, PNG, GIF, WebP, and other browser-supported formats
- **Direct Processing**: Images are processed directly without conversion
- **File Size**: Supports images up to 10MB

### Current Implementation (Demo Mode)
The feature currently uses a **demo/mock OMR system** for testing purposes. **Important limitations:**

- **Mock Analysis**: Results are generated using music theory patterns, not actual image analysis
- **Lower Confidence**: Confidence scores are intentionally conservative (30-65%) to reflect limitations
- **Educational Purpose**: Demonstrates the workflow and user interface
- **Key-Aware**: Generates progressions appropriate to detected key signatures
- **Warning Messages**: Clear disclaimers about demo mode limitations

**Note**: This mock system is designed for demonstration only. Real sheet music analysis requires proper OMR integration.

### Future Enhancements: Real OMR Integration
The architecture is designed to support real OMR integration with **music21** (MIT's music analysis library):

#### Planned Implementation:
- **Python Backend**: FastAPI service with music21 integration
- **Accurate Key Detection**: Proper analysis of sharps/flats in key signatures  
- **Chord Recognition**: Real harmonic analysis from musical notation
- **Confidence Scoring**: Honest confidence based on actual symbol detection quality
- **Extended Analysis**: Roman numeral analysis, voice leading, harmonic rhythm

#### Why music21?
- **Proven Accuracy**: Used in academic music research
- **Comprehensive**: Full music theory implementation
- **Extensible**: Rich ecosystem for advanced analysis
- **Active Development**: Large community and ongoing support

See `OMR_INTEGRATION_PLAN.md` for detailed implementation roadmap.

### Analysis Pipeline
1. **File Processing**: Upload handling for both PDFs and images
2. **PDF Rendering**: Convert PDF pages to high-resolution images (if PDF)
3. **Image Conversion**: Convert to ImageData for processing
4. **Symbol Detection**: Optical recognition of musical symbols
5. **Musical Context**: Understanding of musical structure and relationships
6. **Harmonic Analysis**: Chord identification and progression analysis
7. **Configuration**: Translation to metronome and accompaniment settings
4. **Harmonic Analysis**: Chord identification and progression analysis
5. **Configuration**: Translation to metronome and accompaniment settings

## Error Handling

The system includes comprehensive error handling:
- **File Validation**: Checks file type and size limits
- **Analysis Errors**: Graceful handling of recognition failures  
- **Network Issues**: Retry mechanisms for cloud-based processing
- **User Feedback**: Clear error messages and success notifications

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **File API Support**: Required for drag & drop functionality
- **Canvas API**: Used for image processing
- **Web Audio API**: For audio generation and timing

## Tips for Best Results

### File Quality
- **PDF Files**: Use high-quality PDFs with clear text and symbols
- **Image Files**: Use clear, high-resolution images (300 DPI or higher)
- **Good Lighting**: For photos, ensure even lighting without shadows
- **Straight Orientation**: Keep the sheet music as straight as possible
- **Full Pages**: Include complete musical phrases when possible

### Supported Content
- **Lead Sheets**: Chord symbols with melody (ideal)
- **Piano Music**: Simple chord progressions work best
- **Popular Music**: Standard notation with chord symbols
- **Educational Materials**: Method books and etudes
- **PDF Sheet Music**: Digital scores and arrangements

### Limitations
- **Complex Scores**: Full orchestral scores may not analyze well
- **Handwritten Music**: Works best with printed music
- **Multiple Parts**: Currently optimized for single-staff music
- **Advanced Harmony**: Complex jazz chords may not be fully recognized

## Development Notes

### Code Structure
- `SheetMusicAgent.ts`: Main processing logic
- `PracticeCompanionUI.ts`: User interface components
- `MusicalPracticeCompanion.ts`: Integration with main app
- `types/index.ts`: Type definitions for analysis results

### Extensibility
The agent-based architecture makes it easy to:
- Swap OMR engines
- Add new analysis features
- Integrate with music libraries
- Export to different formats

### Testing
Use the demo mode to test the workflow:
1. Upload any image file
2. Click "Analyze Sheet Music"
3. Review the mock analysis results
4. Apply to practice settings
5. Start the metronome to hear the accompaniment

This feature transforms the practice companion from a simple metronome into an intelligent practice partner that can adapt to your sheet music automatically.

## Dependencies

The PDF support feature adds the following dependencies:

### Runtime Dependencies
- **pdfjs-dist**: Mozilla's PDF.js library for client-side PDF processing
- **@types/pdfjs-dist**: TypeScript type definitions for PDF.js

### CDN Resources
- **PDF.js Worker**: Loaded from CloudFlare CDN for reliability
- **Version**: 3.11.174 (latest stable)

### Browser Requirements
- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **Web Workers**: Required for PDF.js background processing
- **Canvas API**: Required for PDF rendering
- **File API**: Required for drag & drop functionality
