ALTER TABLE "players" ALTER COLUMN "team_token" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "cover_photo" text;