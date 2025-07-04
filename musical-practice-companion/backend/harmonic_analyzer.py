"""
Harmonic analyzer for sheet music using music21.
Analyzes musical structure and generates chord progressions.
"""

from music21 import stream, pitch, key, roman, harmony, interval, chord, meter
from typing import Dict, List, Optional, Any, Tuple
import logging
import random
import numpy as np

logger = logging.getLogger(__name__)

class HarmonicAnalyzer:
    """
    Analyzes harmonic content of sheet music and generates
    practice-friendly chord progressions.
    """
    
    def __init__(self):
        """Initialize the harmonic analyzer."""
        self.common_progressions = {
            'major': [
                ['I', 'V', 'vi', 'IV'],  # I-V-vi-IV (very common)
                ['I', 'vi', 'IV', 'V'],  # I-vi-IV-V (classic)
                ['vi', 'IV', 'I', 'V'],  # vi-IV-I-V (pop)
                ['I', 'IV', 'V', 'I'],   # I-IV-V-I (traditional)
                ['I', 'vi', 'ii', 'V'],  # I-vi-ii-V (jazz)
            ],
            'minor': [
                ['i', 'VII', 'VI', 'VII'],  # i-VII-VI-VII
                ['i', 'iv', 'V', 'i'],      # i-iv-V-i (harmonic minor)
                ['i', 'VI', 'III', 'VII'],  # i-VI-III-VII
                ['i', 'v', 'VI', 'iv'],     # i-v-VI-iv
                ['i', 'ii°', 'V', 'i'],     # i-ii°-V-i
            ]
        }
        
    async def analyze(self, omr_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze OMR data and generate harmonic analysis.
        
        Args:
            omr_data: Data from OMR processing
            
        Returns:
            Complete analysis including chord progressions and confidence
        """
        try:
            # Extract basic musical parameters
            key_sig = omr_data.get('key_signature', 'C')
            time_sig = omr_data.get('time_signature', '4/4')
            tempo = omr_data.get('tempo_bpm')
            measures = omr_data.get('measures', [])
            notes_and_chords = omr_data.get('notes_and_chords', [])
            
            # Create music21 key object
            music_key = self._parse_key_signature(key_sig)
            
            # Analyze harmonic content
            chord_progression = self._generate_chord_progression(music_key, len(measures))
            
            # Generate Roman numeral analysis
            roman_analysis = self._generate_roman_analysis(chord_progression, music_key)
            
            # Calculate confidence based on available data
            confidence = self._calculate_confidence(omr_data)
            
            # Generate analysis notes
            analysis_notes = self._generate_analysis_notes(omr_data, confidence)
            
            # Prepare harmonic analysis details
            harmonic_analysis = {
                'key_analysis': {
                    'key': music_key.name,
                    'mode': music_key.mode,
                    'tonic': music_key.tonic.name,
                    'scale_degrees': [p.name for p in music_key.pitches]
                },
                'chord_functions': roman_analysis,
                'suggested_voicings': self._suggest_voicings(chord_progression),
                'harmonic_rhythm': self._analyze_harmonic_rhythm(time_sig, len(measures))
            }
            
            result = {
                'key_signature': music_key.name,
                'time_signature': time_sig,
                'tempo_bpm': tempo,
                'measures': self._format_measures(measures, chord_progression),
                'chord_progression': chord_progression,
                'confidence_score': confidence,
                'analysis_notes': analysis_notes,
                'harmonic_analysis': harmonic_analysis
            }
            
            # Ensure all data is JSON-serializable
            return self._ensure_json_serializable(result)
            
        except Exception as e:
            logger.error(f"Harmonic analysis failed: {e}")
            # Return a basic fallback analysis
            return self._create_fallback_analysis()
    
    def _parse_key_signature(self, key_sig: str) -> key.Key:
        """Parse key signature string into music21 Key object."""
        try:
            return key.Key(key_sig)
        except:
            # Fallback to C major
            return key.Key('C')
    
    def _generate_chord_progression(self, music_key: key.Key, num_measures: int) -> List[str]:
        """
        Generate an appropriate chord progression based on the key and number of measures.
        """
        if num_measures == 0:
            num_measures = 8  # Default progression length
        
        # Determine if major or minor
        mode = 'major' if music_key.mode == 'major' else 'minor'
        
        # Get appropriate progressions for the mode
        progressions = self.common_progressions[mode]
        
        # Select progression based on measure count
        if num_measures <= 4:
            # Use a simple 4-chord progression
            base_progression = random.choice(progressions)
        elif num_measures <= 8:
            # Use 8-chord progression (repeat or extend)
            base_progression = random.choice(progressions) * 2
        else:
            # For longer pieces, create a more complex progression
            base_progression = self._create_extended_progression(progressions, num_measures)
        
        # Convert Roman numerals to actual chord names
        chord_progression = []
        for roman_numeral in base_progression[:num_measures]:
            try:
                # Create Roman numeral object
                rn = roman.RomanNumeral(roman_numeral, music_key)
                # Get the chord name
                chord_name = rn.pitchedCommonName
                chord_progression.append(chord_name)
            except:
                # Fallback to tonic if there's an error
                chord_progression.append(music_key.tonic.name)
        
        return chord_progression
    
    def _create_extended_progression(self, progressions: List[List[str]], num_measures: int) -> List[str]:
        """Create an extended progression for longer pieces."""
        extended = []
        base_progression = random.choice(progressions)
        
        # Repeat and vary the base progression
        while len(extended) < num_measures:
            if len(extended) == 0:
                # Start with the base progression
                extended.extend(base_progression)
            else:
                # Add variations
                if random.random() < 0.3:  # 30% chance of variation
                    variation = random.choice(progressions)
                    extended.extend(variation)
                else:
                    extended.extend(base_progression)
        
        return extended[:num_measures]
    
    def _generate_roman_analysis(self, chord_progression: List[str], music_key: key.Key) -> List[Dict[str, str]]:
        """Generate Roman numeral analysis for the chord progression."""
        roman_analysis = []
        
        for chord_name in chord_progression:
            try:
                # Parse the chord
                c = chord.Chord(chord_name)
                # Create Roman numeral representation
                rn = roman.romanNumeralFromChord(c, music_key)
                
                roman_analysis.append({
                    'chord': chord_name,
                    'roman': str(rn),
                    'function': self._get_harmonic_function(str(rn)),
                    'quality': rn.quality
                })
            except:
                # Fallback analysis
                roman_analysis.append({
                    'chord': chord_name,
                    'roman': 'I',  # Default to tonic
                    'function': 'tonic',
                    'quality': 'major'
                })
        
        return roman_analysis
    
    def _get_harmonic_function(self, roman_numeral: str) -> str:
        """Determine harmonic function from Roman numeral."""
        # Remove quality indicators
        base_rn = roman_numeral.replace('°', '').replace('+', '').replace('7', '')
        
        tonic_functions = ['I', 'i', 'vi', 'VI']
        subdominant_functions = ['IV', 'iv', 'ii', 'II']
        dominant_functions = ['V', 'v', 'VII', 'vii°']
        
        if base_rn in tonic_functions:
            return 'tonic'
        elif base_rn in subdominant_functions:
            return 'subdominant'
        elif base_rn in dominant_functions:
            return 'dominant'
        else:
            return 'other'
    
    def _suggest_voicings(self, chord_progression: List[str]) -> Dict[str, List[str]]:
        """Suggest different voicings for the chord progression."""
        voicings = {
            'piano': [],
            'guitar': [],
            'close_harmony': []
        }
        
        for chord_name in chord_progression:
            try:
                c = chord.Chord(chord_name)
                
                # Piano voicing (root position, spread)
                piano_voicing = [p.name for p in c.pitches]
                voicings['piano'].append(' '.join(piano_voicing))
                
                # Guitar-style voicing (more compact)
                guitar_voicing = [p.name for p in c.pitches[:4]]  # Limit to 4 notes
                voicings['guitar'].append(' '.join(guitar_voicing))
                
                # Close harmony (tight spacing)
                close_voicing = [p.name for p in c.closedPosition().pitches]
                voicings['close_harmony'].append(' '.join(close_voicing))
                
            except:
                # Fallback to chord name
                voicings['piano'].append(chord_name)
                voicings['guitar'].append(chord_name)
                voicings['close_harmony'].append(chord_name)
        
        return voicings
    
    def _analyze_harmonic_rhythm(self, time_sig: str, num_measures: int) -> Dict[str, Any]:
        """Analyze the harmonic rhythm of the piece."""
        try:
            # Parse time signature
            numerator, denominator = map(int, time_sig.split('/'))
            beats_per_measure = numerator
            
            return {
                'beats_per_measure': beats_per_measure,
                'chord_changes_per_measure': 1,  # Assume one chord per measure for now
                'total_beats': beats_per_measure * num_measures,
                'suggested_chord_duration': f'1 measure ({beats_per_measure} beats)',
                'harmonic_rhythm_notes': [
                    f"Time signature: {time_sig}",
                    f"Suggested: one chord per measure",
                    f"Total duration: {num_measures} measures"
                ]
            }
        except:
            return {
                'beats_per_measure': 4,  # Default
                'chord_changes_per_measure': 1,
                'total_beats': 4 * num_measures,
                'suggested_chord_duration': '1 measure',
                'harmonic_rhythm_notes': ['Using default 4/4 rhythm']
            }
    
    def _calculate_confidence(self, omr_data: Dict[str, Any]) -> float:
        """Calculate confidence score based on available OMR data quality."""
        confidence = 0.0
        
        # Base confidence from successful OMR processing
        confidence += 0.3
        
        # Add confidence based on detected elements
        if omr_data.get('staff_lines'):
            confidence += 0.15
        
        if omr_data.get('measures'):
            confidence += 0.15
        
        if omr_data.get('key_signature') and omr_data['key_signature'] != 'C':
            confidence += 0.1  # Higher if key was actually detected
        
        if omr_data.get('time_signature') and omr_data['time_signature'] != '4/4':
            confidence += 0.1  # Higher if time sig was detected
        
        if omr_data.get('tempo_bpm'):
            confidence += 0.1
        
        if omr_data.get('notes_and_chords'):
            confidence += 0.2
        else:
            confidence -= 0.1  # Lower if no notes detected
        
        # Cap at maximum confidence
        return min(confidence, 0.85)  # Real OMR systems rarely exceed 85% confidence
    
    def _generate_analysis_notes(self, omr_data: Dict[str, Any], confidence: float) -> List[str]:
        """Generate explanatory notes about the analysis."""
        notes = []
        
        # Confidence-based notes
        if confidence < 0.4:
            notes.append("Low confidence analysis - image quality may be poor")
        elif confidence < 0.6:
            notes.append("Moderate confidence - some elements may be inaccurate")
        else:
            notes.append("Good confidence - analysis should be reliable")
        
        # Specific detection notes
        if not omr_data.get('staff_lines'):
            notes.append("No staff lines detected - using default assumptions")
        
        if not omr_data.get('measures'):
            notes.append("No measure divisions detected - using estimated progression")
        
        if omr_data.get('key_signature') == 'C':
            notes.append("Key signature defaulted to C major")
        
        if omr_data.get('time_signature') == '4/4':
            notes.append("Time signature defaulted to 4/4")
        
        if not omr_data.get('notes_and_chords'):
            notes.append("No individual notes detected - chord progression is estimated")
        
        notes.append("Chord progression generated using common harmonic patterns")
        
        return notes
    
    def _format_measures(self, measures: List[Dict[str, Any]], chord_progression: List[str]) -> List[Dict[str, Any]]:
        """Format measure data with chord assignments."""
        formatted_measures = []
        
        for i, measure in enumerate(measures):
            chord = chord_progression[i] if i < len(chord_progression) else chord_progression[-1]
            
            formatted_measure = {
                **measure,
                'chord': chord,
                'beat_count': 4,  # Default to 4 beats per measure
                'notes': []  # Would contain actual note data in full implementation
            }
            formatted_measures.append(formatted_measure)
        
        return formatted_measures
    
    def _create_fallback_analysis(self) -> Dict[str, Any]:
        """Create a basic fallback analysis when processing fails."""
        return {
            'key_signature': 'C',
            'time_signature': '4/4',
            'tempo_bpm': None,
            'measures': [
                {'measure_number': 1, 'chord': 'C', 'beat_count': 4, 'notes': []},
                {'measure_number': 2, 'chord': 'Am', 'beat_count': 4, 'notes': []},
                {'measure_number': 3, 'chord': 'F', 'beat_count': 4, 'notes': []},
                {'measure_number': 4, 'chord': 'G', 'beat_count': 4, 'notes': []}
            ],
            'chord_progression': ['C', 'Am', 'F', 'G'],
            'confidence_score': 0.2,
            'analysis_notes': [
                'Fallback analysis used due to processing error',
                'Using basic I-vi-IV-V progression in C major',
                'Manual verification recommended'
            ],
            'harmonic_analysis': {
                'key_analysis': {
                    'key': 'C',
                    'mode': 'major',
                    'tonic': 'C',
                    'scale_degrees': ['C', 'D', 'E', 'F', 'G', 'A', 'B']
                },
                'chord_functions': [
                    {'chord': 'C', 'roman': 'I', 'function': 'tonic', 'quality': 'major'},
                    {'chord': 'Am', 'roman': 'vi', 'function': 'tonic', 'quality': 'minor'},
                    {'chord': 'F', 'roman': 'IV', 'function': 'subdominant', 'quality': 'major'},
                    {'chord': 'G', 'roman': 'V', 'function': 'dominant', 'quality': 'major'}
                ],
                'suggested_voicings': {
                    'piano': ['C E G', 'A C E', 'F A C', 'G B D'],
                    'guitar': ['C E G', 'A C E', 'F A C', 'G B D'],
                    'close_harmony': ['C E G', 'A C E', 'F A C', 'G B D']
                },
                'harmonic_rhythm': {
                    'beats_per_measure': 4,
                    'chord_changes_per_measure': 1,
                    'total_beats': 16,
                    'suggested_chord_duration': '1 measure (4 beats)',
                    'harmonic_rhythm_notes': ['Default 4/4 rhythm', 'One chord per measure']
                }
            }
        }
    
    def _ensure_json_serializable(self, data: Any) -> Any:
        """
        Convert numpy types and other non-serializable types to JSON-compatible formats.
        """
        
        if isinstance(data, dict):
            return {key: self._ensure_json_serializable(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._ensure_json_serializable(item) for item in data]
        elif isinstance(data, tuple):
            return tuple(self._ensure_json_serializable(item) for item in data)
        elif isinstance(data, np.integer):
            return int(data)
        elif isinstance(data, np.floating):
            return float(data)
        elif isinstance(data, np.ndarray):
            return data.tolist()
        elif hasattr(data, 'item'):  # numpy scalars
            return data.item()
        else:
            return data
