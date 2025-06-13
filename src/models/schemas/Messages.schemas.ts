import { ObjectId } from 'mongodb';

export type MessageTypeEnum = 'text' | 'image';

export interface MessageType {
  _id?: ObjectId;
  sender_id: ObjectId;
  receiver_id: ObjectId;
  content?: string;
  type: MessageTypeEnum;
  image_url?: string;
  read: boolean;
  created_at?: Date;
}

export default class Message {
  _id?: ObjectId;
  sender_id: ObjectId;
  receiver_id: ObjectId;
  content?: string;
  type: MessageTypeEnum;
  image_url?: string;
  read: boolean;
  created_at: Date;

  constructor(message: MessageType) {
    this._id = message._id;
    this.sender_id = message.sender_id;
    this.receiver_id = message.receiver_id;
    this.content = message.content;
    this.type = message.type;
    this.image_url = message.image_url;
    this.read = message.read ?? false;
    this.created_at = message.created_at || new Date();
  }
}
