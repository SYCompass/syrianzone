-- Update image_url for item22 and item23 to .jpg while preserving the existing directory path
-- Idempotent updates

BEGIN;

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item22\.[^\/]+$', '\1item22.jpg')
WHERE image_url ~ 'item22\.[^/]+$';

UPDATE candidates
SET image_url = regexp_replace(image_url, '(.*\/)?item23\.[^\/]+$', '\1item23.jpg')
WHERE image_url ~ 'item23\.[^/]+$';

COMMIT;


