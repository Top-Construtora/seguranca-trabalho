import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { validationMiddleware } from '../middleware/validation.middleware';
import { LoginDto } from '../dto/login.dto';

const router: Router = Router();
const authService = new AuthService();

router.post('/login', validationMiddleware(LoginDto), async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : 'Authentication failed' });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    const user = await authService.validateToken(token);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const user = await authService.validateToken(token);
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;