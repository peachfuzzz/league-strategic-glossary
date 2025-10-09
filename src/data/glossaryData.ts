export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  tags: string[];
  links: string[];
  // Extensible for future additions
  extensions?: {
    translations?: Record<string, string>;
    videos?: string[];
    difficulty?: string;
    [key: string]: any;
  };
}

export const glossaryData: GlossaryTerm[] = [
  {
    id: 'last-hit',
    term: 'Last Hit',
    definition: 'Delivering the killing blow to a minion or monster to gain gold and experience.',
    tags: ['minion', 'strategy', 'fundamentals'],
    links: ['cs', 'gold', 'minion']
  },
  {
    id: 'cs',
    term: 'CS',
    definition: 'The total number of minions and monsters a player has killed.',
    tags: ['minion', 'stat', 'fundamentals'],
    links: ['last-hit', 'gold', 'minion']
  },
  {
    id: 'gold',
    term: 'Gold',
    definition: 'The primary currency used to purchase items in the shop.',
    tags: ['economy', 'fundamentals'],
    links: ['last-hit', 'cs', 'shop', 'item']
  },
  {
    id: 'gank',
    term: 'Gank',
    definition: 'When one HELLO or more champions leave their lane to surprise attack an enemy.',
    tags: ['strategy', 'jungle', 'abstract-concept'],
    links: ['jungle', 'lane', 'ward', 'roam']
  },
  {
    id: 'ward',
    term: 'Ward',
    definition: 'An item that provides vision in a specific area.',
    tags: ['item', 'vision', 'strategy'],
    links: ['vision', 'gank', 'jungle']
  },
  {
    id: 'jungle',
    term: 'Jungle',
    definition: 'The area between lanes containing neutral monsters.',
    tags: ['role', 'map', 'fundamentals'],
    links: ['gank', 'buff', 'smite', 'ward']
  },
  {
    id: 'minion',
    term: 'Minion',
    definition: 'AI-controlled units that spawn in waves.',
    tags: ['minion', 'fundamentals'],
    links: ['last-hit', 'cs', 'lane', 'wave']
  },
  {
    id: 'lane',
    term: 'Lane',
    definition: 'One of three primary paths on the map.',
    tags: ['map', 'fundamentals'],
    links: ['minion', 'gank', 'wave', 'roam']
  },
  {
    id: 'roam',
    term: 'Roam',
    definition: 'Leaving your lane to assist teammates.',
    tags: ['strategy', 'abstract-concept'],
    links: ['gank', 'lane', 'map-awareness']
  },
  {
    id: 'vision',
    term: 'Vision',
    definition: 'Sight of areas on the map.',
    tags: ['strategy', 'fundamentals'],
    links: ['ward', 'map-awareness', 'jungle']
  },
  {
    id: 'map-awareness',
    term: 'Map Awareness',
    definition: 'Keeping track of enemy and ally positions.',
    tags: ['strategy', 'abstract-concept'],
    links: ['vision', 'ward', 'roam']
  },
  {
    id: 'buff',
    term: 'Buff',
    definition: 'Temporary enhancement or neutral monster that grants one.',
    tags: ['jungle', 'strategy'],
    links: ['jungle', 'smite']
  },
  {
    id: 'smite',
    term: 'Smite',
    definition: 'Summoner spell that deals true damage to monsters.',
    tags: ['summoner-spell', 'jungle'],
    links: ['jungle', 'buff']
  },
  {
    id: 'wave',
    term: 'Wave',
    definition: 'A group of minions that spawn together.',
    tags: ['minion', 'strategy'],
    links: ['minion', 'lane', 'last-hit']
  },
  {
    id: 'shop',
    term: 'Shop',
    definition: 'Where players purchase items with gold.',
    tags: ['economy', 'fundamentals'],
    links: ['gold', 'item']
  },
  {
    id: 'item',
    term: 'Item',
    definition: 'Equipment that enhances champion stats and abilities.',
    tags: ['item', 'fundamentals'],
    links: ['gold', 'shop']
  },
  {
    id: 'summoner-spell',
    term: 'Summoner Spell',
    definition: 'Special abilities chosen before the game starts.',
    tags: ['summoner-spell', 'fundamentals'],
    links: ['smite']
  }
];

export const tagColors: Record<string, string> = {
  'minion': '#a855f7',
  'strategy': '#3b82f6',
  'fundamentals': '#10b981',
  'stat': '#eab308',
  'economy': '#f59e0b',
  'jungle': '#059669',
  'abstract-concept': '#ec4899',
  'item': '#f97316',
  'vision': '#6366f1',
  'role': '#06b6d4',
  'map': '#14b8a6',
  'summoner-spell': '#d946ef'
};

export const tagColorClasses: Record<string, string> = {
  'minion': 'bg-purple-600',
  'strategy': 'bg-blue-600',
  'fundamentals': 'bg-green-600',
  'stat': 'bg-yellow-600',
  'economy': 'bg-amber-600',
  'jungle': 'bg-emerald-600',
  'abstract-concept': 'bg-pink-600',
  'item': 'bg-orange-600',
  'vision': 'bg-indigo-600',
  'role': 'bg-cyan-600',
  'map': 'bg-teal-600',
  'summoner-spell': 'bg-fuchsia-600'
};