import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import { rateLimiters } from '../../middlewares/rate_limiter.js';
import RequestValidator from '../../middlewares/request_validator.js';
import { account_controller } from './account.controller.js';
import { account_validation } from './account.validation.js';

const accountRouter = Router();

accountRouter.post(
  '/sign-up',
  rateLimiters.signUp,
  RequestValidator(account_validation.sign_up),
  account_controller.create_account,
);

accountRouter.post(
  '/sign-in',
  rateLimiters.signInIp,
  rateLimiters.signIn,
  RequestValidator(account_validation.sign_in),
  account_controller.login_user,
);

accountRouter.post(
  '/refresh-token',
  rateLimiters.refresh,
  RequestValidator(account_validation.refresh_token),
  account_controller.refresh_token,
);

accountRouter.post(
  '/sign-out',
  RequestValidator(account_validation.refresh_token),
  account_controller.sign_out,
);

accountRouter.post('/sign-out-all', auth(), account_controller.sign_out_everywhere);

accountRouter.get('/me', auth(), account_controller.get_user_account);

accountRouter.put(
  '/change-password',
  rateLimiters.changePassword,
  auth(),
  RequestValidator(account_validation.change_password),
  account_controller.change_password,
);

export default accountRouter;
