-- Fix clothing swap event times (1pm PT = 20:00 UTC, 4:30pm PT = 23:30 UTC)
UPDATE events 
SET 
  start_time = '2025-10-18 20:00:00+00',
  end_time = '2025-10-18 23:30:00+00'
WHERE id = '9246f01d-2da2-47f4-a07d-306dd0c1faa8';