#!/usr/bin/env tsx
/**
 * Tag Management CLI Tool
 *
 * Usage:
 *   npm run manage-tags list           # List all defined tags
 *   npm run manage-tags usage          # Show tag usage statistics
 *   npm run manage-tags unused         # Show unused tags
 *   npm run manage-tags undefined      # Show undefined tags used in terms
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const TAGS_CONFIG_FILE = path.join(process.cwd(), 'src/data/tags.config.ts');
const TERMS_DIR = path.join(process.cwd(), 'src/data/terms');

interface TagConfig {
  id: string;
  label: string;
  color: string;
  description?: string;
  category?: string;
}

/**
 * Load tag configurations from tags.config.ts
 */
function loadTagConfigs(): TagConfig[] {
  if (!fs.existsSync(TAGS_CONFIG_FILE)) {
    console.error('❌ Tags config file not found:', TAGS_CONFIG_FILE);
    process.exit(1);
  }

  const configContent = fs.readFileSync(TAGS_CONFIG_FILE, 'utf-8');
  const tagsMatch = configContent.match(/export const TAGS: TagConfig\[\] = (\[[\s\S]*?\n\]);/);

  if (!tagsMatch) {
    console.error('❌ Could not parse TAGS array from config file');
    process.exit(1);
  }

  try {
    // eslint-disable-next-line no-eval
    const tags = eval(tagsMatch[1]) as TagConfig[];
    return tags;
  } catch (error) {
    console.error('❌ Error parsing tags config:', error);
    process.exit(1);
  }
}

/**
 * Get all tags used in markdown files
 */
function getUsedTags(): Map<string, number> {
  const tagUsage = new Map<string, number>();

  if (!fs.existsSync(TERMS_DIR)) {
    console.error('❌ Terms directory not found:', TERMS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(TERMS_DIR).filter(file => file.endsWith('.md'));

  files.forEach(filename => {
    const filepath = path.join(TERMS_DIR, filename);
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const { data } = matter(fileContent);

    if (data.tags && Array.isArray(data.tags)) {
      data.tags.forEach((tag: string) => {
        tagUsage.set(tag, (tagUsage.get(tag) || 0) + 1);
      });
    }
  });

  return tagUsage;
}

/**
 * Display all defined tags
 */
function listTags() {
  const tags = loadTagConfigs();

  console.log('\n📋 Defined Tags\n');
  console.log('═'.repeat(80));

  const grouped = new Map<string, TagConfig[]>();
  tags.forEach(tag => {
    const category = tag.category || 'Uncategorized';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(tag);
  });

  grouped.forEach((categoryTags, category) => {
    console.log(`\n${category}:`);
    categoryTags.forEach(tag => {
      const colorPreview = `\x1b[48;2;${hexToRgb(tag.color)}m  \x1b[0m`;
      console.log(`  ${colorPreview} ${tag.id.padEnd(25)} ${tag.label}`);
      if (tag.description) {
        console.log(`     ${tag.description}`);
      }
    });
  });

  console.log('\n' + '═'.repeat(80));
  console.log(`Total: ${tags.length} tags\n`);
}

/**
 * Show tag usage statistics
 */
function showUsage() {
  const definedTags = loadTagConfigs();
  const usedTags = getUsedTags();

  console.log('\n📊 Tag Usage Statistics\n');
  console.log('═'.repeat(80));

  const tagMap = new Map(definedTags.map(t => [t.id, t]));
  const sortedUsage = Array.from(usedTags.entries()).sort((a, b) => b[1] - a[1]);

  sortedUsage.forEach(([tagId, count]) => {
    const tag = tagMap.get(tagId);
    const label = tag ? tag.label : '(undefined)';
    const color = tag ? tag.color : '#64748b';
    const colorPreview = `\x1b[48;2;${hexToRgb(color)}m  \x1b[0m`;

    console.log(`  ${colorPreview} ${tagId.padEnd(25)} ${String(count).padStart(3)} terms - ${label}`);
  });

  console.log('\n' + '═'.repeat(80));
  console.log(`Total: ${sortedUsage.length} tags in use\n`);
}

/**
 * Show unused tags (defined but not used in any terms)
 */
function showUnused() {
  const definedTags = loadTagConfigs();
  const usedTags = getUsedTags();

  const unused = definedTags.filter(tag => !usedTags.has(tag.id));

  console.log('\n🔍 Unused Tags\n');
  console.log('═'.repeat(80));

  if (unused.length === 0) {
    console.log('\n✓ All defined tags are being used!\n');
  } else {
    unused.forEach(tag => {
      const colorPreview = `\x1b[48;2;${hexToRgb(tag.color)}m  \x1b[0m`;
      console.log(`  ${colorPreview} ${tag.id.padEnd(25)} ${tag.label}`);
    });
    console.log('\n' + '═'.repeat(80));
    console.log(`Total: ${unused.length} unused tags\n`);
  }
}

/**
 * Show undefined tags (used in terms but not defined in config)
 */
function showUndefined() {
  const definedTags = new Set(loadTagConfigs().map(t => t.id));
  const usedTags = getUsedTags();

  const undefined = Array.from(usedTags.keys()).filter(tag => !definedTags.has(tag));

  console.log('\n⚠️  Undefined Tags\n');
  console.log('═'.repeat(80));

  if (undefined.length === 0) {
    console.log('\n✓ All used tags are properly defined!\n');
  } else {
    undefined.forEach(tag => {
      const count = usedTags.get(tag) || 0;
      console.log(`  ${tag.padEnd(25)} ${String(count).padStart(3)} terms`);
    });
    console.log('\n' + '═'.repeat(80));
    console.log(`Total: ${undefined.length} undefined tags\n`);
    console.log('Add these tags to src/data/tags.config.ts\n');
  }
}

/**
 * Convert hex color to RGB string for terminal colors
 */
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r};${g};${b}`;
}

// Main CLI
const command = process.argv[2] || 'list';

switch (command) {
  case 'list':
    listTags();
    break;
  case 'usage':
    showUsage();
    break;
  case 'unused':
    showUnused();
    break;
  case 'undefined':
    showUndefined();
    break;
  default:
    console.log(`
Tag Management CLI

Usage:
  npm run manage-tags list           # List all defined tags
  npm run manage-tags usage          # Show tag usage statistics
  npm run manage-tags unused         # Show unused tags
  npm run manage-tags undefined      # Show undefined tags used in terms
    `);
}
