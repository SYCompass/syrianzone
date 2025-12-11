-- Update bmj18 name and add two new Jolani candidates (replace TODO placeholders before running)

-- TODO: set the final display name for bmj18
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
UPDATE candidates
SET name = 'أمجد مظفر النعيمي'
WHERE id = 'bmj18' AND poll_id = (SELECT id FROM p);

-- TODO: replace IDs, names, image URLs, and sort offsets with final values
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, NULL, x.image_url, (SELECT s + x.ofs FROM base_sort), 'jolani'
FROM (
  VALUES
    ('TODO_BMJ50', 'الجولاني الفاتح', '/tierlist/images/jolani/jolani50.jpg', 1),
    ('TODO_BMJ51', 'الغيغاتشاد', '/tierlist/images/jolani/jolani51.jpeg', 2)
) AS x(id, name, image_url, ofs)
ON CONFLICT (id) DO NOTHING;



