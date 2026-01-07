import { Router } from 'express';
import { UsersController } from '../controllers/users';
import { authenticate, isAdmin } from '../middlewares';

const users = Router();
const usersController = new UsersController();

users.get('/', authenticate, isAdmin, (req, res) => usersController.getAll(req, res));
users.get('/search', authenticate, (req, res) => usersController.search(req, res));
users.get('/:id', (req, res) => usersController.getAll(req, res));

export default users;
