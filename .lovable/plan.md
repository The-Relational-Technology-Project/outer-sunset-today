

## Full-Width Info Strip Layout

Restructure the top widgets into a single full-width horizontal strip with minimal height, making weather, tides, and Arizmendi feel like a compact info bar rather than cards.

### Layout change

Replace the current `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` widget row with a single full-width card (or a flex row of three inline sections) divided by vertical separators:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ☀ 64°/53° Sunny  │  ≋ Low 8:57AM · High 4:04PM  │  🍕 No pizza  │
└─────────────────────────────────────────────────────────────────────┘
```

### Changes

**`src/pages/Index.tsx`**
- Replace the widget grid with a single row containing a new `InfoStrip` component (or inline the three sections)
- Remove the separate `WeatherWidget` and `ArizmendiBoardWidget` imports from the grid
- Keep the rest of the page (Events/News grid, Coming Up Soon, Newsletter) unchanged

**`src/components/InfoStrip.tsx`** (new)
- Single `Card` with `bg-paper border-cork shadow-bulletin` styling
- Flex row with three sections separated by `border-r border-cork` dividers
- **Weather section**: icon + "64°/53° Sunny" on one line, compact
- **Tides section**: wave icon + "Low: 8:57 AM (-0.5ft) · High: 4:04 PM (4.2ft)" inline
- **Arizmendi section**: pizza icon + daily special or "No pizza today"
- Best Blue Day indicator stays as a small badge/tag on the weather section if active
- Each section uses `flex items-center gap-2 px-4 py-3` for minimal height
- Responsive: on mobile, stack vertically or wrap naturally

### What stays the same
- All data hooks (`useWeather`, `useBestBlueDay`, `useTodaysMenus`) unchanged
- Icons and color palette unchanged
- Bulletin board aesthetic preserved (just flattened into a strip)

