-- Insert one new minister candidate for poll 'best-ministers'
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), max_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort)
SELECT x.id, (SELECT id FROM p), x.name, x.title, x.image_url, (SELECT s + 1 FROM max_sort)
FROM (
  VALUES
    -- Adjust the name/title/image_url as desired; category defaults to 'minister'
    ('item31', 'محمد طه الأحمد', 'رئيس اللجنة العليا لانتخابات المجلس التشريعي', '/tierlist/images/item31.png')
) AS x(id, name, title, image_url)
ON CONFLICT (id) DO NOTHING;


