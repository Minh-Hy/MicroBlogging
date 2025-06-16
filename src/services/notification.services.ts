import { ObjectId } from 'mongodb';
import databaseService from './database.services';
import Notification from '~/models/schemas/Notification.schemas';
import { NotificationType } from '~/models/other';
import { onlineUsers } from '~/socket/index'; // để lấy list online realtime
import { Server } from 'socket.io';

class NotificationsService {
  io: Server | null = null;

  initSocketIO(io: Server) {
    this.io = io;
  }

  async createNotification({
    user_id,
    sender_id,
    type,
    content,
    tweet_id
  }: {
    user_id: string;
    sender_id: string;
    type: NotificationType;
    content?: string;
    tweet_id?: string;
  }) {
    const notification = new Notification({
      user_id: new ObjectId(user_id),
      sender_id: new ObjectId(sender_id),
      type,
      content,
      tweet_id: tweet_id ? new ObjectId(tweet_id) : undefined
    });

    await databaseService.notifications.insertOne(notification);
    return notification;
  }

  async createNotificationAndEmit({
    user_id,
    sender_id,
    type,
    content,
    tweet_id
  }: {
    user_id: string;
    sender_id: string;
    type: NotificationType;
    content?: string;
    tweet_id?: string;
  }) {
    const notification = await this.createNotification({
      user_id,
      sender_id,
      type,
      content,
      tweet_id
    });

    const receiver_socket_id = onlineUsers[user_id]?.socket_id;
    if (receiver_socket_id && this.io) {
      this.io.to(receiver_socket_id).emit('notification', {
        type,
        title: this.getNotificationTitle(type),
        message: content ?? '',
        sender_id,
        tweet_id,
        created_at: notification.created_at
      });
    }

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
    const result = await databaseService.notifications.updateOne(
      { _id: new ObjectId(notification_id) },
      { $set: { is_read: true } }
    );
    if (result.matchedCount === 0) {
      throw new Error('Notification not found');
    }
  }

  private getNotificationTitle(type: NotificationType): string {
    switch (type) {
      case 'like':
        return 'Someone liked your tweet';
      case 'comment':
        return 'Someone commented on your tweet';
      case 'retweet':
        return 'Someone retweeted you';
      case 'quote':
        return 'Someone quoted your tweet';
      case 'follow':
        return 'You have a new follower';
      case 'chat':
        return 'New message';
      case 'bookmark':
        return 'Someone bookmarked your tweet';
      default:
        return 'New notification';
    }
  }
}

const notificationsService = new NotificationsService();
export default notificationsService;
