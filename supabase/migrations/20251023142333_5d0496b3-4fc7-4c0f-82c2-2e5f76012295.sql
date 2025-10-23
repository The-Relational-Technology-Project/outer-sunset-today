-- Update Arizmendi hours to reflect pizza service starts at 11:00 AM PT
-- Pizza is served from 11:00 AM until close (6:00 PM)
UPDATE daily_menus 
SET hours = '11:00 AM - 6:00 PM (Pizza from 11 AM)'
WHERE restaurant LIKE '%Arizmendi%';