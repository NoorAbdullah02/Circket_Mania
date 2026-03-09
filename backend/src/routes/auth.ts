import { Router } from 'express';
import { register, login, activateAccount, refreshAccessToken, getMe, logout } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/activate', activateAccount);
router.post('/refresh', refreshAccessToken);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;
