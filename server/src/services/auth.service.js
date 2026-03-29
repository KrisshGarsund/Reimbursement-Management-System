import bcrypt from 'bcryptjs';
import axios from 'axios';
import prisma from '../config/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

export async function signup({ name, email, password, companyName, country, currency }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw ApiError.badRequest('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        country,
        currency,
      },
    });

    const user = await tx.user.create({
      data: {
        companyId: company.id,
        name,
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });

    return { company, user };
  });

  const tokenPayload = {
    id: result.user.id,
    email: result.user.email,
    role: result.user.role,
    companyId: result.company.id,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      companyId: result.company.id,
      companyName: result.company.name,
      companyCurrency: result.company.currency,
    },
  };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      companyCurrency: user.company.currency,
    },
  };
}

export async function refreshAccessToken(token) {
  if (!token) {
    throw ApiError.unauthorized('No refresh token');
  }

  const decoded = verifyRefreshToken(token);

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { company: true },
  });

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };

  const accessToken = generateAccessToken(tokenPayload);

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      companyCurrency: user.company.currency,
    },
  };
}
