# Real OMR Integration Plan

## Current Problem

The mock system is producing misleadingly high confidence scores (81%) for completely incorrect analysis results. This is problematic because:

1. **Wrong Key Detection**: Shows C major instead of G major (1 sharp)
2. **Incorrect Chord Analysis**: Shows C major instead of G major (second inversion)
3. **False Confidence**: High confidence scores for wrong results mislead users

## Recommended Solutions

### Option 1: music21 + Python Backend (Recommended)

**music21** is MIT's excellent music analysis library with proven OMR capabilities.

#### Architecture:
```
Frontend (TypeScript) → API Endpoint → Python Backend → music21 → Results
```

#### Implementation:
1. **Python Service**: FastAPI backend with music21
2. **OMR Pipeline**: music21.converter + music21.analysis
3. **Chord Analysis**: music21.roman for harmonic analysis
4. **Key Detection**: music21.key for proper key signature analysis

#### Advantages:
- **Proven Library**: music21 is used in academic music research
- **Accurate Analysis**: Proper music theory implementation
- **Extensible**: Rich ecosystem for music analysis
- **Community**: Large user base and documentation

#### Implementation Steps:
1. Create Python FastAPI service
2. Integrate music21 for score parsing
3. Add endpoints for upload/analysis
4. Update frontend to call API
5. Handle CORS and file uploads

### Option 2: Client-Side JavaScript Libraries

#### Libraries to Consider:
- **VexFlow**: Music notation rendering (could be extended for analysis)
- **Tone.js**: Web Audio utilities (limited OMR capabilities)
- **Custom ML**: TensorFlow.js with trained model

#### Challenges:
- **Limited OMR**: No mature client-side OMR libraries
- **Complex Analysis**: Music theory analysis is complex in JS
- **Training Data**: Would need significant ML training

### Option 3: Cloud APIs

#### Options:
- **Google Vision API**: With custom music training
- **Azure Cognitive Services**: Custom vision models
- **AWS Textract**: With music notation training

#### Pros/Cons:
- **Pros**: Powerful ML capabilities, no local processing
- **Cons**: Cost, privacy concerns, requires internet

## Recommended Implementation: music21 Backend

### Phase 1: Basic OMR
```python
# Python backend with music21
from music21 import converter, analysis, key, roman
from fastapi import FastAPI, UploadFile

app = FastAPI()

@app.post("/analyze-sheet-music")
async def analyze_sheet_music(file: UploadFile):
    # 1. Parse uploaded file
    score = converter.parse(file.filename)
    
    # 2. Analyze key signature
    key_sig = score.analyze('key')
    
    # 3. Extract chord symbols
    chords = []
    for element in score.flat:
        if element.isChord:
            chords.append({
                'measure': element.measureNumber,
                'chord': element.pitchedCommonName,
                'confidence': 0.9  # Real confidence from analysis
            })
    
    # 4. Roman numeral analysis
    for chord in chords:
        rn = roman.romanNumeralFromChord(chord, key_sig)
        chord['roman'] = str(rn)
    
    return {
        'key': str(key_sig),
        'chords': chords,
        'confidence': calculate_real_confidence(score)
    }
```

### Phase 2: Enhanced Analysis
- **Voice Leading**: Analyze part-writing
- **Harmonic Rhythm**: Detect chord change patterns
- **Form Analysis**: Identify sections and phrases
- **Performance Markings**: Tempo, dynamics, articulations

### Phase 3: ML Integration
- **Symbol Recognition**: Train models for handwritten music
- **Layout Analysis**: Staff detection and symbol positioning
- **Multi-page Processing**: Handle complex scores

## Immediate Fixes for Current System

Until real OMR is implemented, let's fix the mock system:

### 1. Honest Confidence Scores
```typescript
// Lower confidence for mock system
const mockConfidence = Math.max(0.2, Math.min(0.5, baseConfidence));
```

### 2. Better Mock Analysis
```typescript
// Actually try to detect key signatures from image analysis
// Even simple pattern matching would be better
const detectKeySignature = (imageData: ImageData) => {
  // Look for sharp/flat symbols near the staff
  // Count accidentals
  // Return appropriate key
};
```

### 3. Warning Messages
- Clear disclaimers about mock system
- Explain limitations
- Set expectations appropriately

## Timeline

### Week 1: Fix Mock System
- ✅ Add warning messages
- ✅ Lower confidence scores
- ✅ Better progression generation
- Fix PDF.js version issues

### Week 2: Python Backend Setup
- Create FastAPI service
- Integrate music21
- Basic file upload/analysis
- Deploy locally

### Week 3: Frontend Integration
- Update TypeScript to call API
- Handle async analysis
- Error handling and feedback
- Testing with real sheet music

### Week 4: Refinement
- Improve analysis accuracy
- Add more music theory features
- Performance optimization
- Documentation

## Cost/Benefit Analysis

### music21 Backend:
- **Setup Time**: 1-2 weeks
- **Accuracy**: High (proven library)
- **Maintenance**: Medium (Python dependency)
- **Scalability**: Good (API-based)

### Client-Side Only:
- **Setup Time**: 3-4 weeks (custom implementation)
- **Accuracy**: Low-Medium (limited libraries)
- **Maintenance**: High (custom code)
- **Scalability**: Excellent (no backend)

**Recommendation**: Proceed with music21 backend for accuracy and reliability.

## Next Steps

1. **Immediate**: Fix current mock system issues
2. **Short-term**: Set up Python backend with music21
3. **Medium-term**: Integrate real OMR analysis
4. **Long-term**: Add advanced music theory features

This approach will provide accurate, reliable sheet music analysis that musicians can trust for practice accompaniment.
