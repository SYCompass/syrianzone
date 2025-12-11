-- Delete bmj10 and update names for bmj63 and bmj64
-- TODO: Update the new names before running in production

-- Delete bmj10
DELETE FROM candidates WHERE id = 'bmj10';

-- Update name for bmj63
UPDATE candidates 
SET name = 'الآيرونماني'
WHERE id = 'bmj63';

-- Update name for bmj64
UPDATE candidates 
SET name = 'الفمنست'
WHERE id = 'bmj64';

