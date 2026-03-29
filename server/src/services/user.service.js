import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { ApiError } from '../utils/apiError.js';

export async function listUsers(companyId) {
  return prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerId: true,
      isManagerApprover: true,
      createdAt: true,
      manager: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createUser({ companyId, name, email, password, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.badRequest('Email already in use');
  }

  const passwordHash = await bcrypt.hash(password || 'TempPass123!', 12);

  return prisma.user.create({
    data: {
      companyId,
      name,
      email,
      passwordHash,
      role: role || 'EMPLOYEE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerId: true,
      isManagerApprover: true,
      createdAt: true,
    },
  });
}

export async function updateUser(userId, companyId, updates) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) throw ApiError.notFound('User not found');

  const data = {};
  if (updates.role) data.role = updates.role;
  if (updates.managerId !== undefined) data.managerId = updates.managerId || null;
  if (updates.isManagerApprover !== undefined) data.isManagerApprover = updates.isManagerApprover;
  if (updates.name) data.name = updates.name;

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managerId: true,
      isManagerApprover: true,
      createdAt: true,
      manager: { select: { id: true, name: true } },
    },
  });
}

export async function deleteUser(userId, companyId) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'ADMIN') throw ApiError.badRequest('Cannot delete admin user');

  return prisma.user.delete({ where: { id: userId } });
}
