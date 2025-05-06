
import { MongoClient, Db, Collection} from 'mongodb'
import {config} from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schemas'
import Follower from '~/models/schemas/Followers.schemas'
import VideoStatus from '~/models/schemas/VideoStatus.schemas'
import Tweet from '~/models/schemas/Tweet.schemas'
import Hashtag from '~/models/schemas/Hashtags.schemas'
import Bookmark from '~/models/schemas/Bookmarks.schemas'
import Like from '~/models/schemas/Likes.schemas'
config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.ommyd.mongodb.net/?retryWrites=true&w=majority&appName=Twitter`
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

class DatabaseService {
  private client : MongoClient
  private db : Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect () {
    try {
      await this.db.command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch(error){
      console.log('Error', error)
      throw error
    }
  }

  async indexUser () {
    const exists = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1'])
    if(!exists) {
      this.users.createIndex({ email : 1 , password: 1})
      this.users.createIndex({ email : 1 }, { unique: true })
      this.users.createIndex({ username : 1 }, { unique: true })
    }
    
  }

  async indexRefreshToken () {
    const exists = await this.RefreshTokens.indexExists(['token_1', 'exp_1'])
    if(!exists) {
      this.RefreshTokens.createIndex({token : 1})
      this.RefreshTokens.createIndex({exp : 1}, { expireAfterSeconds: 0 })
    }
    
  }

  async indexVideoStatus () {
    const exists = await this.videoStatus.indexExists(['name_1'])
    if(!exists) {
      this.videoStatus.createIndex({ name : 1 })
    }
    
  }

  async indexFollowers () {
    const exists = await this.followers.indexExists(['user_id_1', 'followed_user_id_1'])
    if(!exists) {
      this.followers.createIndex({ user_id : 1 })
      this.followers.createIndex({ followed_user_id : 1 })
    }
    
  }
  get tweets () : Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
  }

  get users () : Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }

  get RefreshTokens () : Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }

  get followers () : Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string)
  }
  get videoStatus () : Collection<VideoStatus> {
    return this.db.collection(process.env.DB_VIDEO_STATUS_COLLECTION as string)
  }
  get hashtags () : Collection<Hashtag> {
    return this.db.collection(process.env.DB_HASHTAGS_COLLECTION as string)
  }
  get bookmarks () : Collection<Bookmark> {
    return this.db.collection(process.env.DB_BOOKMARKS_COLLECTION as string)
  }
  get likes() : Collection<Like> {
    return this.db.collection(process.env.DB_LIKES_COLLECTION as string)
  }

}

const databaseService = new DatabaseService()
export default databaseService

