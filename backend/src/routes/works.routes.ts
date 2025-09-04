import { Router } from 'express';
import { WorksService } from '../services/works.service';
import { authMiddleware, rolesMiddleware } from '../middleware/auth.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateWorkDto } from '../dto/create-work.dto';
import { UserRole } from '../entities/user.entity';

const router: Router = Router();
const worksService = new WorksService();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post('/', rolesMiddleware(UserRole.ADMIN), validationMiddleware(CreateWorkDto), async (req, res) => {
  try {
    const work = await worksService.create(req.body);
    res.status(201).json(work);
  } catch (error) {
    res.status(409).json({ message: error instanceof Error ? error.message : 'Failed to create work' });
  }
});

router.get('/', async (req, res) => {
  try {
    const works = await worksService.findAll();
    res.json(works);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch works' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const work = await worksService.findOne(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }
    res.json(work);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch work' });
  }
});

router.put('/:id', rolesMiddleware(UserRole.ADMIN), validationMiddleware(CreateWorkDto, true), async (req, res) => {
  try {
    const work = await worksService.update(req.params.id, req.body);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }
    res.json(work);
  } catch (error) {
    res.status(409).json({ message: error instanceof Error ? error.message : 'Failed to update work' });
  }
});

router.patch('/:id/toggle-active', rolesMiddleware(UserRole.ADMIN), async (req, res) => {
  try {
    const work = await worksService.toggleActive(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }
    res.json(work);
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle work active status' });
  }
});

export default router;