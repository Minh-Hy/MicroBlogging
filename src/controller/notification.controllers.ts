import { Request, Response } from 'express';
import { TokenPayload } from '~/models/requests/user.requests';
import notificationsService from '~/services/notification.services';

export const getNotificationsController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;

  const { notifications, total } = await notificationsService.getNotifications(user_id, page, limit);

  res.json({
    message: 'Get notifications success',
    result: {
      notifications,
      total,
      page,
      limit,
      total_page: Math.ceil(total / limit)
    }
  });
};

export const markNotificationAsReadController = async (req: Request, res: Response) => {
  const { notification_id } = req.params;
  await notificationsService.markAsRead(notification_id);
  res.json({
    message: 'Mark as read success'
  });
};
