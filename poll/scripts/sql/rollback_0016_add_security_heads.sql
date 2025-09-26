-- Rollback for 0016_add_security_heads.sql
-- Removes inserted security heads for poll 'best-ministers'

WITH p AS (
  SELECT id FROM polls WHERE slug = 'best-ministers'
)
DELETE FROM candidates c
USING p
WHERE c.poll_id = p.id
  AND c.id IN (
    'sec01','sec02','sec03','sec04','sec05','sec06','sec07','sec08','sec09',
    'sec10','sec11','sec12','sec13','sec14','sec15','sec16','sec17','sec18'
  );


