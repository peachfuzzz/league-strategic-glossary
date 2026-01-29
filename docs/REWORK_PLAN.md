# League Strategic Glossary - Rework Plan

## Project Context

**What this is:** A Next.js 14+ glossary site for League of Legends strategic terms with two visualization modes (Graph/List) and a progressive discovery system ("Explore" mode).

**Tech stack:** Next.js App Router, TypeScript, Tailwind CSS, HTML5 Canvas for graph rendering, Lucide React icons.

**Design inspiration:** [Infil.net Fighting Game Glossary](https://glossary.infil.net/) - known for video examples, in-line term loading, game filtering, consistent editorial voice.

**Current architecture:**
- Single-page app at `/` with all logic in components
- Terms stored as Markdown in `src/data/terms/*.md`, built to `glossaryData.ts`
- Main orchestrator: `GlossaryGraph.tsx` manages state
- Views: `GraphView.tsx` (canvas), `ListView.tsx` (cards)
- Overlays: `SearchOverlay.tsx`, `HelpCard.tsx`, `TagSidebar.tsx`, `TagFilterDropdown.tsx`
- Config files in `src/config/` for tags, physics, shuffle behavior

**Key user decisions:**
- Primary audience: Studious players wanting formalized concepts; secondary: new players
- Core experience: Explore mode (progressive discovery) > View All ("creative mode")
- Lookup should still be easy for single-term visitors
- Header navigation for new pages (About, Credits, etc.)
- Dedicated term pages with OpenGraph support for sharing
- Media support per definition (images now, video later)
- No video sources currently feasible

---

## Rework Scope

### Phase 1: Page Structure & Navigation
**Goal:** Transform from single-page app to multi-page site with proper routing and navigation.

**Tasks:**
1. Create layout with persistent header navigation
2. Add routes: `/about`, `/credits` (content pages)
3. Add route: `/term/[slug]` (dedicated term pages - see Phase 2)
4. Design header nav component with:
   - Site title/logo linking to home
   - Nav links: Glossary (home), About, Credits
   - Search trigger (Cmd+K indicator)
5. Ensure Explore mode state persists across navigation (already uses localStorage)
6. Footer component with minimal links

**Files to create:**
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/app/about/page.tsx`
- `src/app/credits/page.tsx`

**Files to modify:**
- `src/app/layout.tsx` - add Header/Footer
- `src/app/page.tsx` - adjust for new layout

---

### Phase 2: Dedicated Term Pages
**Goal:** Individual routes for each term with rich OpenGraph support for sharing.

**Tasks:**
1. Create dynamic route `/term/[slug]/page.tsx`
2. Implement `generateStaticParams()` for static generation of all terms
3. Implement `generateMetadata()` for per-term OpenGraph:
   - `og:title` - Term name
   - `og:description` - Definition (truncated)
   - `og:image` - Dynamic OG image (see sub-task)
   - `og:url` - Canonical URL
4. Create OG image generation route `/api/og/[slug]` using `@vercel/og` or similar:
   - Term name prominently displayed
   - Primary tag color as accent
   - Site branding
5. Term page layout:
   - Full definition with inline links
   - Tags (clickable to filter in main glossary)
   - Related terms section
   - Media slot (image/video placeholder)
   - "View in Graph" / "View in List" buttons linking back to main glossary with term selected
   - Navigation to previous/next terms (alphabetically or by connection)
6. Ensure clicking inline term links navigates to that term's page

**Files to create:**
- `src/app/term/[slug]/page.tsx`
- `src/app/api/og/[slug]/route.tsx` (OG image generation)

**Dependencies:** Phase 1 (needs header/layout)

---

### Phase 3: Media Support
**Goal:** Allow images (and future video) per term definition.

**Tasks:**
1. Extend term Markdown frontmatter to support media:
   ```yaml
   media:
     - type: image
       src: /images/terms/wave-management.png
       alt: "Diagram showing wave states"
       caption: "Slow push vs fast push visualization"
     - type: video
       src: https://youtube.com/embed/...
       caption: "Example of freezing a wave"
   ```
2. Update `buildGlossary.ts` to parse media frontmatter
3. Update `GlossaryTerm` interface to include `media?: MediaItem[]`
4. Create `MediaGallery.tsx` component:
   - Displays images/videos below definition
   - Lightbox for image expansion
   - Responsive sizing
5. Integrate into:
   - `GraphView.tsx` info panel (compact view, maybe just first image)
   - `ListView.tsx` cards (thumbnail or indicator)
   - Term detail pages (full gallery)
6. Create `/public/images/terms/` directory structure

**Files to create:**
- `src/components/MediaGallery.tsx`
- `public/images/terms/.gitkeep`

**Files to modify:**
- `src/data/buildGlossary.ts`
- `src/data/glossaryData.ts` (interface)
- `src/components/GraphView.tsx`
- `src/components/ListView.tsx`
- `src/app/term/[slug]/page.tsx`

**Dependencies:** Phase 2 (term pages should exist)

---

### Phase 4: Visual Polish - Graph
**Goal:** Make the graph more visually interesting and informative.

**Tasks:**
1. **Node icons by category** - Replace plain circles with category icons:
   - Map tag categories to Lucide icons (Sword for Combat, Coins for Economy, Map for Macro, etc.)
   - Draw icons inside nodes or as node shape
   - Maintain pie-chart coloring for multi-tag nodes
2. **Improved node rendering:**
   - Slightly larger nodes for terms with more connections (visual importance)
   - Subtle pulse animation on hover
   - Better label backgrounds (rounded, subtle shadow)
3. **Connection line improvements:**
   - Different line styles for manual links vs auto-links
   - Animated dash pattern for undiscovered connections
4. **Background enhancement:**
   - Subtle grid or dot pattern
   - Very faint radial gradient from center
5. **Zoom controls UI** - Add +/- buttons for users unfamiliar with scroll-zoom

**Files to modify:**
- `src/components/GraphView.tsx`
- `src/config/tags.config.ts` (add icon mapping)
- `src/app/globals.css` (if needed)

---

### Phase 5: Visual Polish - General
**Goal:** Improve overall visual identity and reduce blandness.

**Tasks:**
1. **Typography refinement:**
   - Consider a display font for headings (could use Google Fonts)
   - Improve text hierarchy (size, weight, spacing)
2. **Color palette expansion:**
   - Add accent variations for different UI states
   - Ensure sufficient contrast throughout
3. **Card/panel improvements:**
   - Subtle border treatments (not just solid lines)
   - Consider subtle texture or gradient backgrounds
   - Improve shadow hierarchy
4. **Animations/transitions:**
   - Smooth panel open/close
   - List item stagger on load
   - Button hover effects
5. **Header/branding:**
   - Site logo or wordmark
   - Consider League-inspired decorative elements (hextech patterns, etc.)
6. **Loading states:**
   - Skeleton screens for initial load
   - Graceful transitions between views

**Files to modify:**
- `src/app/globals.css`
- `src/app/layout.tsx` (fonts)
- Various component files for animations
- `tailwind.config.ts` (if extending theme)

---

### Phase 6: Explore Mode Enhancements
**Goal:** Make the progressive discovery experience more engaging and rewarding.

**Tasks:**
1. **Discovery breadcrumb trail:**
   - Track the path of discovery: "Last Hit → Minion Waves → Wave Management → ..."
   - Display as horizontal scrollable trail or collapsible history
   - Clicking a crumb re-selects that term
2. **Progress visualization:**
   - Replace or augment "X/Y" counter with visual progress bar
   - Show progress per tag category (mini bars in sidebar)
   - Celebrate milestones: "You've discovered all Economy terms!"
3. **Featured/Starting term improvements:**
   - "Term of the Day" concept - deterministic daily selection
   - Better presentation of the starting term on first load
4. **Discovery animations:**
   - Satisfying animation when a new term is discovered
   - Node "appears" effect in graph when discovered
5. **Sharing discovery progress:**
   - Generate shareable image of progress
   - "I've discovered X% of the glossary" social feature

**Files to modify:**
- `src/components/GlossaryGraph.tsx` (state management)
- `src/components/GraphView.tsx` (animations)
- `src/components/ListView.tsx` (animations)
- New: `src/components/DiscoveryBreadcrumb.tsx`
- New: `src/components/ProgressVisualization.tsx`

---

### Phase 7: List View Improvements
**Goal:** Make List view more useful for scanning and reference.

**Tasks:**
1. **Collapsible definitions:**
   - Show term + tags + first line of definition by default
   - Click to expand full definition
   - "Expand all" toggle
2. **Visual hierarchy:**
   - Differentiate terms by connection count or importance
   - Highlight terms with media
   - Show discovery status more prominently in Explore mode
3. **Sorting options:**
   - Alphabetical (current)
   - By tag/category
   - By connection count
   - Recently discovered (Explore mode)
4. **Compact mode:**
   - Ultra-dense list for quick scanning
   - Just term names, click to expand
5. **Jump-to-letter navigation:**
   - A-Z sidebar or header for quick navigation

**Files to modify:**
- `src/components/ListView.tsx`
- `src/components/GlossaryGraph.tsx` (sorting state)

---

## Session Execution Guide

Each phase is designed to be completable in a single Opus 4.5 session. When starting a session:

1. **Read this document** to understand context
2. **Read CLAUDE.md** for technical details
3. **Check current state** - previous phases may have been completed
4. **Focus on one phase** - don't scope-creep
5. **Test thoroughly** - run `npm run dev` and verify changes
6. **Update this document** - mark phase as complete, note any deviations

### Phase Dependencies
```
Phase 1 (Page Structure)
    ↓
Phase 2 (Term Pages) ← requires routing
    ↓
Phase 3 (Media) ← requires term pages

Phase 4 (Graph Visual) ← independent
Phase 5 (General Visual) ← independent
Phase 6 (Explore Mode) ← independent
Phase 7 (List View) ← independent
```

Phases 4-7 can be done in any order after Phase 1-3, or even in parallel with them.

### Recommended Order
1. Phase 1 - Foundation for everything else
2. Phase 2 - High-impact feature (sharing/SEO)
3. Phase 5 - General visual polish (affects everything)
4. Phase 4 - Graph-specific polish
5. Phase 6 - Explore mode enhancements
6. Phase 3 - Media support (when content is ready)
7. Phase 7 - List view (lower priority)

---

## Completion Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Page Structure | Complete | Header/Footer in layout, glossary toolbar separated, /about + /credits pages |
| 2. Term Pages | Complete | /term/[slug] with generateStaticParams, OG meta tags, inline links, related/back links, prev/next nav. OG image generation deferred (needs server runtime). |
| 3. Media Support | Complete | MediaItem type, MediaGallery component (full + compact + lightbox), integrated into TermPageContent/GraphView/ListView. Media parsed from frontmatter. Sample entry on slow-push term. |
| 4. Graph Visual | Not started | |
| 5. General Visual | Complete | Cinzel serif display font, dark scrollbar, gold accent CSS variables, gold gradient header/footer borders, card-hover/btn-ghost/section-heading utilities, fade-in animations on overlays, h1 size bump, gold selection color. |
| 6. Explore Mode | Not started | |
| 7. List View | Not started | |

---

## Open Questions

- [ ] What content should go on About page? (project history, purpose, author info?)
      project history in the form of an essay, link (maybe aesthetically or functionally interest) to my personal blog at steffnstuff.com
- [ ] What content should go on Credits page? (contributors, data sources, tech stack?)
      contributors, including ways to link to them
- [ ] Site name/branding - is "League Strategic Glossary" the final name?
      not final name, branding is still a little up in the air but i want it to borrow League's color styles. ideally, the site should feel like a real reference tool but not dry
- [ ] Domain - where will this be hosted? (affects OG image URLs)
      https://glossary.steffnstuff.com/
- [ ] Analytics - add tracking? (Plausible, Vercel Analytics, etc.)
   it would be cool but i haven't really considered the implications. if a skeleton backend for analytics doesn't take a significant amount of extra work to add, then it would be cool. otherwise, somewhat out of scope for my vision (but mostly because i didn't consider the possibility)
