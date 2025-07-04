# Musical Practice Companion

A modern, TypeScript-based metronome application with harmonic accompaniment features designed for serious musical practice. Built with a modular agent-based architecture and Web Audio API for precise timing and audio generation.

## Features

### Core Metronome
- **Precise timing** with Web Audio API scheduling and drift correction
- **Flexible time signatures** (2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8, etc.)
- **Subdivisions** (quarter notes, eighth notes, triplets, sixteenth notes)
- **Variable tempo** (30-300 BPM) with real-time adjustment
- **Tap tempo** for quick BPM detection
- **Multiple sound types** (click, tick, bell, woodblock, beep)
- **Visual beat indicators** for silent practice

### Advanced Metronome Features
- **Accent patterns** with customizable groupings (2+2, 3+3, 2+3, etc.)
- **Polyrhythm support** for complex rhythmic practice
- **Tempo changes** (sudden/gradual) at specific measures
- **Practice ramping** with automatic tempo progression
- **Measure loops** for focused practice sections
- **Preset system** for saving/loading configurations

### Tuning Systems
- **Multiple tuning references**: A440 (concert pitch), A442 (baroque), A432 (natural)
- **Custom tuning frequencies** for period instruments
- **Drone notes** for scale practice and intonation work

### Harmonic Accompaniment
- **Chord progression builder** with measure-by-measure input
- **Multiple instrument voicings**: Piano, Organ, Harmonium, Harp, Strings
- **Voicing customization**: Register (low/mid/high), density (sparse/medium/full), style (block/arpeggiated/sustained)
- **Tempo synchronization** - harmonies stay locked to metronome during tempo changes
- **Clean, non-vibrato tones** that provide context without imposing interpretation

### Sheet Music Analysis (NEW!)
- **Photo upload** with drag & drop interface
- **Optical Music Recognition (OMR)** for symbol detection
- **Harmonic analysis** of chord progressions
- **Auto-configuration** of metronome and accompaniment settings
- **Analysis history** with confidence scoring
- **One-click application** of detected musical elements

### Practice Features
- **Chord analysis** with educational descriptions
- **Basic progression generator** for common key signatures
- **Session management** with save/load functionality
- **Real-time status display** showing current measure, beat, and chord
- **Volume controls** for individual elements (click, harmony, drones)

## Architecture

The application uses a modern **agent-based architecture** with clear separation of concerns:

- **TempoAgent**: Handles precise timing and metronome functionality
- **AudioAgent**: Manages audio generation, sound synthesis, and playback
- **HarmonyAgent**: Processes chord progressions and harmonic analysis
- **SheetMusicAgent**: Handles photo upload, OMR, and musical analysis
- **MusicalPracticeCompanion**: Main coordinator that wires agents together

## Technology Stack

- **TypeScript** for type safety and better code organization
- **Vite** for fast development and optimized builds
- **Web Audio API** for precise timing and custom sound synthesis
- **Tonal.js** for music theory calculations
- **VexFlow** for notation rendering (future feature)
- **Modern CSS** with CSS Grid and custom properties

## Getting Started

### Prerequisites
- Node.js 18+ 
- Modern browser with Web Audio API support

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd musical-practice-companion

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

1. **Set your tempo** using the BPM slider or input field
2. **Choose time signature** and subdivision as needed
3. **Select tuning system** (A442 for harmonium, A440 for standard practice)
4. **Add chord progressions** by entering measure numbers and chord symbols
5. **Customize voicing** - choose instrument type, register, and density
6. **Adjust volumes** for metronome click, harmony, and drone notes
7. **Start practicing** with the play button

### Adding Chord Progressions

Enter standard chord symbols in the progression builder:
- Major chords: `C`, `F`, `G`
- Minor chords: `Am`, `Dm`, `Em`
- Seventh chords: `Cmaj7`, `G7`, `Am7`
- Complex chords: `Dm7b5`, `C#dim7`, `Fadd9`

The system will analyze chords and provide harmonic context during practice.

## Viola Practice Focus

This application was specifically designed for viola practice needs:

- **A442 tuning support** for baroque and period instrument compatibility
- **Clean accompaniment tones** that don't interfere with developing personal vibrato and expression
- **Harmonic context** that aids in intonation and musical understanding
- **Flexible tempo changes** for working up difficult passages

## Development

### Project Structure
```
src/
├── agents/           # Core agent classes
├── components/       # UI components
├── styles/          # CSS styles
├── types/           # TypeScript type definitions
└── main.ts          # Application entry point
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linting (if configured)

## Future Enhancements

- **Optical Music Recognition** (OMR) for automatic chord analysis from sheet music
- **Python backend** with music21 library for advanced music analysis
- **LLM integration** for practice feedback and instruction
- **Session recording** and playback analysis
- **Mobile app** versions for iOS and Android
- **Advanced notation display** with VexFlow integration

## Contributing

This project follows modern TypeScript best practices and uses a modular architecture. When contributing:

1. Follow the agent-based pattern for new features
2. Use TypeScript strict mode and proper typing
3. Add JSDoc comments for public APIs
4. Ensure Web Audio API calls are properly scheduled
5. Test with multiple browsers and audio devices

## License

[License information to be added]

## Acknowledgments

Built for serious musicians who need more than just a basic metronome. Inspired by the need for harmonic context during practice that most musicians lack without access to a dedicated accompanist.

---

*"The best viola player I knew as a kid had an identical twin sister who could play piano at a professional level. That musical family environment made all the difference. This app aims to provide that harmonic context for everyday musicians."*
