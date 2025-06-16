import { MediaType } from "~/constants/enums";


export interface Media {
  url: string
  type: MediaType
}

export type NotificationType = 'like' | 'comment' | 'retweet' | 'quote' | 'follow' | 'chat' | 'bookmark' | 'mention' ;

export interface NotificationRealtimePayload {
  type: NotificationType;
  title: string;
  message: string;
  sender_id: string;
  tweet_id?: string;
  created_at: Date;
}

