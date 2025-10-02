-- Remove Outerlands regular dinner service events
DELETE FROM events 
WHERE id IN (
  'fb97300e-63a6-482f-9bec-76830a551e77',
  'ad12587f-478e-4cea-9d30-488aa4c6225d'
);