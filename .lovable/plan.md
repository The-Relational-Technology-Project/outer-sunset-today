

## Delete SF Standard news items

Run a DELETE statement against the `news_items` table to remove all rows where `source_name` matches SF Standard. This is a data operation, not a schema change.

### Technical details

- Execute: `DELETE FROM public.news_items WHERE source_name = 'SF Standard';`
- Uses the insert/data tool since this is a data operation, not a migration

