-- Add 18 security heads to the candidates table for poll 'best-ministers'
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), max_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, category, sort)
SELECT x.id, (SELECT id FROM p), x.name, x.title, x.image_url, 'security', x.sort
FROM (
  VALUES
    ('sec01', 'أسامة عاتكة', 'قائد الأمن الداخلي في محافظة دمشق', '/tierlist/images/sec01.png', (SELECT s + 1  FROM max_sort)),
    ('sec02', 'محمد عبد الغني', 'قائد الأمن الداخلي في محافظة حلب', '/tierlist/images/sec02.png', (SELECT s + 2  FROM max_sort)),
    ('sec03', 'مرهف النعسان', 'قائد الأمن الداخلي في محافظة حمص', '/tierlist/images/sec03.png', (SELECT s + 3  FROM max_sort)),
    ('sec04', 'ملهم الشنتوت', 'قائد الأمن الداخلي في محافظة حماة', '/tierlist/images/sec04.png', (SELECT s + 4  FROM max_sort)),
    ('sec05', 'عبد العزيز الأحمد', 'قائد الأمن الداخلي في محافظة اللاذقية', '/tierlist/images/sec05.png', (SELECT s + 5  FROM max_sort)),
    ('sec06', 'عبد العال عبد العال', 'قائد الأمن الداخلي في محافظة طرطوس', '/tierlist/images/sec06.png', (SELECT s + 6  FROM max_sort)),
    ('sec07', 'غسان محمد باكير', 'قائد الأمن الداخلي في محافظة إدلب', '/tierlist/images/sec07.png', (SELECT s + 7  FROM max_sort)),
    ('sec08', 'شاهر عمران', 'قائد الأمن الداخلي في محافظة درعا', '/tierlist/images/sec08.png', (SELECT s + 8  FROM max_sort)),
    ('sec09', 'أحمد الدالاتي', 'قائد الأمن الداخلي في محافظة ريف دمشق', '/tierlist/images/sec09.png', (SELECT s + 9  FROM max_sort)),
    ('sec10', 'ضرار الشملان', 'قائد الأمن الداخلي في محافظة دير الزور', '/tierlist/images/sec10.png', (SELECT s + 10 FROM max_sort)),
    ('sec11', 'حسام الطحان', 'قائد الأمن الداخلي في محافظة السويداء', '/tierlist/images/sec11.png', (SELECT s + 11 FROM max_sort)),
    ('sec12', 'عبد القادر الطحان', 'معاون وزير الداخلية للشؤون الأمنية', '/tierlist/images/sec12.png', (SELECT s + 12 FROM max_sort)),
    ('sec13', 'أحمد لطوف', 'معاون وزير الداخلية للشؤون الشرطية', '/tierlist/images/sec13.png', (SELECT s + 13 FROM max_sort)),
    ('sec14', 'زياد العايش', 'معاون وزير الداخلية للشؤون المدنية', '/tierlist/images/sec14.png', (SELECT s + 14 FROM max_sort)),
    ('sec15', 'محمد الشيخ فتوح', 'معاون وزير الداخلية لشؤون القوى البشرية', '/tierlist/images/sec15.png', (SELECT s + 15 FROM max_sort)),
    ('sec16', 'أحمد حفار', 'معاون وزير الداخلية للشؤون التقنية ', '/tierlist/images/sec16.png', (SELECT s + 16 FROM max_sort)),
    ('sec17', 'باسم المنصور', 'معاون وزير الداخلية للشؤون الإدارية والقانونية', '/tierlist/images/sec17.png', (SELECT s + 17 FROM max_sort)),
    ('sec18', 'محمد الناصير', 'قائد الأمن الداخلي في محافظة القنيطرة', '/tierlist/images/sec18.png', (SELECT s + 18 FROM max_sort))
) AS x(id, name, title, image_url, sort)
ON CONFLICT (id) DO NOTHING;



