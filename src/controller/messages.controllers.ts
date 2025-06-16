/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import messagesService from '~/services/messages.services';
import { SendMessageReqBody, MarkAsReadReqBody } from '~/models/requests/messages.requests';
import { TokenPayload } from '~/models/requests/user.requests';

class MessagesController {
  async sendMessage(req: Request<any, any, SendMessageReqBody>, res: Response) {
    const { receiver_id, content, type, image_url } = req.body;
    const { user_id: sender_id } = req.decoded_authorization as TokenPayload;

    const message = await messagesService.sendMessage({
      sender_id,
      receiver_id,
      content,
      type,
      image_url
    });

    res.json({ message: 'Send message success', result: message });
  }

  async getConversation(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const { partner_id, page = 1, pageSize = 20 } = req.query;

    const messages = await messagesService.getConversation(
      user_id,
      partner_id as string,
      Number(page),
      Number(pageSize)
    );
    res.json({ message: 'Get conversation success', result: messages });
  }

  async markAsRead(req: Request<any, any, MarkAsReadReqBody>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const { partner_id } = req.body;

    await messagesService.markAsRead(user_id, partner_id);
    res.json({ message: 'Mark as read success' });
  }
}

const messagesController = new MessagesController();
export default messagesController;
