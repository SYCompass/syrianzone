-- Update Jolani persona name (jolani21)
-- Replace the placeholder below with the desired new name before applying

WITH p AS (
  SELECT id FROM polls WHERE slug = 'jolani'
)
UPDATE candidates
SET name = 'الإمام الثالث عشر'
WHERE id = 'jolani21' AND poll_id = (SELECT id FROM p);


