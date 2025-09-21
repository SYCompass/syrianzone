-- Ensure the 'best-ministers' poll exists, then insert missing candidate item31

-- Create poll if it doesn't exist
INSERT INTO polls (id, slug, title, timezone)
VALUES ('poll-best-ministers', 'best-ministers', 'تقييم الوزراء', 'Europe/Amsterdam')
ON CONFLICT (slug) DO NOTHING;

-- Insert candidate item31 if missing, placing it after current max sort
WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
), base_sort AS (
  SELECT COALESCE(MAX(sort), 0) AS s FROM candidates WHERE poll_id = (SELECT id FROM p)
)
INSERT INTO candidates (id, poll_id, name, title, image_url, sort, category)
SELECT x.id, (SELECT id FROM p), x.name, x.title, x.image_url, (SELECT s + x.ofs FROM base_sort), 'minister'
FROM (
  VALUES
    ('item31', 'محمد طه الأحمد', 'رئيس اللجنة العليا لانتخابات مجلس الشعب', '/tierlist/images/item31.png', 1)
) AS x(id, name, title, image_url, ofs)
ON CONFLICT (id) DO NOTHING;


