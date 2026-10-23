import catchAsync from '../../utils/catch_async.js';
import manageResponse from '../../utils/manage_response.js';
import { project_service } from './project.service.js';

// students get their own projects, mentors get everyone's
const get_projects = catchAsync(async (req, res) => {
  const result =
    req.user!.role === 'MENTOR'
      ? await project_service.get_all_projects_from_db(req)
      : await project_service.get_my_projects_from_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Projects fetched successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const create_project = catchAsync(async (req, res) => {
  const result = await project_service.create_project_into_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 201,
    message: 'Project submitted successfully.',
    data: result,
  });
});

const update_project = catchAsync(async (req, res) => {
  const result = await project_service.update_project_into_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Project updated successfully.',
    data: result,
  });
});

const review_project = catchAsync(async (req, res) => {
  const result = await project_service.review_project_into_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Project reviewed successfully.',
    data: result,
  });
});

export const project_controller = {
  get_projects,
  create_project,
  update_project,
  review_project,
};
