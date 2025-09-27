-- Insert Jolani personas into 'best-ministers' with unique IDs to avoid PK conflicts

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('bmj01',  'جولانسكي',               '/tierlist/images/jolani/jolani1.webp',   1),
    ('bmj02',  'جوكاسترو',               '/tierlist/images/jolani/jolani2.webp',   2),
    ('bmj03',  'جولادن',                 '/tierlist/images/jolani/jolani3.webp',   3),
    ('bmj04',  'جورسمي',                 '/tierlist/images/jolani/jolani4.webp',   4),
    ('bmj05',  'المركزاني',              '/tierlist/images/jolani/jolani5.webp',   5),
    ('bmj06',  'الغاضب',                 '/tierlist/images/jolani/jolani6.webp',   6),
    ('bmj07',  'أحمد الدستور',           '/tierlist/images/jolani/jolani7.avif',   7),
    ('bmj08',  'الفولاني',               '/tierlist/images/jolani/jolani8.webp',   8),
    ('bmj09',  'المجهولاني',             '/tierlist/images/jolani/jolani9.webp',   9),
    ('bmj10', 'جولاني محررنا',           '/tierlist/images/jolani/jolani10.webp', 10),
    ('bmj11', 'البيبي',                  '/tierlist/images/jolani/jolani11.png', 11),
    ('bmj12', 'الصليبي',                 '/tierlist/images/jolani/jolani12.jpeg', 12),
    ('bmj13', 'العلماني',                '/tierlist/images/jolani/jolani13.jpeg', 13),
    ('bmj14', 'الدرزي',                  '/tierlist/images/jolani/jolani14.JPG',  14),
    ('bmj15', 'الرئاسي',                 '/tierlist/images/jolani/jolani15.JPG',  15),
    ('bmj16', 'الكردي',                  '/tierlist/images/jolani/jolani16.JPG',  16),
    ('bmj17', 'المخلص',                  '/tierlist/images/jolani/jolani17.JPG',  17),
    ('bmj18', 'مظفر النعيمي',            '/tierlist/images/jolani/jolani18.jpg',  18),
    ('bmj19', 'التأديبي',                '/tierlist/images/jolani/jolani19.JPG',  19),
    ('bmj20', 'العشائري',                '/tierlist/images/jolani/jolani20.JPG',  20),
    ('bmj21', 'الإمام الثالث عشر',        '/tierlist/images/jolani/jolani21.JPG',  21),
    ('bmj22', 'الحجي',                   '/tierlist/images/jolani/jolani22.JPG',  22),
    ('bmj23', 'الماكر',                  '/tierlist/images/jolani/jolani23.JPG',  23),
    ('bmj24', 'البودكاستي',              '/tierlist/images/jolani/jolani24.JPG',  24),
    ('bmj25', 'الطائر',                  '/tierlist/images/jolani/jolani25.JPG',  25),
    ('bmj26', 'الجهادي',                 '/tierlist/images/jolani/jolani26.JPG',  26),
    ('bmj27', 'المعماري',                '/tierlist/images/jolani/jolani27.png',  27)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;


