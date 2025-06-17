import { ObjectId } from "mongodb"
import { TweetAudience, TweetType } from "~/constants/enums"
import { Media } from "../other"

interface TweetConstructor {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string// chi null khi tweet gốc
  hashtags: ObjectId[]
  mentions: string[]
  medias: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
  is_deleted?: boolean
  deleted_by?: ObjectId
  deleted_reason?: string
}

export default class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string                           
  parent_id: null | ObjectId // chi null khi tweet gốc
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
  is_deleted: boolean
  deleted_by?: ObjectId
  deleted_reason?: string
  constructor({_id, audience, content, guest_views, hashtags, medias, mentions, parent_id, type, user_id, user_views, created_at, updated_at, is_deleted = false, deleted_by, deleted_reason} : TweetConstructor) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.type = type
    this.audience = audience
    this.content = content
    this.parent_id = parent_id ? new ObjectId(parent_id) : null
    this.hashtags = hashtags
    this.mentions = mentions.map(item => new ObjectId(item))
    this.medias = medias
    this.guest_views = guest_views || 0
    this.user_views = user_views  || 0
    this.created_at = created_at || date
    this.updated_at = updated_at || date
    this.is_deleted = is_deleted
    this.deleted_by = deleted_by
    this.deleted_reason = deleted_reason
  }
}