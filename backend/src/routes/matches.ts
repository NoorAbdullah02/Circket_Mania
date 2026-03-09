import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.js';
import {
    createMatch, getAllMatches, getMatchById, updateMatch, deleteMatch,
    updateScore, completeMatch, autoGenerateMatches,
    getPointsTable, addCommentary, getCommentary,
    getDashboardStats, getTournamentSettings, updateTournamentSettings,
    getMatchPlayerStats, updateMatchPlayerStats
} from '../controllers/matches.js';

const router = Router();

router.get('/', getAllMatches);
router.get('/points-table', getPointsTable);
router.get('/dashboard-stats', authenticate, adminOnly, getDashboardStats);
router.get('/settings', getTournamentSettings);
router.get('/:id', getMatchById);
router.get('/:id/player-stats', getMatchPlayerStats);
router.get('/:matchId/commentary', getCommentary);

router.post('/', authenticate, adminOnly, createMatch);
router.post('/auto-generate', authenticate, adminOnly, autoGenerateMatches);
router.post('/:id/commentary', authenticate, adminOnly, addCommentary);

router.put('/settings', authenticate, adminOnly, updateTournamentSettings);
router.put('/:id', authenticate, adminOnly, updateMatch);
router.put('/:id/score', authenticate, adminOnly, updateScore);
router.put('/:id/complete', authenticate, adminOnly, completeMatch);
router.put('/:id/player-stats', authenticate, adminOnly, updateMatchPlayerStats);

router.delete('/:id', authenticate, adminOnly, deleteMatch);

export default router;
