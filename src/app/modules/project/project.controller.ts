import catchAsync from '../../utils/catch_async.js';
import manageResponse from '../../utils/manage_response.js';
import { project_service } from './project.service.js';

const get_all_project = catchAsync(async (req, res) => {
  const result = await project_service.get_all_project_from_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 200,
    message: 'All project fetched successfully.',
    data: result,
    meta: {},
  });
});

const get_single_project = catchAsync(async (req, res) => {
  const result = await project_service.get_single_project_from_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Single project fetched successfully.',
    data: result,
    meta: {},
  });
});

const create_project = catchAsync(async (req, res) => {
  const result = await project_service.create_project_into_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 201,
    message: 'project created successfully.',
    data: result,
    meta: {},
  });
});

const update_project = catchAsync(async (req, res) => {
  const result = await project_service.update_project_into_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 200,
    message: 'project updated successfully.',
    data: result,
    meta: {},
  });
});

const delete_project = catchAsync(async (req, res) => {
  const result = await project_service.delete_project_from_db(req);
  manageResponse(res, {
    success: true,
    statusCode: 200,
    message: 'project deleted successfully.',
    data: result,
    meta: {},
  });
});

export const project_controller = {
  get_all_project,
  get_single_project,
  create_project,
  update_project,
  delete_project,
};
