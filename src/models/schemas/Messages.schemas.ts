import { ObjectId } from 'mongodb'

interface MessageType {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content?: string
  type: 'text' | 'image'
  image_url?: string
  read?: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Message {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  type: 'text' | 'image'
  image_url: string
  read: boolean
  created_at: Date
  updated_at: Date

  constructor(data: MessageType) {
    const now = new Date()
    this._id = data._id || new ObjectId()
    this.sender_id = data.sender_id
    this.receiver_id = data.receiver_id
    this.content = data.content || ''
    this.type = data.type
    this.image_url = data.image_url || ''
    this.read = data.read ?? false
    this.created_at = data.created_at || now
    this.updated_at = data.updated_at || now
  }
}
