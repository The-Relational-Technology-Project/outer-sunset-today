-- Add unique constraint to prevent duplicate menu entries
ALTER TABLE daily_menus 
ADD CONSTRAINT unique_restaurant_menu_date UNIQUE (restaurant, menu_date);