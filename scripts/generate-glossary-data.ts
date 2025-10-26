import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

/**
 * Generates glossaryData.ts from individual markdown files.
 * This script should be run before building the app.
 */

const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');
const OUTPUT_FILE = path.join(process.cwd(), 'src/data/glossaryData.ts');

interface TermData {
  id: string;
  term: string;
  definition: string;
  tags: string[];
  links: string[];
  autoLinks?: string[];
  extensions?: Record<string, any>;
}

function buildGlossaryData(): TermData[] {
  if (!fs.existsSync(TERMS_DIR)) {
    console.error('❌ Terms directory not found:', TERMS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(TERMS_DIR).filter(file => file.endsWith('.md'));

  if (files.length === 0) {
    console.error('❌ No markdown files found in terms directory');
    process.exit(1);
  }

  const terms: TermData[] = files.map(filename => {
    const filepath = path.join(TERMS_DIR, filename);
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const { data, content } = matter(fileContent);

    if (!data.id || !data.term || !data.tags || !data.links) {
      throw new Error(`Invalid term file: ${filename}. Missing required frontmatter fields.`);
    }

    const term: TermData = {
      id: data.id,
      term: data.term,
      definition: content.trim(),
      tags: Array.isArray(data.tags) ? data.tags : [],
      links: Array.isArray(data.links) ? data.links : [],
    };

    if (data.extensions) {
      term.extensions = data.extensions;
    }

    return term;
  });

  return terms;
}

/**
 * Detects mentions of other terms in each term's definition.
 * Uses whole-word, case-insensitive matching.
 */
function detectAutoLinks(terms: TermData[]): void {
  console.log('🔍 Detecting automatic term links...');

  for (const term of terms) {
    const autoLinks: string[] = [];
    const lowerDefinition = term.definition.toLowerCase();

    for (const otherTerm of terms) {
      // Don't link a term to itself
      if (term.id === otherTerm.id) continue;

      // Don't auto-link if already manually linked
      if (term.links.includes(otherTerm.id)) continue;

      // Create a regex that matches the term as a whole word (case-insensitive)
      // Escape special regex characters in the term
      const escapedTerm = otherTerm.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedTerm}\\b`, 'i');

      if (pattern.test(term.definition)) {
        autoLinks.push(otherTerm.id);
      }
    }

    if (autoLinks.length > 0) {
      term.autoLinks = autoLinks;
      console.log(`  ✓ ${term.term}: found ${autoLinks.length} auto-link(s)`);
    }
  }
}

function generateTypeScriptFile(terms: TermData[]): string {
  const termsJson = JSON.stringify(terms, null, 2);

  return `// THIS FILE IS AUTO-GENERATED
// Do not edit directly. Edit files in src/data/terms/ instead.
// Run 'npm run generate-glossary' to regenerate this file.

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  tags: string[];
  links: string[];        // Manual links from frontmatter
  autoLinks?: string[];   // Auto-detected links from definition text
  // Extensible for future additions
  extensions?: {
    translations?: Record<string, string>;
    videos?: string[];
    difficulty?: string;
    [key: string]: any;
  };
}

export const glossaryData: GlossaryTerm[] = ${termsJson};

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
`;
}

// Main execution
try {
  console.log('🔨 Building glossary data from markdown files...');
  const terms = buildGlossaryData();
  console.log(`✓ Loaded ${terms.length} terms`);

  // Detect automatic links
  detectAutoLinks(terms);

  const tsContent = generateTypeScriptFile(terms);
  fs.writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
  console.log(`✓ Generated ${OUTPUT_FILE}`);

  console.log('✨ Glossary data generated successfully!');
} catch (error) {
  console.error('❌ Error generating glossary data:', error);
  process.exit(1);
}
