-- Insert bmj35–bmj44 into 'best-ministers' poll at the end of current sort

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('bmj35', 'المتسامح',      '/tierlist/images/jolani/jolani35.jpeg', 1),
    ('bmj36', 'الأورثوذوكسي',       '/tierlist/images/jolani/jolani36.jpeg', 2),
    ('bmj37', 'الماوي',  '/tierlist/images/jolani/jolani37.jpeg', 3),
    ('bmj38', 'البلفاني',     '/tierlist/images/jolani/jolani38.jpeg', 4),
    ('bmj39', '007',    '/tierlist/images/jolani/jolani39.jpeg', 5),
    ('bmj40', 'جولانيوس',      '/tierlist/images/jolani/jolani40.png', 6),
    ('bmj41', 'المقاتل',     '/tierlist/images/jolani/jolani41.jpeg', 7),
    ('bmj42', 'الآري',      '/tierlist/images/jolani/jolani42.jpeg', 8),
    ('bmj43', 'شو علاقتنا بالموضوع نحنا؟',  '/tierlist/images/jolani/jolani43.png', 9),
    ('bmj44', 'الكوميدي', '/tierlist/images/jolani/jolani44.jpg', 10)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;



