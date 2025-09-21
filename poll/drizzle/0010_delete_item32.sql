-- Delete test candidate item32 for poll 'best-ministers' (if exists)
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
DELETE FROM candidates
WHERE id = 'item32' AND poll_id = (SELECT id FROM p);


