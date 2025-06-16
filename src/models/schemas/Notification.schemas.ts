import { ObjectId } from 'mongodb';
import { NotificationType } from '~/models/other';

interface NotificationTypeSchema {
  _id?: ObjectId;
  user_id: ObjectId;
  sender_id: ObjectId;
  type: NotificationType;
  content?: string;
  tweet_id?: ObjectId;
  created_at?: Date;
  is_read?: boolean;
}

export default class Notification {
  _id?: ObjectId;
  user_id: ObjectId;
  sender_id: ObjectId;
  type: NotificationType;
  content: string;
  tweet_id?: ObjectId;
  created_at: Date;
  is_read: boolean;

  constructor(payload: NotificationTypeSchema) {
    this._id = payload._id;
    this.user_id = payload.user_id;
    this.sender_id = payload.sender_id;
    this.type = payload.type;
    this.content = payload.content || '';
    this.tweet_id = payload.tweet_id;
    this.created_at = payload.created_at || new Date();
    this.is_read = payload.is_read ?? false;
  }
}
