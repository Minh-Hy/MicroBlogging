import { NotificationType } from "../other"

export type ChatMessageType = 'text' | 'image'

export interface PrivateMessagePayload {
  to: string
  content?: string
  type: ChatMessageType
  image_url?: string
}

export interface ReceiveMessagePayload {
  from: string
  content: string
  type: ChatMessageType
  image_url?: string
  created_at: Date
}

export interface NotificationRealtimePayload {
  type: 'chat'
  title: string
  message: string
  sender_id: string
  created_at: Date
}

export interface InteractionPayload {
  type: NotificationType
  target_user_id: string
  tweet_id?: string
  content?: string
}

