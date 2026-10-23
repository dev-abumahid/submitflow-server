import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import type { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app_error.js';
import { project_validations } from './project.validation.js';


type CreatePayload = z.infer<typeof project_validations.create_project>;
type UpdatePayload = z.infer<typeof project_validations.update_project>;
type ReviewPayload = z.infer<typeof project_validations.review_project>;

const person = { select: { id: true, fullName: true, email: true } };

const find_projects = async (
  where: Prisma.ProjectWhereInput,
  query: { searchTerm?: string; status?: Prisma.ProjectWhereInput['status'] },
  { page, limit, sortOrder }: { page: number; limit: number; sortOrder: 'asc' | 'desc' },
) => {
  const filter: Prisma.ProjectWhereInput = {
    ...where,
    ...(query.searchTerm && { name: { contains: query.searchTerm, mode: 'insensitive' } }),
    ...(query.status && { status: query.status }),
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where: filter,
      orderBy: { createdAt: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: { submitter: person, reviewer: person },
    }),
    prisma.project.count({ where: filter }),
  ]);

  return { data, meta: { page, limit, total } };
};

const get_my_projects_from_db = async (req: Request) => {
  const query = project_validations.student_query.parse(req.query);
  return find_projects({ submitterId: req.user!.accountId }, query, {
    ...query,
    sortOrder: 'desc',
  });
};

const get_all_projects_from_db = async (req: Request) => {
  const query = project_validations.mentor_query.parse(req.query);
  return find_projects(query.studentId ? { submitterId: query.studentId } : {}, query, query);
};

const create_project_into_db = async (req: Request) => {
  const payload: CreatePayload = req.body;
  const result = await prisma.project.create({
    data: { ...payload, submitterId: req.user!.accountId },
  });
  return result;
};

const update_project_into_db = async (req: Request) => {
  const { id } = req.params as { id: string };
  const payload: UpdatePayload = req.body;

  // the status check is part of the update, so a mentor picking the project up
  // at the same moment can't be overwritten
  const { count } = await prisma.project.updateMany({
    where: { id, submitterId: req.user!.accountId, status: 'PENDING' },
    data: payload,
  });

  if (!count) {
    const project = await prisma.project.findFirst({
      where: { id, submitterId: req.user!.accountId },
      select: { status: true },
    });
    if (!project) throw new AppError('Project not found', 404);
    throw new AppError(`Project can't be updated once it is ${project.status}`, 409);
  }

  return prisma.project.findUnique({ where: { id } });
};

// a missing project throws Prisma's P2025, which the global error handler turns into a 404
const review_project_into_db = async (req: Request) => {
  const { id } = req.params as { id: string };
  const payload: ReviewPayload = req.body;
  const result = await prisma.project.update({
    where: { id },
    data: { ...payload, reviewerId: req.user!.accountId },
    include: { submitter: person, reviewer: person },
  });
  return result;
};

const get_single_project_from_db = async (req: Request) => {
  const { id } = req.params as { id: string };
  const where: Prisma.ProjectWhereInput =
    req.user!.role === 'MENTOR' ? { id } : { id, submitterId: req.user!.accountId };

  const project = await prisma.project.findFirst({
    where,
    include: { submitter: person, reviewer: person },
  });

  if (!project) throw new AppError('Project not found', 404);
  return project;
};

export const project_service = {
  get_my_projects_from_db,
  get_all_projects_from_db,
  get_single_project_from_db,
  create_project_into_db,
  update_project_into_db,
  review_project_into_db,
};
