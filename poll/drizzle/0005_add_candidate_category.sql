ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "category" varchar(32) NOT NULL DEFAULT 'minister';

