CREATE TYPE "public"."match_status" AS ENUM('upcoming', 'live', 'completed', 'cancelled', 'no_result', 'postponed');--> statement-breakpoint
CREATE TYPE "public"."player_status" AS ENUM('pending', 'selected', 'activated', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'player');--> statement-breakpoint
CREATE TABLE "commentary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"over_number" real NOT NULL,
	"ball_number" integer NOT NULL,
	"runs" integer DEFAULT 0 NOT NULL,
	"is_wicket" boolean DEFAULT false NOT NULL,
	"is_four" boolean DEFAULT false NOT NULL,
	"is_six" boolean DEFAULT false NOT NULL,
	"is_extra" boolean DEFAULT false NOT NULL,
	"extra_type" varchar(20),
	"description" text,
	"innings" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"runs_scored" integer DEFAULT 0 NOT NULL,
	"balls_faced" integer DEFAULT 0 NOT NULL,
	"fours" integer DEFAULT 0 NOT NULL,
	"sixes" integer DEFAULT 0 NOT NULL,
	"wickets" integer DEFAULT 0 NOT NULL,
	"runs_conceded" integer DEFAULT 0 NOT NULL,
	"balls_bowled" integer DEFAULT 0 NOT NULL,
	"catches" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_a_id" uuid NOT NULL,
	"team_b_id" uuid NOT NULL,
	"overs" integer DEFAULT 10 NOT NULL,
	"date" varchar(20) NOT NULL,
	"time" varchar(20) NOT NULL,
	"venue" varchar(255) NOT NULL,
	"status" "match_status" DEFAULT 'upcoming' NOT NULL,
	"toss_winner" uuid,
	"toss_decision" varchar(10),
	"winner_team_id" uuid,
	"man_of_the_match" uuid,
	"match_type" varchar(20) DEFAULT 'league',
	"scoreboard_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"batch" varchar(10) NOT NULL,
	"team_id" uuid,
	"profile_image" text,
	"bio" text,
	"is_captain" boolean DEFAULT false NOT NULL,
	"status" "player_status" DEFAULT 'pending' NOT NULL,
	"team_token" varchar(20),
	"jersey_number" integer,
	"player_role" varchar(50) DEFAULT 'Batsman',
	"total_runs" integer DEFAULT 0 NOT NULL,
	"total_wickets" integer DEFAULT 0 NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"total_balls_faced" integer DEFAULT 0 NOT NULL,
	"total_balls_bowled" integer DEFAULT 0 NOT NULL,
	"total_runs_conceded" integer DEFAULT 0 NOT NULL,
	"total_sixes" integer DEFAULT 0 NOT NULL,
	"total_fours" integer DEFAULT 0 NOT NULL,
	"total_catches" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_table" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"matches_played" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"nrr" real DEFAULT 0 NOT NULL,
	"total_runs_scored" integer DEFAULT 0 NOT NULL,
	"total_overs_played" real DEFAULT 0 NOT NULL,
	"total_runs_conceded" integer DEFAULT 0 NOT NULL,
	"total_overs_bowled" real DEFAULT 0 NOT NULL,
	CONSTRAINT "points_table_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"team_a_runs" integer DEFAULT 0 NOT NULL,
	"team_b_runs" integer DEFAULT 0 NOT NULL,
	"team_a_wickets" integer DEFAULT 0 NOT NULL,
	"team_b_wickets" integer DEFAULT 0 NOT NULL,
	"team_a_overs_played" real DEFAULT 0 NOT NULL,
	"team_b_overs_played" real DEFAULT 0 NOT NULL,
	"team_a_extras" integer DEFAULT 0 NOT NULL,
	"team_b_extras" integer DEFAULT 0 NOT NULL,
	"current_innings" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo" text,
	"short_name" varchar(10),
	"color" varchar(7) DEFAULT '#38bdf8',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tournament_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) DEFAULT 'ICE Cricket Mania – Season 2' NOT NULL,
	"default_overs" integer DEFAULT 10 NOT NULL,
	"matches_per_team" integer DEFAULT 3 NOT NULL,
	"points_per_win" integer DEFAULT 2 NOT NULL,
	"points_per_loss" integer DEFAULT 0 NOT NULL,
	"points_per_no_result" integer DEFAULT 1 NOT NULL,
	"players_per_team" integer DEFAULT 11 NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text,
	"role" "user_role" DEFAULT 'player' NOT NULL,
	"activation_token" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_toss_winner_teams_id_fk" FOREIGN KEY ("toss_winner") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_man_of_the_match_players_id_fk" FOREIGN KEY ("man_of_the_match") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_table" ADD CONSTRAINT "points_table_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;