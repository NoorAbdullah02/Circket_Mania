import { pgTable, text, timestamp, boolean, integer, real, pgEnum, uuid, varchar } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'player']);
export const playerStatusEnum = pgEnum('player_status', ['pending', 'selected', 'activated', 'rejected']);
export const matchStatusEnum = pgEnum('match_status', ['upcoming', 'live', 'completed', 'cancelled', 'no_result', 'postponed']);

// Users table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: text('password'),
    role: userRoleEnum('role').notNull().default('player'),
    activationToken: text('activation_token'),
    isActive: boolean('is_active').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Players table
export const players = pgTable('players', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    batch: varchar('batch', { length: 10 }).notNull(),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    profileImage: text('profile_image'),
    bio: text('bio'),
    isCaptain: boolean('is_captain').notNull().default(false),
    status: playerStatusEnum('status').notNull().default('pending'),
    teamToken: varchar('team_token', { length: 20 }),
    jerseyNumber: integer('jersey_number'),
    role: varchar('player_role', { length: 50 }).default('Batsman'), // Batsman, Bowler, All-rounder, Wicketkeeper
    totalRuns: integer('total_runs').notNull().default(0),
    totalWickets: integer('total_wickets').notNull().default(0),
    matchesPlayed: integer('matches_played').notNull().default(0),
    totalBallsFaced: integer('total_balls_faced').notNull().default(0),
    totalBallsBowled: integer('total_balls_bowled').notNull().default(0),
    totalRunsConceded: integer('total_runs_conceded').notNull().default(0),
    totalSixes: integer('total_sixes').notNull().default(0),
    totalFours: integer('total_fours').notNull().default(0),
    totalCatches: integer('total_catches').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Teams table
export const teams = pgTable('teams', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    logo: text('logo'),
    shortName: varchar('short_name', { length: 10 }),
    color: varchar('color', { length: 7 }).default('#38bdf8'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Matches table
export const matches = pgTable('matches', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamAId: uuid('team_a_id').references(() => teams.id).notNull(),
    teamBId: uuid('team_b_id').references(() => teams.id).notNull(),
    overs: integer('overs').notNull().default(10),
    date: varchar('date', { length: 20 }).notNull(),
    time: varchar('time', { length: 20 }).notNull(),
    venue: varchar('venue', { length: 255 }).notNull(),
    status: matchStatusEnum('status').notNull().default('upcoming'),
    tossWinner: uuid('toss_winner').references(() => teams.id),
    tossDecision: varchar('toss_decision', { length: 10 }),
    winnerTeamId: uuid('winner_team_id').references(() => teams.id),
    manOfTheMatch: uuid('man_of_the_match').references(() => players.id),
    matchType: varchar('match_type', { length: 20 }).default('league'), // league, final
    scoreboardImage: text('scoreboard_image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Scores table
export const scores = pgTable('scores', {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
    teamARuns: integer('team_a_runs').notNull().default(0),
    teamBRuns: integer('team_b_runs').notNull().default(0),
    teamAWickets: integer('team_a_wickets').notNull().default(0),
    teamBWickets: integer('team_b_wickets').notNull().default(0),
    teamAOversPlayed: real('team_a_overs_played').notNull().default(0),
    teamBOversPlayed: real('team_b_overs_played').notNull().default(0),
    teamAExtras: integer('team_a_extras').notNull().default(0),
    teamBExtras: integer('team_b_extras').notNull().default(0),
    currentInnings: integer('current_innings').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Points table
export const pointsTable = pgTable('points_table', {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull().unique(),
    matchesPlayed: integer('matches_played').notNull().default(0),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    points: integer('points').notNull().default(0),
    nrr: real('nrr').notNull().default(0),
    totalRunsScored: integer('total_runs_scored').notNull().default(0),
    totalOversPlayed: real('total_overs_played').notNull().default(0),
    totalRunsConceded: integer('total_runs_conceded').notNull().default(0),
    totalOversBowled: real('total_overs_bowled').notNull().default(0),
});

// Tournament settings
export const tournamentSettings = pgTable('tournament_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull().default('ICE Cricket Mania – Season 2'),
    defaultOvers: integer('default_overs').notNull().default(10),
    matchesPerTeam: integer('matches_per_team').notNull().default(3),
    pointsPerWin: integer('points_per_win').notNull().default(2),
    pointsPerLoss: integer('points_per_loss').notNull().default(0),
    pointsPerNoResult: integer('points_per_no_result').notNull().default(1),
    playersPerTeam: integer('players_per_team').notNull().default(11),
    status: varchar('status', { length: 20 }).default('active'), // active, completed
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ball-by-ball commentary
export const commentary = pgTable('commentary', {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
    over: real('over_number').notNull(),
    ball: integer('ball_number').notNull(),
    runs: integer('runs').notNull().default(0),
    isWicket: boolean('is_wicket').notNull().default(false),
    isFour: boolean('is_four').notNull().default(false),
    isSix: boolean('is_six').notNull().default(false),
    isExtra: boolean('is_extra').notNull().default(false),
    extraType: varchar('extra_type', { length: 20 }),
    description: text('description'),
    innings: integer('innings').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Match Player Stats mapping (performance per match)
export const matchPlayerStats = pgTable('match_player_stats', {
    id: uuid('id').defaultRandom().primaryKey(),
    matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
    playerId: uuid('player_id').references(() => players.id, { onDelete: 'cascade' }).notNull(),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
    runsScored: integer('runs_scored').notNull().default(0),
    ballsFaced: integer('balls_faced').notNull().default(0),
    fours: integer('fours').notNull().default(0),
    sixes: integer('sixes').notNull().default(0),
    wickets: integer('wickets').notNull().default(0),
    runsConceded: integer('runs_conceded').notNull().default(0),
    ballsBowled: integer('balls_bowled').notNull().default(0),
    catches: integer('catches').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
