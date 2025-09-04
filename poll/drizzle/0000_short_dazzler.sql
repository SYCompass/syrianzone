CREATE TABLE "ballot_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ballot_id" varchar(36) NOT NULL,
	"candidate_id" varchar(36) NOT NULL,
	"tier" varchar(1) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ballots" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"poll_id" varchar(36) NOT NULL,
	"vote_day" timestamp with time zone NOT NULL,
	"voter_key" varchar(128) NOT NULL,
	"ip_hash" varchar(128),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ballots_unique_poll_day_voter" UNIQUE("poll_id","vote_day","voter_key")
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"poll_id" varchar(36) NOT NULL,
	"name" varchar(200) NOT NULL,
	"image_url" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_ranks" (
	"poll_id" varchar(36) NOT NULL,
	"candidate_id" varchar(36) NOT NULL,
	"day" timestamp with time zone NOT NULL,
	"rank" integer NOT NULL,
	"votes" integer NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_ranks_poll_id_candidate_id_day_pk" PRIMARY KEY("poll_id","candidate_id","day")
);
--> statement-breakpoint
CREATE TABLE "daily_scores" (
	"poll_id" varchar(36) NOT NULL,
	"candidate_id" varchar(36) NOT NULL,
	"day" timestamp with time zone NOT NULL,
	"votes" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_scores_poll_id_candidate_id_day_pk" PRIMARY KEY("poll_id","candidate_id","day")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"timezone" varchar(64) DEFAULT 'Europe/Amsterdam' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "polls_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "ballot_items" ADD CONSTRAINT "ballot_items_ballot_id_ballots_id_fk" FOREIGN KEY ("ballot_id") REFERENCES "public"."ballots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballot_items" ADD CONSTRAINT "ballot_items_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_ranks" ADD CONSTRAINT "daily_ranks_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_ranks" ADD CONSTRAINT "daily_ranks_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_scores" ADD CONSTRAINT "daily_scores_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_scores" ADD CONSTRAINT "daily_scores_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;