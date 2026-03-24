

## Custom Updates Feature

A new system for Outer Sunset neighbors to request and subscribe to personalized neighborhood updates.

### Database

**New table: `custom_updates`**
Stores update definitions (both user-requested and seed examples).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| description | text | What the update covers |
| created_at | timestamptz | |
| is_public | boolean | Whether visible in gallery |
| subscriber_count | int, default 0 | For display |

**New table: `custom_update_subscriptions`**
Stores who wants which update and how.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| custom_update_id | uuid FK → custom_updates | |
| email | text, nullable | |
| phone | text, nullable | |
| preferred_channel | text | 'email', 'phone', 'both' |
| messaging_opt_in | boolean | |
| created_at | timestamptz | |
| is_creator | boolean, default false | The person who requested this update |

RLS: public INSERT on both tables, public SELECT on `custom_updates` (where `is_public = true`), service-role for everything else. Subscriptions are private (no public SELECT).

Seed the 5 example updates via INSERT.

### Navigation changes

**Header (`src/components/Header.tsx`)**
- Replace "Submit Event" CTA with "Get Custom Updates" linking to `/updates`
- Same rounded-full orange button style, with a Bell icon instead of Plus

**Index page (`src/pages/Index.tsx`)**
- Add a "Submit an Event" link button next to the "Today's Events" heading (right-aligned)
- Keep the existing empty-state Submit CTA when no events

### New page: `/updates`

**`src/pages/Updates.tsx`**
- Header + intro section explaining custom updates
- **Request form** (top):
  - Text field: "What would you like to be updated on?"
  - Communication preference: email field, phone field, checkboxes for which channels
  - Messaging opt-in checkbox
  - Checkbox: "I'm happy for this update to be public as an example"
  - Submit button → inserts into `custom_updates` + `custom_update_subscriptions` → toast "Thanks for your request! We'll be in touch once your update is set up."
- **Community gallery** (below form):
  - Cards showing public `custom_updates` with description and subscriber count
  - Each card has "Sign me up" button
  - Clicking opens a dialog with communication preference fields (email/phone/both), messaging opt-in, and submit
  - Submit → inserts into `custom_update_subscriptions`, increments `subscriber_count` → toast confirming receipt

### New hook: `useCustomUpdates.ts`
Queries public custom updates for the gallery.

### Route
Add `/updates` route in `App.tsx`.

### Implementation order

1. Create `custom_updates` and `custom_update_subscriptions` tables with RLS + seed data
2. Update Header: swap CTA to "Get Custom Updates"
3. Update Index: add "Submit an Event" link next to "Today's Events" heading
4. Build Updates page with form + gallery
5. Add route to App.tsx

### Technical details

- Communication preference uses radio group or checkboxes for email/phone/both
- Phone field only shows when phone or both is selected
- Email field only shows when email or both is selected
- Gallery uses `useQuery` to fetch public updates ordered by subscriber_count desc
- "Sign me up" dialog reuses the same communication preference UI
- Subscriber count incremented via a SECURITY DEFINER function to avoid needing UPDATE policy on `custom_updates`

