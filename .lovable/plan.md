

## Deduplicate News Stories Across Publications

Add an instruction to the Claude system prompt telling it to detect when multiple articles cover the same underlying story and only select one (the best source). This is the simplest and most effective approach since Claude already analyzes all articles together.

### Change

**File: `supabase/functions/check-news/index.ts`**

Add to the system prompt, after the current selection instructions:

> DEDUPLICATION: If multiple articles cover the same underlying story or event, select only ONE — the version with the most useful detail for neighbors. Do not return duplicate stories even if they come from different publications.

This goes right before the "HEADLINE REWRITING" section. No database or frontend changes needed.

