-- Update image_url extensions based on filename in path, regardless of candidate id
-- Idempotent: running multiple times keeps the same result

BEGIN;

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item2\.[^\/]+$', '\1item2.jpeg')
WHERE image_url ~ 'item2\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item3\.[^\/]+$', '\1item3.jpg')
WHERE image_url ~ 'item3\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item4\.[^\/]+$', '\1item4.jpg')
WHERE image_url ~ 'item4\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item5\.[^\/]+$', '\1item5.jpg')
WHERE image_url ~ 'item5\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item7\.[^\/]+$', '\1item7.jpg')
WHERE image_url ~ 'item7\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item8\.[^\/]+$', '\1item8.png')
WHERE image_url ~ 'item8\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item9\.[^\/]+$', '\1item9.jpg')
WHERE image_url ~ 'item9\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item11\.[^\/]+$', '\1item11.jpeg')
WHERE image_url ~ 'item11\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item13\.[^\/]+$', '\1item13.jpg')
WHERE image_url ~ 'item13\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item14\.[^\/]+$', '\1item14.png')
WHERE image_url ~ 'item14\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item15\.[^\/]+$', '\1item15.jpg')
WHERE image_url ~ 'item15\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item16\.[^\/]+$', '\1item16.jpg')
WHERE image_url ~ 'item16\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item18\.[^\/]+$', '\1item18.png')
WHERE image_url ~ 'item18\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item19\.[^\/]+$', '\1item19.jpg')
WHERE image_url ~ 'item19\.[^/]+$';

COMMIT;


