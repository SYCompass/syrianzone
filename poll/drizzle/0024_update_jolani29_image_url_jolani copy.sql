-- Update image URL for jolani29 to use .jpeg extension in the 'jolani' poll

WITH p AS (
  SELECT id FROM polls WHERE slug = 'jolani'
)
UPDATE candidates
SET image_url = '/tierlist/images/jolani/jolani29.jpeg'
WHERE id = 'jolani29' AND poll_id = (SELECT id FROM p);


