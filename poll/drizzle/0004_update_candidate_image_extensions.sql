-- Update candidate image_url filenames to requested extensions while preserving directory path
-- Safe to run multiple times; regex_replace will no-op if already set

BEGIN;

-- item2 -> item2.jpeg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item2\.[^\/]+$', '\1item2.jpeg')
WHERE id = 'item2';

-- item3 -> item3.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item3\.[^\/]+$', '\1item3.jpg')
WHERE id = 'item3';

-- item4 -> item4.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item4\.[^\/]+$', '\1item4.jpg')
WHERE id = 'item4';

-- item5 -> item5.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item5\.[^\/]+$', '\1item5.jpg')
WHERE id = 'item5';

-- item7 -> item7.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item7\.[^\/]+$', '\1item7.jpg')
WHERE id = 'item7';

-- item8 -> item8.png
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item8\.[^\/]+$', '\1item8.png')
WHERE id = 'item8';

-- item9 -> item9.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item9\.[^\/]+$', '\1item9.jpg')
WHERE id = 'item9';

-- item11 -> item11.jpeg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item11\.[^\/]+$', '\1item11.jpeg')
WHERE id = 'item11';

-- item13 -> item13.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item13\.[^\/]+$', '\1item13.jpg')
WHERE id = 'item13';

-- item14 -> item14.png
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item14\.[^\/]+$', '\1item14.png')
WHERE id = 'item14';

-- item15 -> item15.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item15\.[^\/]+$', '\1item15.jpg')
WHERE id = 'item15';

-- item16 -> item16.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item16\.[^\/]+$', '\1item16.jpg')
WHERE id = 'item16';

-- item18 -> item18.png
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item18\.[^\/]+$', '\1item18.png')
WHERE id = 'item18';

-- item19 -> item19.jpg
UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item19\.[^\/]+$', '\1item19.jpg')
WHERE id = 'item19';

COMMIT;


