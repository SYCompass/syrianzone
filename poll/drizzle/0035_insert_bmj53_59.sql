-- Insert bmj53–bmj59 into 'best-ministers' poll at the end of current sort
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
    ('bmj53', 'الكوميدياني', '/tierlist/images/jolani/jolani53.png', 1),
    ('bmj54', 'الكش ملك', '/tierlist/images/jolani/jolani54.jpeg', 2),
    ('bmj55', 'عزيز دمشق', '/tierlist/images/jolani/jolani55.jpeg', 3),
    ('bmj56', 'BFF', '/tierlist/images/jolani/jolani56.jpeg', 4),
    ('bmj57', 'الرئيس المؤقت', '/tierlist/images/jolani/jolani57.jpeg', 5),
    ('bmj58', 'المناخي', '/tierlist/images/jolani/jolani58.jpg', 6),
    ('bmj59', 'الأممي', '/tierlist/images/jolani/jolani59.jpg', 7)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;

