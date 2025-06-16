export interface SendMessageReqBody {
  receiver_id: string
  content?: string
  type: 'text' | 'image'
  image_url?: string
}

export interface MarkAsReadReqBody {
  partner_id: string
}
