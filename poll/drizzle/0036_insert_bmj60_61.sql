-- Insert bmj60–bmj61 into 'best-ministers' poll at the end of current sort
-- TODO: Update names and image URLs before running in production

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('bmj60', 'آية الله جولاني', '/tierlist/images/jolani/jolani60.jpeg', 1),
    ('bmj61', 'جولانوتس', '/tierlist/images/jolani/jolani61.jpeg', 2)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;

