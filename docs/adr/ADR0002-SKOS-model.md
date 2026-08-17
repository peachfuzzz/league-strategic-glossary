---
date: 2026-08-17 14:36:14
---

Adopting the SKOS standard to organize the glossary.

## Problem

Terms and pages are the same thing, with the specific word being defined also serving as the name of the page. Currently, all terms must have unique names, and any ideas sharing a single name require workarounds. 

## Rationale
- ambiguous (polysemic) words are difficult to name if the term name is the page name
- relations don't convey much meaning beyond connectedness
- links are fragile since they rely on the term label

## Pros
- someone already worked on the SKOS vocabulary so i don't need to build the whole structure from scratch
- separates concepts and labels
- adds more specific semantic relations

## Cons
- requires significant rewiring of the existing link structure (needs to be torn down almost completely)