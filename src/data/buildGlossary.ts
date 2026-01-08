import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { GlossaryTerm } from './glossaryData';
import { isValidTag, getAllTagIds } from '@/config/tags.config';

/**
 * Reads all markdown files from src/data/terms/ and builds
 * the glossaryData array with type safety.
 */
export function buildGlossaryData(): GlossaryTerm[] {
  const termsDir = path.join(process.cwd(), 'src/data/terms');

  // Check if directory exists
  if (!fs.existsSync(termsDir)) {
    console.warn('⚠️  Terms directory not found:', termsDir);
    return [];
  }

  // Read all .md files
  const files = fs.readdirSync(termsDir).filter(file => file.endsWith('.md'));

  if (files.length === 0) {
    console.warn('⚠️  No markdown files found in terms directory');
    return [];
  }

  // Track invalid tags for reporting
  const invalidTags = new Set<string>();
  const validTagIds = getAllTagIds();

  const terms: GlossaryTerm[] = files.map(filename => {
    const filepath = path.join(termsDir, filename);
    const fileContent = fs.readFileSync(filepath, 'utf-8');

    // Parse frontmatter and content
    const { data, content } = matter(fileContent);

    // Validate required fields
    if (!data.id || !data.term || !data.tags) {
      throw new Error(`Invalid term file: ${filename}. Missing required frontmatter fields.`);
    }

    // Validate tags
    const tags = Array.isArray(data.tags) ? data.tags : [];
    tags.forEach((tag: string) => {
      if (!isValidTag(tag)) {
        invalidTags.add(tag);
        console.warn(`⚠️  Unknown tag "${tag}" in ${filename}`);
      }
    });

    // Build the term object
    const term: GlossaryTerm = {
      id: data.id,
      term: data.term,
      definition: content.trim(),
      tags,
      links: Array.isArray(data.links) ? data.links : [],
    };

    // Add alternates if present
    if (data.alternates && Array.isArray(data.alternates)) {
      term.alternates = data.alternates;
    }

    // Add extensions if present
    if (data.extensions) {
      term.extensions = data.extensions;
    }

    return term;
  });

  console.log(`✓ Loaded ${terms.length} terms from markdown files`);

  // Report tag validation results
  if (invalidTags.size > 0) {
    console.warn(`\n⚠️  Found ${invalidTags.size} undefined tag(s):`);
    invalidTags.forEach(tag => console.warn(`   - "${tag}"`));
    console.warn(`\n   Defined tags: ${validTagIds.join(', ')}`);
    console.warn(`   Add missing tags to src/data/tags.config.ts\n`);
  }

  return terms;
}
