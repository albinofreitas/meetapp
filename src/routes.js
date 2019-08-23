import { Router } from 'express';

import AuthController from './app/controllers/AuthController';
import UserController from './app/controllers/UserController';

import AuthMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/users', UserController.store);
routes.post('/auth', AuthController.store);

routes.use(AuthMiddleware);

routes.put('/users', UserController.update);

export default routes;
