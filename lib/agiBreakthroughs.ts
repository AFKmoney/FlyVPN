export interface Breakthrough {
  id: string;
  category: 'External' | 'Internal' | 'Stealth';
  name: string;
  concept: string;
  usage: string;
}

export const AGI_BREAKTHROUGHS: Breakthrough[] = [
  // PART A: EXTERNAL BREAKTHROUGHS
  {
    id: 'adafire',
    category: 'External',
    name: 'Adaptive-Firing SNNs (AdaFire)',
    concept: 'Neurons that adjust their firing threshold dynamically based on recent activity.',
    usage: 'Bootstrap "attention" energy. If a concept is frequent, it becomes easier to trigger.'
  },
  {
    id: 'hdc-causal',
    category: 'External',
    name: 'Hyperdimensional Causal Inference',
    concept: 'Encoding causal graphs into hypervectors (Effect = Cause * Transformation).',
    usage: 'Infer "Hi" -> "Greeting" via causal pairing.'
  },
  {
    id: 'lsm-edge',
    category: 'External',
    name: 'Liquid State Machines (LSM) on Edge',
    concept: 'Randomly connected "reservoirs" that fade over time.',
    usage: 'Short-term conversational memory that doesn\'t need training.'
  },
  {
    id: 'zero-shot-relational',
    category: 'External',
    name: 'Zero-Shot Relational Reasoning',
    concept: 'Using abstract relation vectors rather than object recognition.',
    usage: 'Understand "X is Y" structure even if X and Y are unknown.'
  },
  {
    id: 'sdm-reimagined',
    category: 'External',
    name: 'Sparse Distributed Memory (SDM) Re-imagined',
    concept: 'Kanerva\'s SDM acting as a "clean-up" memory for noisy inputs.',
    usage: 'Auto-correct "helo" to "hello" via Hamming distance.'
  },
  {
    id: 'geometric-dl',
    category: 'External',
    name: 'Geometric Deep Learning',
    concept: 'Forcing data onto a specific manifold (e.g., sphere).',
    usage: '"Semantic Gravity" - related concepts naturally slide together.'
  },
  {
    id: 'active-inference',
    category: 'External',
    name: 'Active Inference for Language',
    concept: 'Language as belief updating.',
    usage: '"What?" is not a query; it is a free energy minimization action.'
  },
  {
    id: 'clip-text-only',
    category: 'External',
    name: 'CLIP without Images',
    concept: 'Contrastive learning on text pairs only.',
    usage: 'Learning synonyms by their interchangeable context.'
  },
  {
    id: 'spikformer',
    category: 'External',
    name: 'Spiking Transformers (Spikformer)',
    concept: 'Transformer architecture using binary spikes.',
    usage: '100x energy reduction for attention mechanisms.'
  },
  {
    id: 'neuro-symbolic-vector',
    category: 'External',
    name: 'Neuro-Symbolic Vector Logic',
    concept: 'Combining logic gates with vector superposition.',
    usage: 'Hard constraints (/not) integrated with soft associations.'
  },

  // PART B: INTERNAL NOVEL BREAKTHROUGHS
  {
    id: 'semantic-resonance',
    category: 'Internal',
    name: 'Semantic Resonance Fields',
    concept: 'Words are frequencies. "Hi" and "Hello" vibrate at the same frequency.',
    usage: 'Unknown words result in "dissonance" (Heat).'
  },
  {
    id: 'holographic-linguistics',
    category: 'Internal',
    name: 'Holographic Linguistics',
    concept: 'A sentence is an interference pattern.',
    usage: 'Fractal Context - reconstruct the whole conversation from any part.'
  },
  {
    id: 'thermodynamic-ontology',
    category: 'Internal',
    name: 'Thermodynamic Ontology Bootstrapping',
    concept: 'Concepts have Mass (Importance) and Charge (Sentiment).',
    usage: 'Pre-load a "Physics of Meaning". "Fire" = High Mass, High Charge.'
  },
  {
    id: 'negative-space-semantics',
    category: 'Internal',
    name: 'Negative Space Semantics',
    concept: 'Define concepts by what they are NOT.',
    usage: 'Rapidly carve concepts out of the void. "Cat = NOT(Dog) * NOT(Car)".'
  },
  {
    id: 'concept-gravity',
    category: 'Internal',
    name: 'Concept Gravity',
    concept: 'Physics engine where concepts attract in vector space.',
    usage: 'Dynamic association - "Fire" pulls "Hot" closer for 10 seconds.'
  },
  {
    id: 'genesis-vector',
    category: 'Internal',
    name: 'The "Genesis" Vector',
    concept: 'Seed vector containing the "DNA" of English grammar.',
    usage: 'Force all inputs to align with Subject-Verb-Object template.'
  },
  {
    id: 'temporal-folding',
    category: 'Internal',
    name: 'Temporal Folding',
    concept: 'Folding time (history) into space (dimensions).',
    usage: 'Fold last 10 turns into the first 1000 dimensions of current state.'
  },
  {
    id: 'quantum-ambiguity',
    category: 'Internal',
    name: 'Quantum Ambiguity',
    concept: 'Using complex numbers in HDC (a + bi).',
    usage: 'Real part = definition; Imaginary part = contextual nuance.'
  },
  {
    id: 'active-parsing-saccades',
    category: 'Internal',
    name: 'Active Parsing Saccades',
    concept: 'Look at most energetic word first, then structure around it.',
    usage: 'Don\'t read left-to-right. Identify "FIRE" first, then context.'
  },
  {
    id: 'liquid-knowledge-graph',
    category: 'Internal',
    name: 'Liquid Knowledge Graph',
    concept: 'Edges that evaporate if not reinforced.',
    usage: 'Prevents false knowledge accumulation by dissolving weak links.'
  },

  // PART C: STEALTH DEEPTECH
  {
    id: 'optical-fourier-memory',
    category: 'Stealth',
    name: 'Optical Fourier Memory (The "Hologram")',
    concept: 'Use FFT to perform "Instant Convolution".',
    usage: 'O(1) binding of large context windows via light-wave interference.'
  },
  {
    id: 'dna-logic-gates',
    category: 'Stealth',
    name: 'DNA Logic Gates (Strand Displacement)',
    concept: 'Chemical reactions for concept association.',
    usage: 'If "Fire" is present, it chemically burns "Wood" vector into "Ash".'
  },
  {
    id: 'memristive-reservoirs',
    category: 'Stealth',
    name: 'Memristive Reservoirs ("Liquid Time")',
    concept: 'State vector with physical hysteresis (remembers history).',
    usage: 'Simulate Resistance Drift. Frequent concepts become "conductive".'
  },
  {
    id: 'spintronic-neural-states',
    category: 'Stealth',
    name: 'Spintronic Neural States ("Spin Glass")',
    concept: 'Concepts have "Spin" (Up/Down) that align/anti-align.',
    usage: 'AGI state is a "Magnetic Field". Solutions are lowest energy states.'
  },
  {
    id: 'single-flux-quantum',
    category: 'Stealth',
    name: 'Single-Flux-Quantum Logic',
    concept: 'Pulse-based logic with no continuous values.',
    usage: 'Extreme speed optimization. Concepts are encoded as "Pulse Trains".'
  }
];
