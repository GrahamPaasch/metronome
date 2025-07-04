# Copilot Instructions for Musical Practice Companion

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Context
This is a TypeScript-based musical practice companion application that extends beyond a basic metronome to provide harmonic accompaniment and tuning references for musicians.

## Architecture Guidelines
- Use **agent-based architecture** with clear separation of concerns
- Each agent should have a single responsibility (TempoAgent, AudioAgent, HarmonyAgent, etc.)
- Use TypeScript interfaces for all agent contracts and data structures
- Implement proper error handling and graceful degradation
- Use Web Audio API for all audio generation and timing

## Key Features
- **Custom tuning system** supporting A442, A440, and custom frequencies
- **Harmonic accompaniment** with measure-by-measure chord progression input
- **Multiple instrument voicings** (piano, organ, harmonium, harp) with clean, non-vibrato tones
- **Tempo synchronization** ensuring harmonies stay locked to metronome during tempo changes
- **Practice-focused UI** with tutorials for harmonic analysis

## Code Style
- Use modern ES6+ features and async/await patterns
- Prefer composition over inheritance
- Use descriptive variable names that reflect musical concepts
- Add JSDoc comments for all public APIs
- Use TypeScript strict mode

## Musical Concepts
- Prioritize accurate intonation and harmonic clarity
- Accompaniment should provide context without imposing interpretation
- Support for various time signatures, polyrhythms, and tempo changes
- Focus on viola practice needs but design for extensibility

## Performance Considerations
- Use Web Audio API scheduling for precise timing
- Implement drift correction for long practice sessions
- Optimize audio buffer management
- Use efficient UI updates for real-time visual feedback
