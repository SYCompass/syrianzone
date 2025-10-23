-- Insert bmj48–bmj49 into 'best-ministers' poll at the end of current sort

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('bmj48', 'المارشال', '/tierlist/images/jolani/jolani48.jpeg', 1),
    ('bmj49', 'الجولاني الغامق', '/tierlist/images/jolani/jolani49.png', 2)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;



