import { NotificationType } from "../other";

export interface payload {
   user_id: string;
      sender_id: string;
      type: NotificationType;
      content?: string;
      tweet_id?: string;
}