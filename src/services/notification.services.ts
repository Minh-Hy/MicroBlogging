import { ObjectId } from 'mongodb';
import databaseService from './database.services';
import Notification, { NotificationType } from '~/models/schemas/Notification.schemas';

interface CreateNotificationPayload {
  user_id: string;
  sender_id: string;
  type: NotificationType;
  content?: string;
  tweet_id?: string;
}

class NotificationService {
  async createNotification(payload: CreateNotificationPayload) {
    const notification = new Notification({
      user_id: new ObjectId(payload.user_id),
      sender_id: new ObjectId(payload.sender_id),
      type: payload.type,
      content: payload.content,
      tweet_id: payload.tweet_id ? new ObjectId(payload.tweet_id) : undefined
    });

    await databaseService.notifications.insertOne(notification);
    return notification;
  }

  async getNotifications(user_id: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const notifications = await databaseService.notifications
      .find({ user_id: new ObjectId(user_id) })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await databaseService.notifications.countDocuments({ user_id: new ObjectId(user_id) });

    return { notifications, total };
  }

  async markAsRead(notification_id: string) {
    await databaseService.notifications.updateOne(
      { _id: new ObjectId(notification_id) },
      { $set: { is_read: true } }
    );
  }

   // Tạo notification từ Tweet interaction
  async createTweetInteractionNotify({
    action_by,
    target_user_id,
    tweet_id,
    type
  }: {
    action_by: string;
    target_user_id: string;
    tweet_id: string;
    type: NotificationType;
  }) {
    const notification = await this.createNotification({
      user_id: target_user_id,
      sender_id: action_by,
      type,
      tweet_id
    });

    return notification;
  }

  // Tạo notify cho follow
  async createFollowNotify({
    action_by,
    target_user_id
  }: {
    action_by: string;
    target_user_id: string;
  }) {
    const notification = await this.createNotification({
      user_id: target_user_id,
      sender_id: action_by,
      type: 'follow'
    });

    return notification;
  }
}

const notificationService = new NotificationService();
export default notificationService;
