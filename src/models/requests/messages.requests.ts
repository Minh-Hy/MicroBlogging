export interface SendMessageReqBody {
  receiver_id: string;
  content?: string;
  type: 'text' | 'image';
  image_url?: string;
}
