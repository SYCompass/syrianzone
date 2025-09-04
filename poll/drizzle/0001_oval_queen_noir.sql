DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ballots_pk_poll_day_voter') THEN
    ALTER TABLE "ballots" DROP CONSTRAINT "ballots_pk_poll_day_voter";
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ballots_unique_poll_day_voter') THEN
    ALTER TABLE "ballots" ADD CONSTRAINT "ballots_unique_poll_day_voter" UNIQUE("poll_id","vote_day","voter_key");
  END IF;
END $$;