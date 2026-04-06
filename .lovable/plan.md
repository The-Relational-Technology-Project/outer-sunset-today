

## Add Missing Events & Clean Up Duplicate

### 1. Remove duplicate PloverFest

Delete one of the two PloverFest entries for Apr 12. Keep the one with the more descriptive title ("PloverFest: Sunset Dunes 1st Birthday & Community Music Festival").

### 2. Add 5 missing Sunset Commons events

Call the `add-events` edge function with:
- **Story Swap: The Great Book Exchange** — Apr 9, 16:00–18:00, Sunset Commons, community
- **Scrap & Yap Club - Junk Journal Evening** — Apr 9, 18:30–20:30, Sunset Commons, art
- **CRAFTCHELLA W1** — Apr 10, 14:00–17:30, Sunset Commons, art
- **Write & Delight: Calligraphy for Beginners** — Apr 10, 18:00–20:00, Sunset Commons, art
- **Beginner's Guide to Mah Jong** — Apr 12, 15:00–17:00, Sunset Commons, community

### 3. Add 2 missing community events

- **Outer Sunset Morning Cleanup + Free Coffee** — Apr 6, 08:00–09:00, Andytown Coffee (3629 Taraval), volunteer
- **Inner Sunset Flea Market** — Apr 12, 10:00–16:00, Irving St (9th-11th Ave), market

### 4. Add Funcheap / morning cleanup to scraper sources

Add Funcheap SF as a search source in `weekly-event-scraper` so recurring volunteer events like the morning cleanup are picked up automatically.

### Technical details

- Migration SQL to delete the duplicate PloverFest by ID
- POST to `/add-events` for the 7 new events
- Update `SEARCH_SOURCES` array in `weekly-event-scraper/index.ts`

