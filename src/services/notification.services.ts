import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Notification from '~/models/schemas/Notification.schemas'
import { NotificationPayload, NotificationType } from '~/models/other'
import { onlineUsers } from '~/socket/index' // để lấy list online realtime
import { Server } from 'socket.io'

class NotificationsService {
  private io?: Server

  injectSocket(io: Server) {
    this.io = io
  }

  async createNotification({
    user_id,
    sender_id,
    type,
    content,
    tweet_id
  }: {
    user_id: string
    sender_id: string
    type: NotificationType
    content?: string
    tweet_id?: string
  }) {
    const notification = new Notification({
      user_id: new ObjectId(user_id),
      sender_id: new ObjectId(sender_id),
      type,
      content,
      tweet_id: tweet_id ? new ObjectId(tweet_id) : undefined
    })

    await databaseService.notifications.insertOne(notification)
    return notification
  }

  async createNotificationAndEmit(payload: NotificationPayload) {
    const notification = await this.createNotification(payload)

    const receiverSocketId = onlineUsers[payload.user_id]?.socket_id
    if (receiverSocketId) {
      const userInfo = await databaseService.users.findOne({ _id: new ObjectId(payload.sender_id) })

      if (!userInfo) {
        console.warn(`User not found with sender_id ${payload.sender_id}`)
        return
      }

      this.io!.to(receiverSocketId).emit('notification', {
        _id: notification._id,
        type: notification.type,
        content: notification.content,
        tweet_id: notification.tweet_id,
        created_at: notification.created_at,
        is_read: notification.is_read,
        sender: {
          _id: userInfo._id,
          name: userInfo.name,
          username: userInfo.username,
          avatar: userInfo.avatar
        }
      })
    }
  }

  async getNotifications(user_id: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const notifications = await databaseService.notifications
      .aggregate([
        { $match: { user_id: new ObjectId(user_id) } },
        { $sort: { created_at: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'sender_id',
            foreignField: '_id',
            as: 'sender'
          }
        },
        { $unwind: '$sender' },
        {
          $project: {
            _id: 1,
            type: 1,
            content: 1,
            tweet_id: 1,
            created_at: 1,
            is_read: 1,
            sender: {
              _id: '$sender._id',
              name: '$sender.name',
              username: '$sender.username',
              avatar: '$sender.avatar'
            }
          }
        },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray()

    const total = await databaseService.notifications.countDocuments({ user_id: new ObjectId(user_id) })

    return { notifications, total }
  }

  async markAsRead(notification_id: string) {
    const result = await databaseService.notifications.updateOne(
      { _id: new ObjectId(notification_id) },
      { $set: { is_read: true } }
    )
    if (result.matchedCount === 0) {
      throw new Error('Notification not found')
    }
  }

  private getNotificationTitle(type: NotificationType): string {
    switch (type) {
      case 'like':
        return 'Someone liked your tweet'
      case 'comment':
        return 'Someone commented on your tweet'
      case 'retweet':
        return 'Someone retweeted you'
      case 'quote':
        return 'Someone quoted your tweet'
      case 'follow':
        return 'You have a new follower'
      case 'chat':
        return 'New message'
      case 'bookmark':
        return 'Someone bookmarked your tweet'
      default:
        return 'New notification'
    }
  }
}

const notificationsService = new NotificationsService()
export default notificationsService
