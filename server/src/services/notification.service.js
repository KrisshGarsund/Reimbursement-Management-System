import prisma from '../config/db.js';
import { emitToUser } from '../config/socket.js';

export async function createNotification(userId, expenseId, message) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      expenseId,
      message,
    },
  });

  // Emit real-time notification
  try {
    emitToUser(userId, 'notification', notification);
  } catch (e) {
    // Socket may not be initialized in tests
  }

  return notification;
}

export async function getUserNotifications(userId, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      expense: {
        select: { id: true, category: true, amount: true, currency: true, status: true },
      },
    },
  });
}

export async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) return null;

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}
