import { Router } from 'express';
import RequestValidator from '../../middlewares/request_validator.js';
import { project_controller } from './project.controller.js';
import { project_validations } from './project.validation.js';

const router = Router();

// public routes: protect them with auth() from '../../middlewares/auth.js', e.g.
// router.post('/', auth('ADMIN'), ...), or generate the module with --auth
router.get('/', project_controller.get_all_project);
router.post(
  '/',
  RequestValidator(project_validations.create_project),
  project_controller.create_project,
);
router.get('/:id', project_controller.get_single_project);
router.patch(
  '/:id',
  RequestValidator(project_validations.update_project),
  project_controller.update_project,
);
router.delete('/:id', project_controller.delete_project);

export default router;
