-- Fix event times to be in Pacific Time (PT) instead of UTC
-- All times in the Outer Sunset are Pacific Time

-- Update the events we just added with correct PT times
UPDATE events SET 
  start_time = '2025-10-20 18:00:00-07:00',
  end_time = '2025-10-20 21:00:00-07:00',
  event_date = '2025-10-20'
WHERE title = 'Monday Night Trivia – Sunset Reservoir Brewing Company';

UPDATE events SET 
  start_time = '2025-10-21 09:00:00-07:00',
  end_time = '2025-10-21 17:00:00-07:00',
  event_date = '2025-10-21'
WHERE title = 'SF Botanical Garden – Free Admission';

UPDATE events SET 
  start_time = '2025-10-21 19:00:00-07:00',
  end_time = '2025-10-21 22:00:00-07:00',
  event_date = '2025-10-21'
WHERE title = 'Open Mic Night – Mucky Duck';

UPDATE events SET 
  start_time = '2025-10-22 11:00:00-07:00',
  end_time = '2025-10-22 13:00:00-07:00',
  event_date = '2025-10-22'
WHERE title = 'Farmers Market – Stonestown Galleria';

UPDATE events SET 
  start_time = '2025-10-22 18:00:00-07:00',
  end_time = '2025-10-22 20:00:00-07:00',
  event_date = '2025-10-22'
WHERE title = 'Live Music & Trivia – Holy Water';

UPDATE events SET 
  start_time = '2025-10-22 19:00:00-07:00',
  end_time = '2025-10-22 21:00:00-07:00',
  event_date = '2025-10-22'
WHERE title = 'Neighborhood Karaoke – Underdogs';

UPDATE events SET 
  start_time = '2025-10-23 10:00:00-07:00',
  end_time = '2025-10-23 14:00:00-07:00',
  event_date = '2025-10-23'
WHERE title = 'Sunset Parkside Education & Action Committee (SPEAK) Meeting';

UPDATE events SET 
  start_time = '2025-10-23 14:00:00-07:00',
  end_time = '2025-10-23 16:00:00-07:00',
  event_date = '2025-10-23'
WHERE title = 'Ocean Beach Cleanup – Stairwell 17';

UPDATE events SET 
  start_time = '2025-10-23 18:00:00-07:00',
  end_time = '2025-10-23 21:00:00-07:00',
  event_date = '2025-10-23'
WHERE title = 'Art Reception – Lost Church';

UPDATE events SET 
  start_time = '2025-10-24 09:00:00-07:00',
  end_time = '2025-10-24 13:00:00-07:00',
  event_date = '2025-10-24'
WHERE title = 'Farmers Market – Stonestown Galleria';

UPDATE events SET 
  start_time = '2025-10-24 10:00:00-07:00',
  end_time = '2025-10-24 12:00:00-07:00',
  event_date = '2025-10-24'
WHERE title = 'Sunset Community Garden Work Party';

UPDATE events SET 
  start_time = '2025-10-24 10:30:00-07:00',
  end_time = '2025-10-24 15:00:00-07:00',
  event_date = '2025-10-24'
WHERE title = 'Parklet Pop-Up – Taraval Street';

UPDATE events SET 
  start_time = '2025-10-24 17:00:00-07:00',
  end_time = '2025-10-24 20:00:00-07:00',
  event_date = '2025-10-24'
WHERE title = 'Live Music – Trouble Coffee';

UPDATE events SET 
  start_time = '2025-10-25 09:00:00-07:00',
  end_time = '2025-10-25 13:00:00-07:00',
  event_date = '2025-10-25'
WHERE title = 'Farmers Market – Stonestown Galleria';

UPDATE events SET 
  start_time = '2025-10-25 10:00:00-07:00',
  end_time = '2025-10-25 14:00:00-07:00',
  event_date = '2025-10-25'
WHERE title = 'Outer Sunset Flea Market – Great Highway';

UPDATE events SET 
  start_time = '2025-10-25 11:00:00-07:00',
  end_time = '2025-10-25 15:00:00-07:00',
  event_date = '2025-10-25'
WHERE title = 'Golden Gate Park Guided Nature Walk';

UPDATE events SET 
  start_time = '2025-10-25 14:00:00-07:00',
  end_time = '2025-10-25 17:00:00-07:00',
  event_date = '2025-10-25'
WHERE title = 'Beach Bonfire & Acoustic Jam – Ocean Beach';

UPDATE events SET 
  start_time = '2025-10-26 11:00:00-07:00',
  end_time = '2025-10-26 16:00:00-07:00',
  event_date = '2025-10-26'
WHERE title = 'Community Potluck – Parkside Branch Library';

UPDATE events SET 
  start_time = '2025-10-26 15:00:00-07:00',
  end_time = '2025-10-26 18:00:00-07:00',
  event_date = '2025-10-26'
WHERE title = 'Sunset Yoga in the Park – Golden Gate Park';