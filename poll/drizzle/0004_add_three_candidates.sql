-- Insert four new candidates for poll 'best-ministers'
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), max_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort)
SELECT x.id, (SELECT id FROM p), x.name, x.title, x.image_url, x.sort
FROM (
  VALUES
    ('item27', 'عامر العلي', 'رئيس الهيئة المركزية للرقابة والتفتيش', '/tierlist/images/item27.jpg', (SELECT s + 1 FROM max_sort)),
    ('item28', 'قتيبة بدوي', 'رئيس الهيئة العامة للمنافذ البرية والبحرية', '/tierlist/images/item28.jpg', (SELECT s + 2 FROM max_sort)),
    ('item29', 'عمر الحصري', 'رئيس الهيئة العامة للطيران المدني والنقل الجوي', '/tierlist/images/item29.jpg', (SELECT s + 3 FROM max_sort)),
    ('item30', 'طلال الهلالي', 'مدير عام هيئة الاستثمار', '/tierlist/images/item30.jpeg', (SELECT s + 4 FROM max_sort))
) AS x(id, name, title, image_url, sort)
ON CONFLICT (id) DO NOTHING;

