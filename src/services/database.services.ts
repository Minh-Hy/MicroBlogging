import { MongoClient, Db, Collection, IndexSpecification, CreateIndexesOptions } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import Follower from '~/models/schemas/Followers.schemas'
import VideoStatus from '~/models/schemas/VideoStatus.schemas'
import Tweet from '~/models/schemas/Tweet.schemas'
import Hashtag from '~/models/schemas/Hashtags.schemas'
import Bookmark from '~/models/schemas/Bookmarks.schemas'
import Like from '~/models/schemas/Likes.schemas'
import Messages from '~/models/schemas/Messages.schemas'
import Reports from '~/models/schemas/Reports.schemas'
import NotificationModel from '~/models/schemas/Notification.schemas'


config()

// Type-safe collection names
const COLLECTIONS = {
  USERS: process.env.DB_USERS_COLLECTION as string,
  REFRESH_TOKENS: process.env.DB_REFRESH_TOKENS_COLLECTION as string,
  FOLLOWERS: process.env.DB_FOLLOWERS_COLLECTION as string,
  VIDEO_STATUS: process.env.DB_VIDEO_STATUS_COLLECTION as string,
  TWEETS: process.env.DB_TWEETS_COLLECTION as string,
  HASHTAGS: process.env.DB_HASHTAGS_COLLECTION as string,
  BOOKMARKS: process.env.DB_BOOKMARKS_COLLECTION as string,
  LIKES: process.env.DB_LIKES_COLLECTION as string,
  MESSAGES: process.env.DB_MESSAGES_COLLECTION as string,
  REPORTS: process.env.DB_REPORTS_COLLECTION as string,
  NOTIFICATIONS : process.env.DB_NOTIFICATIONS_COLLECTION as string
} as const
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.ommyd.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

class DatabaseService {
  private static instance: DatabaseService | null = null
  private client: MongoClient
  private db: Db
  private isConnected: boolean = false

  private constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async connect() {
    if (this.isConnected) {
      return
    }

    try {
      await this.client.connect()
      await this.db.command({ ping: 1 })
      this.isConnected = true
      console.log('Successfully connected to MongoDB!')
      
      // Initialize all indexes at startup
      await this.initializeIndexes()
    } catch (error) {
      console.error('MongoDB connection error:', error)
      throw error
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return
    }

    try {
      await this.client.close()
      this.isConnected = false
      console.log('Disconnected from MongoDB')
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error)
      throw error
    }
  }

  private async initializeIndexes() {
    interface IndexConfig {
      key: IndexSpecification
      options?: CreateIndexesOptions
    }

    interface CollectionConfig {
      collection: string
      indexes: IndexConfig[]
    }

    const indexConfigs: CollectionConfig[] = [
      {
        collection: COLLECTIONS.USERS,
        indexes: [
          { key: { email: 1, password: 1 } },
          { key: { email: 1 }, options: { unique: true } },
          { key: { username: 1 }, options: { unique: true } },
          { key: { name: "text", username: "text" } } 
        ]
      },
      {
        collection: COLLECTIONS.REFRESH_TOKENS,
        indexes: [
          { key: { token: 1 } },
          { key: { exp: 1 }, options: { expireAfterSeconds: 0 } }
        ]
      },
      {
        collection: COLLECTIONS.VIDEO_STATUS,
        indexes: [
          { key: { name: 1 } }
        ]
      },
      {
        collection: COLLECTIONS.FOLLOWERS,
        indexes: [
          { key: { user_id: 1 } },
          { key: { followed_user_id: 1 } }
        ]
      },
      {
        collection: COLLECTIONS.TWEETS,
        indexes: [
          { key: { content: 'text' }, options: { default_language: 'none' } }
        ]
      }
    ]

    for (const config of indexConfigs) {
      const collection = this.db.collection(config.collection)
      for (const index of config.indexes) {
        const indexName = Object.entries(index.key)
          .map(([key, value]) => `${key}_${value}`)
          .join('_')
        
        const indexExists = await collection.indexExists([indexName])
        if (!indexExists) {
          await collection.createIndex(index.key, index.options)
        }
      }
    }
  }

  // Keep old index methods for backwards compatibility
  async indexUser() {
    await this.connect()
    await this.initializeIndexes()
  }

  async indexRefreshToken() {
    await this.connect()
    await this.initializeIndexes()
  }

  async indexVideoStatus() {
    await this.connect()
    await this.initializeIndexes()
  }

  async indexFollowers() {
    await this.connect()
    await this.initializeIndexes()
  }

  async indexTweets() {
    await this.connect()
    await this.initializeIndexes()
  }

  // Type-safe collection getters
  get users(): Collection<User> {
    return this.db.collection(COLLECTIONS.USERS)
  }

  get RefreshTokens(): Collection<RefreshToken> {
    return this.db.collection(COLLECTIONS.REFRESH_TOKENS)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(COLLECTIONS.FOLLOWERS)
  }

  get videoStatus(): Collection<VideoStatus> {
    return this.db.collection(COLLECTIONS.VIDEO_STATUS)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(COLLECTIONS.TWEETS)
  }

  get hashtags(): Collection<Hashtag> {
    return this.db.collection(COLLECTIONS.HASHTAGS)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(COLLECTIONS.BOOKMARKS)
  }

  get likes(): Collection<Like> {
    return this.db.collection(COLLECTIONS.LIKES)
  }

  get messages(): Collection<Messages> {
    return this.db.collection(COLLECTIONS.MESSAGES)
  }

  get reports(): Collection<Reports> {
    return this.db.collection(COLLECTIONS.REPORTS)
  }

  get notifications(): Collection<NotificationModel> {
    return this.db.collection(COLLECTIONS.NOTIFICATIONS)
  }
}

// Export singleton instance
const databaseService = DatabaseService.getInstance()
export default databaseService
