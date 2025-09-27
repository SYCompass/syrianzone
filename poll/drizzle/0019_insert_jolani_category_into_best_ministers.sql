-- Insert Jolani personas as a new category 'jolani' under the 'best-ministers' poll

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('jolani1',  'جولانسكي',               '/tierlist/images/jolani/jolani1.webp',   1),
    ('jolani2',  'جوكاسترو',               '/tierlist/images/jolani/jolani2.webp',   2),
    ('jolani3',  'جولادن',                 '/tierlist/images/jolani/jolani3.webp',   3),
    ('jolani4',  'جورسمي',                 '/tierlist/images/jolani/jolani4.webp',   4),
    ('jolani5',  'المركزاني',              '/tierlist/images/jolani/jolani5.webp',   5),
    ('jolani6',  'الغاضب',                 '/tierlist/images/jolani/jolani6.webp',   6),
    ('jolani7',  'أحمد الدستور',           '/tierlist/images/jolani/jolani7.avif',   7),
    ('jolani8',  'الفولاني',               '/tierlist/images/jolani/jolani8.webp',   8),
    ('jolani9',  'المجهولاني',             '/tierlist/images/jolani/jolani9.webp',   9),
    ('jolani10', 'جولاني محررنا',          '/tierlist/images/jolani/jolani10.webp', 10),
    ('jolani11', 'البيبي',                  '/tierlist/images/jolani/jolani11.png', 11),
    ('jolani12', 'الصليبي',                '/tierlist/images/jolani/jolani12.jpeg', 12),
    ('jolani13', 'العلماني',               '/tierlist/images/jolani/jolani13.jpeg', 13),
    ('jolani14', 'الدرزي',                 '/tierlist/images/jolani/jolani14.JPG',  14),
    ('jolani15', 'الرئاسي',                '/tierlist/images/jolani/jolani15.JPG',  15),
    ('jolani16', 'الكردي',                 '/tierlist/images/jolani/jolani16.JPG',  16),
    ('jolani17', 'المخلص',                 '/tierlist/images/jolani/jolani17.JPG',  17),
    ('jolani18', 'مظفر النعيمي',           '/tierlist/images/jolani/jolani18.jpg',  18),
    ('jolani19', 'التأديبي',               '/tierlist/images/jolani/jolani19.JPG',  19),
    ('jolani20', 'العشائري',               '/tierlist/images/jolani/jolani20.JPG',  20),
    ('jolani21', 'الإمام الثالث عشر',       '/tierlist/images/jolani/jolani21.JPG',  21),
    ('jolani22', 'الحجي',                  '/tierlist/images/jolani/jolani22.JPG',  22),
    ('jolani23', 'الماكر',                 '/tierlist/images/jolani/jolani23.JPG',  23),
    ('jolani24', 'البودكاستي',             '/tierlist/images/jolani/jolani24.JPG',  24),
    ('jolani25', 'الطائر',                 '/tierlist/images/jolani/jolani25.JPG',  25),
    ('jolani26', 'الجهادي',                '/tierlist/images/jolani/jolani26.JPG',  26),
    ('jolani27', 'المعماري',               '/tierlist/images/jolani/jolani27.png',  27)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;


