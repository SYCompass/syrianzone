-- Delete selected security heads from the 'best-ministers' poll

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
DELETE FROM candidates c
USING p
WHERE c.poll_id = p.id
  AND c.id IN ('sec12','sec13','sec14','sec15','sec16','sec17');


