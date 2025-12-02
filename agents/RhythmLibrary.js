/**
 * RhythmLibrary - Pre-built common rhythm patterns
 * 
 * Organized by category, difficulty, and time signature.
 */

export const RhythmLibrary = {
  // Basic patterns for learning
  basic: {
    name: 'Basic Rhythms',
    patterns: [
      {
        id: 'quarters',
        name: 'Quarter Notes',
        description: 'Four quarter notes per measure',
        timeSignature: [4, 4],
        difficulty: 1,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false }
        ]
      },
      {
        id: 'eighths',
        name: 'Eighth Notes',
        description: 'Eight eighth notes per measure',
        timeSignature: [4, 4],
        difficulty: 1,
        pattern: [
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false }
        ]
      },
      {
        id: 'half-notes',
        name: 'Half Notes',
        description: 'Two half notes per measure',
        timeSignature: [4, 4],
        difficulty: 1,
        pattern: [
          { type: 'note', baseType: 'h', duration: 2, dotted: false },
          { type: 'note', baseType: 'h', duration: 2, dotted: false }
        ]
      }
    ]
  },

  // Dotted rhythms
  dotted: {
    name: 'Dotted Rhythms',
    patterns: [
      {
        id: 'dotted-quarter-eighth',
        name: 'Dotted Quarter + Eighth',
        description: 'Classic dotted rhythm pattern',
        timeSignature: [4, 4],
        difficulty: 2,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false }
        ]
      },
      {
        id: 'dotted-eighth-sixteenth',
        name: 'Dotted Eighth + Sixteenth',
        description: 'Snappy dotted rhythm',
        timeSignature: [4, 4],
        difficulty: 3,
        pattern: [
          { type: 'note', baseType: 'e', duration: 0.75, dotted: true },
          { type: 'note', baseType: 's', duration: 0.25, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.75, dotted: true },
          { type: 'note', baseType: 's', duration: 0.25, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.75, dotted: true },
          { type: 'note', baseType: 's', duration: 0.25, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.75, dotted: true },
          { type: 'note', baseType: 's', duration: 0.25, dotted: false }
        ]
      },
      {
        id: 'reverse-dotted',
        name: 'Reverse Dotted (Scotch Snap)',
        description: 'Sixteenth + dotted eighth',
        timeSignature: [4, 4],
        difficulty: 3,
        pattern: [
          { type: 'note', baseType: 's', duration: 0.25, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.75, dotted: true },
          { type: 'note', baseType: 's', duration: 0.25, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.75, dotted: true },
          { type: 'note', baseType: 's', duration: 0.25, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.75, dotted: true },
          { type: 'note', baseType: 's', duration: 0.25, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.75, dotted: true }
        ]
      }
    ]
  },

  // Syncopation
  syncopation: {
    name: 'Syncopation',
    patterns: [
      {
        id: 'basic-syncopation',
        name: 'Basic Syncopation',
        description: 'Accent on the "and" of beat 2',
        timeSignature: [4, 4],
        difficulty: 2,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false }
        ]
      },
      {
        id: 'offbeat-eighths',
        name: 'Offbeat Eighths',
        description: 'All notes on the "and"',
        timeSignature: [4, 4],
        difficulty: 3,
        pattern: [
          { type: 'rest', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'rest', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'rest', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'rest', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false }
        ]
      },
      {
        id: 'charleston',
        name: 'Charleston Rhythm',
        description: 'Classic jazz syncopation',
        timeSignature: [4, 4],
        difficulty: 3,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'rest', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false }
        ]
      }
    ]
  },

  // Triplets
  triplets: {
    name: 'Triplets',
    patterns: [
      {
        id: 'quarter-triplets',
        name: 'Quarter Note Triplets',
        description: 'Three quarters in the space of two',
        timeSignature: [4, 4],
        difficulty: 3,
        pattern: [
          { type: 'note', baseType: 'q', duration: 2/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'q', duration: 2/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'q', duration: 2/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'h', duration: 2, dotted: false }
        ]
      },
      {
        id: 'eighth-triplets',
        name: 'Eighth Note Triplets',
        description: 'Three eighths in the space of two',
        timeSignature: [4, 4],
        difficulty: 2,
        pattern: [
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 }
        ]
      },
      {
        id: 'triplet-quarter-mix',
        name: 'Triplet + Quarter Mix',
        description: 'Alternating triplets and quarters',
        timeSignature: [4, 4],
        difficulty: 4,
        pattern: [
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'e', duration: 1/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'q', duration: 1, dotted: false }
        ]
      }
    ]
  },

  // Compound meter (6/8)
  compound: {
    name: 'Compound Meter (6/8)',
    patterns: [
      {
        id: 'basic-68',
        name: 'Basic 6/8',
        description: 'Two groups of three',
        timeSignature: [6, 8],
        difficulty: 2,
        pattern: [
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false }
        ]
      },
      {
        id: 'dotted-quarter-68',
        name: 'Dotted Quarters in 6/8',
        description: 'Two dotted quarters',
        timeSignature: [6, 8],
        difficulty: 1,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true }
        ]
      },
      {
        id: 'jig',
        name: 'Jig Pattern',
        description: 'Traditional Irish jig rhythm',
        timeSignature: [6, 8],
        difficulty: 3,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false }
        ]
      }
    ]
  },

  // Odd meters
  oddMeter: {
    name: 'Odd Meters',
    patterns: [
      {
        id: 'basic-54',
        name: 'Basic 5/4 (3+2)',
        description: 'Five beats grouped as 3+2',
        timeSignature: [5, 4],
        difficulty: 3,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false }
        ]
      },
      {
        id: 'take-five',
        name: 'Take Five Pattern',
        description: 'Classic 5/4 jazz groove',
        timeSignature: [5, 4],
        difficulty: 4,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'h', duration: 2, dotted: false }
        ]
      },
      {
        id: 'basic-78',
        name: 'Basic 7/8 (2+2+3)',
        description: 'Seven eighths grouped as 2+2+3',
        timeSignature: [7, 8],
        difficulty: 4,
        pattern: [
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false }
        ]
      }
    ]
  },

  // Latin rhythms
  latin: {
    name: 'Latin Rhythms',
    patterns: [
      {
        id: 'clave-32',
        name: 'Son Clave (3-2)',
        description: 'Afro-Cuban 3-2 clave pattern',
        timeSignature: [4, 4],
        difficulty: 4,
        pattern: [
          // First measure: 3 side
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'barline' },
          // Second measure: 2 side
          { type: 'rest', baseType: 'q', duration: 1, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false },
          { type: 'rest', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true }
        ]
      },
      {
        id: 'bossa-nova',
        name: 'Bossa Nova',
        description: 'Brazilian bossa nova rhythm',
        timeSignature: [4, 4],
        difficulty: 4,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'rest', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.5, dotted: false },
          { type: 'note', baseType: 'q', duration: 1, dotted: false }
        ]
      },
      {
        id: 'tresillo',
        name: 'Tresillo',
        description: 'Fundamental Afro-Cuban pattern (3+3+2)',
        timeSignature: [4, 4],
        difficulty: 3,
        pattern: [
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'q', duration: 1.5, dotted: true },
          { type: 'note', baseType: 'q', duration: 1, dotted: false }
        ]
      }
    ]
  },

  // Polyrhythms
  polyrhythm: {
    name: 'Polyrhythms',
    patterns: [
      {
        id: 'hemiola',
        name: 'Hemiola (3 against 2)',
        description: 'Three in the space of two',
        timeSignature: [4, 4],
        difficulty: 4,
        pattern: [
          { type: 'note', baseType: 'q', duration: 2/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'q', duration: 2/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'q', duration: 2/3, dotted: false, tuplet: 3 },
          { type: 'note', baseType: 'h', duration: 2, dotted: false }
        ]
      },
      {
        id: 'four-against-three',
        name: '4 Against 3',
        description: 'Four in the space of three',
        timeSignature: [3, 4],
        difficulty: 5,
        pattern: [
          { type: 'note', baseType: 'e', duration: 0.375, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.375, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.375, dotted: false },
          { type: 'note', baseType: 'e', duration: 0.375, dotted: false },
          { type: 'note', baseType: 'h', duration: 1.5, dotted: false }
        ]
      }
    ]
  }
};

/**
 * Get all patterns as a flat array
 */
export function getAllPatterns() {
  const all = [];
  for (const category of Object.values(RhythmLibrary)) {
    all.push(...category.patterns);
  }
  return all;
}

/**
 * Get patterns by difficulty
 */
export function getPatternsByDifficulty(difficulty) {
  return getAllPatterns().filter(p => p.difficulty === difficulty);
}

/**
 * Get patterns by time signature
 */
export function getPatternsByTimeSignature(numerator, denominator) {
  return getAllPatterns().filter(p => 
    p.timeSignature[0] === numerator && p.timeSignature[1] === denominator
  );
}

/**
 * Search patterns by name or description
 */
export function searchPatterns(query) {
  const lower = query.toLowerCase();
  return getAllPatterns().filter(p => 
    p.name.toLowerCase().includes(lower) || 
    p.description.toLowerCase().includes(lower)
  );
}
