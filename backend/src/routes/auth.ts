import { Router } from 'express';
import {
    register, login, activateAccount, refreshAccessToken, getMe,
    logout, sendTestEmail, forgotPassword, resetPassword
} from '../controllers/auth.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/activate', activateAccount);
router.post('/refresh', refreshAccessToken);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);
router.post('/test-email', authenticate, adminOnly, sendTestEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
