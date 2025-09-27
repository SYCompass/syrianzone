-- Update Jolani persona names and add two new Jolani candidates

WITH p AS (
  SELECT id FROM polls WHERE slug = 'jolani'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
UPDATE candidates
SET name = 'المثقف'
WHERE id = 'jolani26' AND poll_id = (SELECT id FROM p);

WITH p AS (
  SELECT id FROM polls WHERE slug = 'jolani'
)
UPDATE candidates
SET name = 'الجولاني المنتظر'
WHERE id = 'jolani9' AND poll_id = (SELECT id FROM p);

WITH p AS (
  SELECT id FROM polls WHERE slug = 'jolani'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('jolani28', 'أرسلان القائد صفر', '/tierlist/images/jolani/jolani28.jpg', 1),
    ('jolani29', 'قمر بني أمية', '/tierlist/images/jolani/jolani29.jpeg', 2)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;


