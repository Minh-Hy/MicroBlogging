import { ObjectId } from "mongodb";

export type NotificationType = "like" | "comment" | "follow" | "chat" | "system";

interface NotificationTypePayload {
  _id?: ObjectId;
  receiver_id: ObjectId;
  sender_id: ObjectId;
  type: NotificationType;
  tweet_id?: ObjectId;
  content?: string;
  created_at?: Date;
  is_read?: boolean;
}

export default class NotificationModel {
  _id?: ObjectId;
  receiver_id: ObjectId;
  sender_id: ObjectId;
  type: NotificationType;
  tweet_id?: ObjectId;
  content: string;
  created_at: Date;
  is_read: boolean;

  constructor(payload: NotificationTypePayload) {
    const date = new Date();
    this._id = payload._id;
    this.receiver_id = payload.receiver_id;
    this.sender_id = payload.sender_id;
    this.type = payload.type;
    this.tweet_id = payload.tweet_id;
    this.content = payload.content || "";
    this.created_at = payload.created_at || date;
    this.is_read = payload.is_read ?? false;
  }
}
