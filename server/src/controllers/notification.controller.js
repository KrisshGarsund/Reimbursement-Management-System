import * as notificationService from '../services/notification.service.js';

export async function getNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    const unreadCount = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
}
