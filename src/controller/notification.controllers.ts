import { Request, Response } from 'express';
import { TokenPayload } from '~/models/requests/user.requests';
import notificationService from '~/services/notification.services';

class NotificationsController {
  async getNotifications(req: Request, res: Response) {
    const user_id = (req.decoded_authorization as TokenPayload).user_id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const { notifications, total } = await notificationService.getNotifications(user_id, page, limit);

    res.json({
      message: 'Get notifications success',
      result: {
        notifications,
        page,
        limit,
        total_page: Math.ceil(total / limit)
      }
    });
  }

  async markAsRead(req: Request, res: Response) {
    const { notification_id } = req.params;
    await notificationService.markAsRead(notification_id);
    res.json({ message: 'Mark as read success' });
  }
}

const notificationsController = new NotificationsController();
export default notificationsController;
