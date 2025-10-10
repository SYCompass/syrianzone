-- Rename bmj12 and bmj31; delete bmj28 in 'best-ministers' poll

-- bmj12 -> الكاثوليكي
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
UPDATE candidates
SET name = 'الكاثوليكي'
WHERE id = 'bmj12' AND poll_id = (SELECT id FROM p);

-- bmj31 -> مايكل جولان
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
UPDATE candidates
SET name = 'مايكل جولان'
WHERE id = 'bmj31' AND poll_id = (SELECT id FROM p);

-- delete bmj28
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
DELETE FROM candidates
WHERE id = 'bmj28' AND poll_id = (SELECT id FROM p);



