import * as fs from 'fs';
import * as path from 'path';

import { vocabIndex, type Concept } from './vocab';

/**
 * Server-only access to the per-concept artifacts.
 *
 * Kept out of `vocab.ts` because that module is imported by client components;
 * pulling `fs` into their graph breaks the browser bundle.
 */

const CONCEPTS_DIR = path.join(process.cwd(), 'src/data/generated/concepts');

export function getConcept(id: string): Concept | null {
  const file = path.join(CONCEPTS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as Concept;
}

export function getConceptBySlug(slug: string): Concept | null {
  const entry = vocabIndex.find((e) => e.slug === slug);
  return entry ? getConcept(entry.id) : null;
}
