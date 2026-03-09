import { Router } from 'express';
import { authenticate, adminOnly, playerOrAdmin } from '../middleware/auth.js';
import {
    createTeam, getAllTeams, getTeamById, updateTeam, deleteTeam,
    assignPlayersToTeam, removePlayerFromTeam, setCaptain,
} from '../controllers/teams.js';

const router = Router();

router.get('/', getAllTeams);
router.get('/:id', getTeamById);
router.post('/', authenticate, adminOnly, createTeam);
router.put('/:id', authenticate, playerOrAdmin, updateTeam);
router.delete('/:id', authenticate, adminOnly, deleteTeam);
router.post('/assign-players', authenticate, adminOnly, assignPlayersToTeam);
router.post('/remove-player/:playerId', authenticate, adminOnly, removePlayerFromTeam);
router.post('/set-captain', authenticate, adminOnly, setCaptain);

export default router;
