import { ObjectId, WithId } from 'mongodb'
import databaseService from './database.services'
import Like from '~/models/schemas/Likes.schemas'
import notificationsService from './notification.services'

class LikesService {
  async likeTweet(user_id: string, tweet_id: string) {
    const result: WithId<Like> | null = await databaseService.likes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Like({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    // Nếu like lần đầu (tức là vừa được insert mới)
    if (!result) {
      const tweet = await databaseService.tweets.findOne({
        _id: new ObjectId(tweet_id)
      })

      if (tweet && tweet.user_id.toString() !== user_id) {
        await notificationsService.createNotification({
          user_id: tweet.user_id.toString(),
          sender_id: user_id,
          type: 'like',
          content: 'đã thích bài viết của bạn',
          tweet_id: tweet_id
        })
      }
    }

    return result
  }

  async unlikeTweet(user_id: string, tweet_id: string) {
    return await databaseService.likes.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
  }
}

const likesService = new LikesService()
export default likesService
