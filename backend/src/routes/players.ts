import { Router } from 'express';
import { authenticate, adminOnly, playerOrAdmin } from '../middleware/auth.js';
import {
    getAllPlayers, getPlayerById, updateProfile, adminUpdatePlayer,
    deletePlayer, bulkAction, getLeaderboard, getPlayerOfTheSeries,
    verifyTeamToken
} from '../controllers/players.js';

const router = Router();

router.get('/', getAllPlayers);
router.get('/leaderboard', getLeaderboard);
router.get('/series-mvp', getPlayerOfTheSeries);
router.get('/:id', getPlayerById);
router.put('/profile', authenticate, playerOrAdmin, updateProfile);
router.put('/:id', authenticate, adminOnly, adminUpdatePlayer);
router.delete('/:id', authenticate, adminOnly, deletePlayer);
router.post('/bulk-action', authenticate, adminOnly, bulkAction);
router.post('/verify-token', authenticate, verifyTeamToken);

export default router;
