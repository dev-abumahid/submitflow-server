import { Router } from 'express';
import accountRouter from './app/modules/account/account.route.js';
import projectRoute from './app/modules/project/project.route.js';

const appRouter = Router();

const moduleRoutes = [{ path: '/auth', route: accountRouter },
  { path: '/project', route: projectRoute },
];

moduleRoutes.forEach((route) => appRouter.use(route.path, route.route));
export default appRouter;
