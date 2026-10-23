import catchAsync from '../../utils/catch_async.js';
import manageResponse from '../../utils/manage_response.js';
import { clearSessionCookies, createSession } from '../../utils/session.js';
import { account_services } from './account.service.js';

const create_account = catchAsync(async (req, res) => {
  const result = await account_services.create_account_into_db(req);
  manageResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Account created successfully',
    data: result,
  });
});

const login_user = catchAsync(async (req, res) => {
  const user = await account_services.login_user_into_db(req);
  const tokens = await createSession(res, user);
  manageResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: tokens,
  });
});

const get_user_account = catchAsync(async (req, res) => {
  const result = await account_services.get_user_account_from_db(req);

  manageResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account fetched successfully',
    data: result,
  });
});

const change_password = catchAsync(async (req, res) => {
  const user = await account_services.change_password_into_db(req);
  // every session was revoked, so give this one a fresh start
  const tokens = await createSession(res, user);
  manageResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password changed successfully',
    data: tokens,
  });
});

const refresh_token = catchAsync(async (req, res) => {
  const { user, familyId } = await account_services.refresh_session_from_db(req);
  const tokens = await createSession(res, user, familyId);
  manageResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Tokens refreshed successfully',
    data: tokens,
  });
});

const sign_out = catchAsync(async (req, res) => {
  await account_services.sign_out_from_db(req);
  clearSessionCookies(res);
  manageResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Signed out successfully',
  });
});

const sign_out_everywhere = catchAsync(async (req, res) => {
  await account_services.sign_out_everywhere_from_db(req);
  clearSessionCookies(res);
  manageResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Signed out from all devices',
  });
});

export const account_controller = {
  create_account,
  login_user,
  get_user_account,
  change_password,
  refresh_token,
  sign_out,
  sign_out_everywhere,
};
