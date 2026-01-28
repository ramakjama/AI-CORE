import { Router } from 'express';
import passport from 'passport';

const router = Router();

// OAuth2 routes placeholder
router.get('/authorize', (req, res) => {
  res.json({ success: true, message: 'OAuth authorize endpoint' });
});

router.post('/token', (req, res) => {
  res.json({ success: true, message: 'OAuth token endpoint' });
});

export default router;
