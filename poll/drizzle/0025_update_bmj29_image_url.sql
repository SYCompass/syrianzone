-- Update image URL for bmj29 to use .jpeg extension in the 'best-ministers' poll

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
UPDATE candidates
SET image_url = '/tierlist/images/jolani/jolani29.jpeg'
WHERE id = 'bmj29' AND poll_id = (SELECT id FROM p);


