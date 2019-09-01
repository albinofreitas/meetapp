import { Router } from 'express';
import multer from 'multer';

import multerConfig from './config/multer';

import AuthController from './app/controllers/AuthController';
import UserController from './app/controllers/UserController';
import FileController from './app/controllers/FileController';

import AuthMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/auth', AuthController.store);

routes.use(AuthMiddleware);

routes.put('/users', UserController.update);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
