

## Add Arizmendi Pizza Menus for April 21–26

The database has no pizza menus beyond today (Sun Apr 19). Arizmendi is closed Mon Apr 20, then reopens Tue Apr 21. From the screenshot, here are the specials to add:

| Date | Day | Special |
|---|---|---|
| Apr 21 | Tue | asparagus, feta cheese, red onions, lemon vinaigrette |
| Apr 22 | Wed | cherry tomatoes, roasted garlic, fontina, rosemary oil, p&p |
| Apr 23 | Thu | mushrooms, fresh herbs, goat cheese, garlic oil, p&p |
| Apr 24 | Fri | 'Quattro Fromaggio' housemade sauce w/asiago, feta, parmesan & romano, thyme oil, parsley |
| Apr 25 | Sat | cherry tomatoes, spinach, manchego, garlic oil, parmesan |
| Apr 26 | Sun | shiitake, portabella and button mushrooms with sesame-ginger-garlic vinaigrette |

Mon Apr 20 — skip (closed).

### Implementation
- Call the `add-menus` edge function with all 6 entries (restaurant: "Arizmendi Bakery", location: "1331 9th Ave", category: "pizza", hours: standard Arizmendi hours).
- This populates Tue-Sun so the InfoStrip widget and weekly newsletter (sending tomorrow morning) have correct data.

