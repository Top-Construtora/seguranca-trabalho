import { Router } from 'express';
import { UsersService } from '../services/users.service';
import { authMiddleware, rolesMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRole } from '../entities/user.entity';

const router: Router = Router();
const usersService = new UsersService();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post('/', rolesMiddleware(UserRole.ADMIN), validationMiddleware(CreateUserDto), async (req, res) => {
  try {
    const user = await usersService.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(409).json({ message: error instanceof Error ? error.message : 'Failed to create user' });
  }
});

router.get('/', rolesMiddleware(UserRole.ADMIN), async (req, res) => {
  try {
    const users = await usersService.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await usersService.findOne(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.patch('/:id/toggle-active', rolesMiddleware(UserRole.ADMIN), async (req, res) => {
  try {
    const user = await usersService.toggleActive(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle user active status' });
  }
});

export default router;