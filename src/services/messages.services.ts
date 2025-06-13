import { ObjectId } from 'mongodb';
import Message from '~/models/schemas/Messages.schemas';
import databaseService from './database.services';
import { SendMessageReqBody } from '~/models/requests/messages.requests';

class MessagesService {
  async dsendMessage(sender_id: string, payload: SendMessageReqBody) {
    const message = new Message({
      sender_id: new ObjectId(sender_id),
      receiver_id: new ObjectId(payload.receiver_id),
      content: payload.content,
      type: payload.type,
      image_url: payload.image_url,
      read: false
    });

    const result = await databaseService.messages.insertOne(message);
    return { ...message, _id: result.insertedId };
  }

  async getConversation(user_id: string, partner_id: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    const messages = await databaseService.messages
      .find({
        $or: [
          { sender_id: new ObjectId(user_id), receiver_id: new ObjectId(partner_id) },
          { sender_id: new ObjectId(partner_id), receiver_id: new ObjectId(user_id) }
        ]
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    return messages.reverse(); // đảo ngược về thứ tự thời gian tăng dần
  }

  async markAsRead(user_id: string, partner_id: string) {
    await databaseService.messages.updateMany(
      {
        sender_id: new ObjectId(partner_id),
        receiver_id: new ObjectId(user_id),
        read: false
      },
      { $set: { read: true } }
    );
  }
}

const messagesService = new MessagesService();
export default messagesService;
