/**
 * Central Tag Configuration
 *
 * This is the single source of truth for all glossary tags.
 * Tags defined here will be:
 * - Validated during build (warns if terms use undefined tags)
 * - Used to generate tag colors and metadata
 * - Available for tag management UI
 *
 * To add a new tag:
 * 1. Add it to this file with a color and description
 * 2. Rebuild the glossary (npm run generate-glossary)
 * 3. Use it in your term markdown files
 */

export interface TagConfig {
  id: string;           // Kebab-case identifier (matches what's in markdown)
  label: string;        // Display name
  color: string;        // Hex color for graph nodes
  description?: string; // What this tag represents
  category?: string;    // Optional grouping (e.g., "Content Type", "Game System")
}

/**
 * All available tags for the glossary.
 * Add new tags here to make them available throughout the app.
 */
export const TAGS: TagConfig[] = [
  // Content Organization
  {
    id: 'abstract-concepts',
    label: 'Abstract Concepts',
    color: '#ec4899',  // Pink
    description: 'High-level ideas that span multiple systems',
    category: 'Content Type'
  },
  {
    id: 'vernacular',
    label: 'Vernacular',
    color: '#8b5cf6',  // Purple
    description: 'Common terminology and slang used by players',
    category: 'Content Type'
  },
  {
    id: 'strategy',
    label: 'Strategy',
    color: '#3b82f6',  // Blue
    description: 'Things related to winning the game',
    category: 'Content Type'
  },
  {
    id: 'game-mechanics',
    label: 'Game Mechanics',
    color: '#06b6d4',  // Cyan
    description: 'Base game mechanics and rules',
    category: 'Content Type'
  },

  // Game Systems
  {
    id: 'economy',
    label: 'Economy',
    color: '#f59e0b',  // Amber
    description: '',
    category: 'Game System'
  },
  {
    id: 'vision',
    label: 'Vision',
    color: '#6366f1',  // Indigo
    description: '',
    category: 'Game System'
  },
  {
    id: 'minions',
    label: 'Minions',
    color: '#a855f7',  // Purple
    description: 'Minion waves and wave management',
    category: 'Game System'
  },

  // Game Elements
  {
    id: 'jungle',
    label: 'Jungle',
    color: '#059669',  // Emerald
    description: 'Jungle-specific concepts',
    category: 'Game Element'
  },
  {
    id: 'item',
    label: 'Item',
    color: '#f97316',  // Orange
    description: '',
    category: 'Game Element'
  },
];

/**
 * Get tag configuration by ID.
 */
export function getTagConfig(tagId: string): TagConfig | undefined {
  return TAGS.find(tag => tag.id === tagId);
}

/**
 * Get all tag IDs.
 */
export function getAllTagIds(): string[] {
  return TAGS.map(tag => tag.id);
}

/**
 * Get tag color by ID (returns default gray if not found).
 */
export function getTagColor(tagId: string): string {
  const tag = getTagConfig(tagId);
  return tag?.color || '#64748b';
}

/**
 * Get tags grouped by category.
 */
export function getTagsByCategory(): Record<string, TagConfig[]> {
  const grouped: Record<string, TagConfig[]> = {};

  TAGS.forEach(tag => {
    const category = tag.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(tag);
  });

  return grouped;
}

/**
 * Validate that a tag ID exists in the configuration.
 */
export function isValidTag(tagId: string): boolean {
  return TAGS.some(tag => tag.id === tagId);
}

/**
 * Generate color map for legacy compatibility.
 * This is used by existing components that expect a Record<string, string>.
 */
export function getTagColorMap(): Record<string, string> {
  const colorMap: Record<string, string> = {};
  TAGS.forEach(tag => {
    colorMap[tag.id] = tag.color;
  });
  return colorMap;
}
