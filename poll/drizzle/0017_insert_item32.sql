-- Insert one test candidate (item32) for poll 'best-ministers'
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort)
SELECT x.id, (SELECT id FROM p), x.name, x.title, x.image_url, (SELECT s + 1 FROM base_sort)
FROM (
  VALUES
    ('item32', 'عنصر اختبار ٣٢', 'اختبار مسار الهجرة', NULL)
) AS x(id, name, title, image_url)
ON CONFLICT (id) DO NOTHING;


