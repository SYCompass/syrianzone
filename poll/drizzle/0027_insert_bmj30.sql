-- Insert bmj30 into 'best-ministers' poll at the end of current sort

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('bmj30', 'الجولياردو', '/tierlist/images/jolani/jolani30.webp', 1)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;


