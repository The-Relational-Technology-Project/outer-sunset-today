# Outer Sunset Today

A daily neighborhood page for the Outer Sunset district of San Francisco — today's events, local news, and a community calendar, all in one place.

## What is this?

Outer Sunset Today is a live neighborhood bulletin board. It shows what's happening today, upcoming events, and local news for the Outer Sunset. Residents can submit their own events, sign up for a newsletter, and use the "Plan My Day" feature to build a schedule from what's happening nearby.

## Features

- **Today's events** — What's happening in the neighborhood right now
- **Community calendar** — Browse and search upcoming events
- **Local news** — Curated neighborhood news and updates
- **Event submission** — Neighbors can submit their own events
- **Newsletter signup** — Get a regular digest of what's happening
- **Plan My Day** — Build a personal schedule from today's events
- **Admin tools** — Dashboard for stewards to manage content

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) for database and auth

## Part of the Relational Technology Project

## Public Neighborhood data feeds

These deployed functions accept anonymous `GET` requests, require no API key, allow cross-origin browser requests, and reject writes. Copy each function's full URL from Lovable Cloud's Edge functions view; the website domain does **not** proxy these paths.

| Function path | Collection | Default |
| --- | --- | --- |
| `/functions/v1/get-public-pizza` | `menus` | All available Arizmendi pizzas from today onward (Pacific date) |
| `/functions/v1/get-public-school-lunch` | `menus` | All available SFUSD lunches from today onward (Pacific date) |
| `/functions/v1/get-public-news` | `news_items` | Latest four curated stories collected in the past seven days |

All three use the existing Neighborhood API v0.1 metadata: `publisher`, `steward`, `neighborhood`, `license`, and `updated_at`; they also declare `timezone`. These menu/news resources are extensions using the same conventions, not a claim that the event specification defines menu or news schemas. Lists return `{meta, menus, count, filters_applied}` or `{meta, news_items, count, filters_applied}`. Records use `id`, `name`, `description`, `category`, `url`, and attributed `source`. Menus include `date`, full `items`, `location`, `hours`, and nullable `price`. News includes nullable `published_at`, `collected_at`, and `is_actionable`. Credit original news publishers and link to their articles; the feed's license does not relicense original articles.

Query parameters:

- `date=YYYY-MM-DD`: one menu date or one news collection day (UTC for news).
- `start_after=YYYY-MM-DD&start_before=YYYY-MM-DD`: inclusive date bounds, instead of `date`.
- `limit=1..100` and `offset=0..10000`: pagination (menu default 50, news default 4).
- `q=text`: menu-description or original-news-title search; wildcard characters are rejected.
- `id=UUID`: single-record lookup, returning `{meta, menu}` or `{meta, news_item}`; missing IDs return 404. Use without pagination filters.

Examples to append to a copied function URL: `?date=2026-11-09`, `?start_after=2026-11-01&start_before=2026-11-30`, or `?limit=20&offset=20`. Empty collections return 200 with an empty array (including no-school days or unpopulated menu dates); no menu is invented or carried forward. The school lunch feed preserves hot, vegetarian, and cold options as supplied. This is a data feed, not the site's after-5pm next-school-day display behavior. Successful responses may be cached for five minutes. Invalid parameters return 400; unsupported methods return 405; temporary read failures return 500.

Run feed regression tests with `bun test supabase/functions/_shared/public-feeds.test.ts`.

Built as part of the [Relational Technology Project](https://relationaltechproject.org) — open-source neighborhood tech made in the Outer Sunset, for neighborhoods everywhere.
