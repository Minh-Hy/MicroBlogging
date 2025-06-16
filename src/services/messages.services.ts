import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import Message from '~/models/schemas/Messages.schemas'

interface CreateMessagePayload {
  sender_id: string
  receiver_id: string
  content?: string
  type: 'text' | 'image'
  image_url?: string
}

class MessagesService {
  async sendMessage(payload: CreateMessagePayload) {
    const message = new Message({
      sender_id: new ObjectId(payload.sender_id),
      receiver_id: new ObjectId(payload.receiver_id),
      content: payload.content,
      type: payload.type,
      image_url: payload.image_url
    })

    await databaseService.messages.insertOne(message)
    return message
  }

  async getConversation(user_id: string, partner_id: string, page: number, pageSize: number) {
    const query = {
      $or: [
        { sender_id: new ObjectId(user_id), receiver_id: new ObjectId(partner_id) },
        { sender_id: new ObjectId(partner_id), receiver_id: new ObjectId(user_id) }
      ]
    }

    const messages = await databaseService.messages
      .find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray()

    const total = await databaseService.messages.countDocuments(query)

    return {
      messages,
      total,
      page,
      pageSize,
      total_page: Math.ceil(total / pageSize)
    }
  }

  async markAsRead(user_id: string, partner_id: string) {
    await databaseService.messages.updateMany(
      {
        sender_id: new ObjectId(partner_id),
        receiver_id: new ObjectId(user_id),
        read: false
      },
      { $set: { read: true, updated_at: new Date() } }
    )
  }
}

const messagesService = new MessagesService()
export default messagesService
