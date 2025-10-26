import * as fs from 'fs';
import * as path from 'path';
import { glossaryData } from '../src/data/glossaryData';

/**
 * Migration script to convert the single glossaryData.ts file
 * into individual markdown files with frontmatter.
 */

const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');

// Ensure the terms directory exists
if (!fs.existsSync(TERMS_DIR)) {
  fs.mkdirSync(TERMS_DIR, { recursive: true });
}

// Convert each term to a markdown file
glossaryData.forEach(term => {
  const frontmatter = {
    id: term.id,
    term: term.term,
    tags: term.tags,
    links: term.links,
  };

  // Add extensions if they exist
  if (term.extensions && Object.keys(term.extensions).length > 0) {
    Object.assign(frontmatter, { extensions: term.extensions });
  }

  // Build the markdown content
  const yamlFrontmatter = [
    '---',
    `id: ${term.id}`,
    `term: ${term.term}`,
    `tags: [${term.tags.join(', ')}]`,
    `links: [${term.links.join(', ')}]`,
  ];

  if (term.extensions && Object.keys(term.extensions).length > 0) {
    yamlFrontmatter.push(`extensions: ${JSON.stringify(term.extensions)}`);
  }

  yamlFrontmatter.push('---', '', term.definition);

  const content = yamlFrontmatter.join('\n');
  const filename = `${term.id}.md`;
  const filepath = path.join(TERMS_DIR, filename);

  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`✓ Created ${filename}`);
});

console.log(`\n✨ Successfully migrated ${glossaryData.length} terms to markdown files!`);
console.log(`📁 Location: ${TERMS_DIR}`);
