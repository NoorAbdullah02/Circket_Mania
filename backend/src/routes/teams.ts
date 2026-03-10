import { Router } from 'express';
import { authenticate, adminOnly, playerOrAdmin, captainOrAdmin } from '../middleware/auth.js';
import {
    createTeam, getAllTeams, getTeamById, updateTeam, deleteTeam,
    assignPlayersToTeam, removePlayerFromTeam, setCaptain,
} from '../controllers/teams.js';

import { db } from '../db/index.js';
import { teams } from '../db/schema.js';

const router = Router();

router.get('/', getAllTeams);
router.get('/:id', getTeamById);
router.post('/', authenticate, adminOnly, createTeam);
router.put('/:id', authenticate, captainOrAdmin, updateTeam); // Team captains can also update their team
router.delete('/:id', authenticate, adminOnly, deleteTeam);
router.post('/assign-players', authenticate, adminOnly, assignPlayersToTeam);
router.post('/unassign-player', authenticate, adminOnly, removePlayerFromTeam);
router.post('/set-captain', authenticate, adminOnly, setCaptain);

export default router;
