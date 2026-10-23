import { z } from 'zod';

// only http(s) links, so `javascript:` & co can't end up in a mentor's browser
const url = (field: string) =>
  z.url({ protocol: /^https?$/, error: `${field} must be a valid http(s) URL` }).max(500);

// Fields that aren't listed here are removed from req.body before it reaches the service.
const create_project = z.object({
  name: z.string('Name is required').trim().min(1).max(200),
  description: z.string('Description is required').trim().min(1).max(5000),
  gitRepoUrl: url('gitRepoUrl'),
  previewUrl: url('previewUrl'),
});

const update_project = create_project
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update');

// mentors can't move a project back to PENDING, that would reopen it for student edits
const review_project = z.object({
  status: z.enum(['IN_PROGRESS', 'REJECTED', 'APPROVED'], 'Status is required'),
  reviewerFeedBack: z.string().trim().min(1).max(5000).optional(),
});

// query strings, parsed in the service (req.query is read-only in Express 5)
const student_query = z.object({
  searchTerm: z.string().trim().max(200).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'REJECTED', 'APPROVED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const mentor_query = student_query.extend({
  studentId: z.uuid().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const project_validations = {
  create_project,
  update_project,
  review_project,
  student_query,
  mentor_query,
};
