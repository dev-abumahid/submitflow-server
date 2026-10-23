import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import RequestValidator from '../../middlewares/request_validator.js';
import { project_controller } from './project.controller.js';
import { project_validations } from './project.validation.js';

const router = Router();

router.get('/', auth('STUDENT', 'MENTOR'), project_controller.get_projects);
router.post(
  '/',
  auth('STUDENT'),
  RequestValidator(project_validations.create_project),
  project_controller.create_project,
);
router.patch(
  '/:id',
  auth('STUDENT'),
  RequestValidator(project_validations.update_project),
  project_controller.update_project,
);
router.put(
  '/:id',
  auth('MENTOR'),
  RequestValidator(project_validations.review_project),
  project_controller.review_project,
);

export default router;
