

## Footer Redesign

Replicate the three-part footer structure from the Outer Sunset Guide project, adapted to this site's color scheme and without the i18n layer.

### Structure (3 sections, bottom of Index.tsx)

**1. Sibling Sites Board** (replaces nothing -- new section after newsletter)
- Cork-textured background using the site's muted/secondary palette
- Heading: "Neighborhood tools made by us, for us"
- 4 pinned cards in a grid, each with a question, site name, and domain:
  - "Live near 48th and Irving?" -- Cozy Corner Neighbor Hub -- cozycorner.place
  - "Exploring the neighborhood?" -- Outer Sunset Field Guide -- outersunset.place
  - "Want to share things with neighbors?" -- Community Supplies -- communitysupplies.org
  - "Curious what's happening today?" -- Outer Sunset Today -- outersunset.today
- Each card has a 3D pushpin, slight rotation, hover lift effect
- Card background colors adapted to use this site's palette (muted cream, light blue, warm tan, sage green from the CSS variables)

**2. Credits Footer**
- "Made by neighbors, with neighbors, for neighbors"
- "Remix this for your neighborhood" linking to studio.relationaltechproject.org
- Below that: "Privacy and Terms" linking to /privacy-terms

**3. Site Links Footer** (small, subtle)
- "Are you a helpful bot?" linking to /llm.txt (if route exists, otherwise skip)

### Files to modify

- **`src/pages/Index.tsx`**: Replace the existing `<footer>` block with the new three-section footer component
- **New `src/components/SiteFooter.tsx`**: Contains all three footer sections (LandscapeFooter with pinned cards, CreditsFooter, SiteLinksFooter) in one file, hardcoded English strings (no i18n needed), using Tailwind classes mapped to this site's CSS variables

### Color adaptation
- Cork background: `hsl(var(--muted))` with dot texture
- Card backgrounds: card, light ocean-blue tint, dune-tan tint, sage-green tint
- Text colors: `foreground` and `muted-foreground`
- Pin colors: primary, ocean-blue, sunset-orange, sage-green

### What stays the same
- Newsletter subscribe component stays in place above the footer
- The "Made in the Sunset" and contact email content moves into the credits section
- Privacy and Terms link moves below the "Remix" line

