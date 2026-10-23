import { z } from 'zod';

// `name` is an example field: rename it or add yours here, in the database schema
// and in tests/routes/project.test.ts. Fields that aren't listed here are removed
// from req.body before it reaches the service.
const create_project = z.object({
  name: z.string('Name is required').trim().min(1).max(200),
});

const update_project = create_project.partial();

export const project_validations = {
  create_project,
  update_project,
};
