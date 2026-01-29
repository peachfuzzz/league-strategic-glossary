import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

/**
 * Generates glossaryData.ts from individual markdown files.
 * This script should be run before building the app.
 */

const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/glossaryData.ts');
const TAGS_CONFIG_FILE = path.join(process.cwd(), 'src/config/tags.config.ts');

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  caption?: string;
}

interface TermData {
  id: string;
  term: string;
  definition: string;
  tags: string[];
  links: string[];
  alternates?: string[];
  autoLinks?: string[];
  media?: MediaItem[];
  extensions?: Record<string, any>;
}

interface TagConfig {
  id: string;
  label: string;
  color: string;
  description?: string;
  category?: string;
}

/**
 * Load tag configurations from tags.config.ts
 * We need to dynamically import and parse the TypeScript file.
 */
function loadTagConfigs(): TagConfig[] {
  if (!fs.existsSync(TAGS_CONFIG_FILE)) {
    console.warn('⚠️  Tags config file not found:', TAGS_CONFIG_FILE);
    return [];
  }

  const configContent = fs.readFileSync(TAGS_CONFIG_FILE, 'utf-8');

  // Extract the TAGS array using regex (simple parsing)
  // This works because we control the format of tags.config.ts
  const tagsMatch = configContent.match(/export const TAGS: TagConfig\[\] = (\[[\s\S]*?\n\]);/);

  if (!tagsMatch) {
    console.warn('⚠️  Could not parse TAGS array from config file');
    return [];
  }

  try {
    // Use eval to parse the array (safe since we control the file)
    // eslint-disable-next-line no-eval
    const tags = eval(tagsMatch[1]) as TagConfig[];
    return tags;
  } catch (error) {
    console.error('❌ Error parsing tags config:', error);
    return [];
  }
}

function buildGlossaryData(validTagIds: Set<string>): TermData[] {
  if (!fs.existsSync(TERMS_DIR)) {
    console.error('❌ Terms directory not found:', TERMS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(TERMS_DIR).filter(file => file.endsWith('.md'));

  if (files.length === 0) {
    console.error('❌ No markdown files found in terms directory');
    process.exit(1);
  }

  const invalidTags = new Set<string>();

  const terms: TermData[] = files.map(filename => {
    const filepath = path.join(TERMS_DIR, filename);
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const { data, content } = matter(fileContent);

    if (!data.id || !data.term || !data.tags) {
      throw new Error(`Invalid term file: ${filename}. Missing required frontmatter fields.`);
    }

    // Validate tags
    const tags = Array.isArray(data.tags) ? data.tags : [];
    tags.forEach((tag: string) => {
      if (!validTagIds.has(tag)) {
        invalidTags.add(tag);
      }
    });

    const term: TermData = {
      id: data.id,
      term: data.term,
      definition: content.trim(),
      tags,
      links: Array.isArray(data.links) ? data.links : [],
    };

    if (data.alternates && Array.isArray(data.alternates)) {
      term.alternates = data.alternates;
    }

    if (data.media && Array.isArray(data.media)) {
      term.media = data.media.filter((item: Record<string, unknown>) => {
        if (!item.type || !item.src) {
          console.warn(`⚠️  Invalid media item in ${filename}: missing type or src`);
          return false;
        }
        if (item.type !== 'image' && item.type !== 'video') {
          console.warn(`⚠️  Invalid media type "${item.type}" in ${filename}`);
          return false;
        }
        return true;
      });
    }

    if (data.extensions) {
      term.extensions = data.extensions;
    }

    return term;
  });

  // Report invalid tags
  if (invalidTags.size > 0) {
    console.warn(`\n⚠️  Found ${invalidTags.size} undefined tag(s):`);
    invalidTags.forEach(tag => console.warn(`   - "${tag}"`));
    console.warn(`\n   Add missing tags to src/config/tags.config.ts\n`);
  }

  return terms;
}

/**
 * Removes text wrapped in backticks (escape mechanism for autolinking).
 * Example: "This is `not linked` text" -> "This is  text"
 */
function stripBacktickContent(text: string): string {
  return text.replace(/`[^`]+`/g, '');
}

/**
 * Detects mentions of other terms in each term's definition.
 * Uses whole-word, case-insensitive matching.
 * Also checks for alternate forms (e.g., "OTP" for "one trick").
 * Terms wrapped in backticks are excluded from autolinking.
 */
function detectAutoLinks(terms: TermData[]): void {
  console.log('🔍 Detecting automatic term links...');

  for (const term of terms) {
    const autoLinks: string[] = [];
    // Strip backtick-wrapped content to exclude it from autolinking
    const definitionWithoutEscapes = stripBacktickContent(term.definition);

    for (const otherTerm of terms) {
      // Don't link a term to itself
      if (term.id === otherTerm.id) continue;

      // Don't auto-link if already manually linked
      if (term.links.includes(otherTerm.id)) continue;

      // Check the main term
      const escapedTerm = otherTerm.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedTerm}\\b`, 'i');

      let found = pattern.test(definitionWithoutEscapes);

      // Also check alternate forms
      if (!found && otherTerm.alternates && otherTerm.alternates.length > 0) {
        for (const alternate of otherTerm.alternates) {
          const escapedAlternate = alternate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const altPattern = new RegExp(`\\b${escapedAlternate}\\b`, 'i');
          if (altPattern.test(definitionWithoutEscapes)) {
            found = true;
            break;
          }
        }
      }

      if (found) {
        autoLinks.push(otherTerm.id);
      }
    }

    if (autoLinks.length > 0) {
      term.autoLinks = autoLinks;
      console.log(`  ✓ ${term.term}: found ${autoLinks.length} auto-link(s)`);
    }
  }
}

function generateTypeScriptFile(terms: TermData[], tagConfigs: TagConfig[]): string {
  const termsJson = JSON.stringify(terms, null, 2);

  // Generate tagColors from config
  const tagColorsEntries = tagConfigs
    .map(tag => `  '${tag.id}': '${tag.color}'`)
    .join(',\n');

  return `// THIS FILE IS AUTO-GENERATED
// Do not edit directly. Edit files in src/data/terms/ instead.
// Run 'npm run generate-glossary' to regenerate this file.
// Tag colors are sourced from src/config/tags.config.ts

export interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  caption?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  tags: string[];
  links: string[];        // Manual links from frontmatter
  alternates?: string[];  // Alternate names/forms (e.g., "OTP" for "one trick")
  autoLinks?: string[];   // Auto-detected links from definition text
  media?: MediaItem[];    // Images and videos for the term
  // Extensible for future additions
  extensions?: {
    translations?: Record<string, string>;
    videos?: string[];
    difficulty?: string;
    [key: string]: any;
  };
}

export const glossaryData: GlossaryTerm[] = ${termsJson};

// Tag colors imported from tags.config.ts
export const tagColors: Record<string, string> = {
${tagColorsEntries}
};
`;
}

// Main execution
try {
  console.log('🔨 Building glossary data from markdown files...');

  // Load tag configurations
  console.log('📋 Loading tag configurations...');
  const tagConfigs = loadTagConfigs();
  console.log(`✓ Loaded ${tagConfigs.length} tag configurations`);

  const validTagIds = new Set(tagConfigs.map(t => t.id));

  // Build glossary data with tag validation
  const terms = buildGlossaryData(validTagIds);
  console.log(`✓ Loaded ${terms.length} terms`);

  // Detect automatic links
  detectAutoLinks(terms);

  const tsContent = generateTypeScriptFile(terms, tagConfigs);
  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
  console.log(`✓ Generated ${OUTPUT_FILE}`);

  console.log('✨ Glossary data generated successfully!');
} catch (error) {
  console.error('❌ Error generating glossary data:', error);
  process.exit(1);
}
