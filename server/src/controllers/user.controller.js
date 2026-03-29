import * as userService from '../services/user.service.js';

export async function listUsers(req, res, next) {
  try {
    const users = await userService.listUsers(req.user.companyId);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const user = await userService.createUser({
      companyId: req.user.companyId,
      name,
      email,
      password,
      role,
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req.params.id, req.user.companyId, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id, req.user.companyId);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
}
