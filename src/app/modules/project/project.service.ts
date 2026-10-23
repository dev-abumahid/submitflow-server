import type { Request } from 'express';
import type { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app_error.js';
import type { project_validations } from './project.validation.js';

// req.body was already parsed by RequestValidator (see project.route.ts), so it only
// holds the fields of these schemas: add a field there before the service can use it
type CreatePayload = z.infer<typeof project_validations.create_project>;
type UpdatePayload = z.infer<typeof project_validations.update_project>;

const get_all_project_from_db = async (_req: Request) => {
  // define your own logic here
  const result = await prisma.project.findMany();
  return result;
};

const get_single_project_from_db = async (req: Request) => {
  // define your own logic here
  const { id } = req.params as { id: string };
  const result = await prisma.project.findUnique({
    where: { id },
  });
  if (!result) throw new AppError('project not found', 404);
  return result;
};

const create_project_into_db = async (req: Request) => {
  // define your own logic here
  const payload: CreatePayload = req.body;
  const result = await prisma.project.create({
    data: payload,
  });
  return result;
};

// update / delete of a missing record throw Prisma's P2025, which the global
// error handler turns into a 404
const update_project_into_db = async (req: Request) => {
  // define your own logic here
  const { id } = req.params as { id: string };
  const payload: UpdatePayload = req.body;
  const result = await prisma.project.update({
    where: { id },
    data: payload,
  });
  return result;
};

const delete_project_from_db = async (req: Request) => {
  // define your own logic here
  const { id } = req.params as { id: string };
  const result = await prisma.project.delete({
    where: { id },
  });
  return result;
};

export const project_service = {
  get_all_project_from_db,
  get_single_project_from_db,
  create_project_into_db,
  update_project_into_db,
  delete_project_from_db,
};
