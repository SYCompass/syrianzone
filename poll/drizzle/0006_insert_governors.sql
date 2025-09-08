-- Insert 14 governors under category 'governor' for poll 'best-ministers'
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, x.title, x.image_url, (SELECT s + x.ofs FROM base_sort), 'governor'
FROM (
  VALUES
    ('gov01', 'ماهر مروان', 'محافظ دمشق', '/tierlist/images/gov01.jpg', 1),
    ('gov02', 'عزام غريب', 'محافظ حلب', '/tierlist/images/gov02.jpg', 2),
    ('gov03', 'عبد الرحمن الأعمى', 'محافظ حمص', '/tierlist/images/gov03.jpg', 3),
    ('gov04', 'عبد الرحمن السهيان', 'محافظ حماة', '/tierlist/images/gov04.jpg', 4),
    ('gov05', 'محمد عثمان', 'محافظ اللاذقية', '/tierlist/images/gov05.jpg', 5),
    ('gov06', 'أحمد الشامي', 'محافظ طرطوس', '/tierlist/images/gov06.jpg', 6),
    ('gov07', 'محمد عبد الرحمن', 'محافظ إدلب', '/tierlist/images/gov07.jpg', 7),
    ('gov08', 'غسان السيد', 'محافظ دير الزور', '/tierlist/images/gov08.jpg', 8),
    ('gov09', 'مصطفى بكور', 'محافظ السويداء', '/tierlist/images/gov09.jpg', 9),
    ('gov10', 'أنور الزعبي', 'محافظ درعا', '/tierlist/images/gov10.jpg', 10),
    ('gov11', 'أحمد الدالاتي', '(بارت تايم) محافظ القنيطرة', '/tierlist/images/gov11.jpg', 11),
    ('gov12', 'عامر الشيخ', 'محافظ ريف دمشق', '/tierlist/images/gov12.jpg', 12)
) AS x(id, name, title, image_url, ofs)
ON CONFLICT (id) DO NOTHING;

