import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { uploadFile } from '../controllers/upload.js';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.post('/', authenticate, upload.single('file'), uploadFile);
router.post('/public', upload.single('file'), uploadFile); // Public upload for registration

export default router;
