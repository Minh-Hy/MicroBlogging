import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'
import NotificationModel from '~/models/schemas/Notification.schemas'

class NotificationService {
  async createNotification(payload: {
    receiver_id: string,
    sender_id: string,
    type: "like" | "comment" | "follow" | "chat" | "system",
    tweet_id?: string,
    content?: string
  }) {
    const notification = new NotificationModel({
      receiver_id: new ObjectId(payload.receiver_id),
      sender_id: new ObjectId(payload.sender_id),
      type: payload.type,
      tweet_id: payload.tweet_id ? new ObjectId(payload.tweet_id) : undefined,
      content: payload.content,
      created_at: new Date(),
      is_read: false
    })

    await databaseService.notifications.insertOne(notification)
  }

  async getNotifications(receiver_id: string) {
    const notifications = await databaseService.notifications.find({
      receiver_id: new ObjectId(receiver_id)
    }).sort({ created_at: -1 }).toArray()

    return notifications
  }

  async markAsRead(receiver_id: string) {
    await databaseService.notifications.updateMany({
      receiver_id: new ObjectId(receiver_id),
      is_read: false
    }, {
      $set: { is_read: true }
    })
  }
}

export default new NotificationService()
