-- Align best-ministers Jolani entries with latest names and images

-- Rename bmj26 and bmj09
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
UPDATE candidates
SET name = 'المثقف'
WHERE id = 'bmj26' AND poll_id = (SELECT id FROM p);

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
UPDATE candidates
SET name = 'الجولاني المنتظر'
WHERE id = 'bmj09' AND poll_id = (SELECT id FROM p);

-- Insert bmj28 and bmj29 at the end of current sort
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('bmj28', 'أرسلان القائد صفر', '/tierlist/images/jolani/jolani28.jpg', 1),
    ('bmj29', 'قمر بني أمية', '/tierlist/images/jolani/jolani29.jpeg', 2)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;


