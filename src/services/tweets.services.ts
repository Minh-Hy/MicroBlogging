/* eslint-disable @typescript-eslint/no-unused-vars */
import notificationsService from '~/services/notification.services'
import { TweetRequestBody } from '~/models/requests/tweets.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schemas'
import { ObjectId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtags.schemas'
import { TweetType } from '~/constants/enums'
import { NotificationType } from '~/models/other'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import { TWEET_MESSAGES } from '~/constants/messages'

class TweetsService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new Hashtag({ name: hashtag }) },
          { upsert: true, returnDocument: 'after' }
        )
      })
    )
    return hashtagDocuments
      .map((result) => result.value?._id)
      .filter((id): id is ObjectId => id !== undefined && id !== null)
  }

  async createTweet(user_id: string, body: TweetRequestBody) {
    const hashtags = await this.checkAndCreateHashtags(body.hashtags)
    const tweetObj = new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags: hashtags,
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id,
      type: body.type,
      user_id: new ObjectId(user_id),
      is_deleted: false
    })

    const result = await databaseService.tweets.insertOne(tweetObj)
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })

    await this.createInteractionNotification(user_id, body.type, body.parent_id ?? undefined, tweetObj._id)
    return tweet
  }

  private async createInteractionNotification(
    actorUserId: string,
    tweetType: TweetType,
    parentId?: string,
    newTweetId?: ObjectId
  ) {
    const notificationType = this.mapTweetTypeToNotificationType(tweetType)
    if (!notificationType || !parentId) return

    const parentTweet = await databaseService.tweets.findOne({ _id: new ObjectId(parentId) })
    if (parentTweet && parentTweet.user_id.toString() !== actorUserId) {
      await notificationsService.createNotificationAndEmit({
        user_id: parentTweet.user_id.toString(),
        sender_id: actorUserId,
        type: notificationType,
        content: '',
        tweet_id: newTweetId?.toString()
      })
    }
  }

  private mapTweetTypeToNotificationType(tweetType: TweetType): NotificationType | null {
    switch (tweetType) {
      case 1:
        return 'retweet'
      case 2:
        return 'comment'
      case 3:
        return 'quote'
      default:
        return null
    }
  }

  /** XÓA CỨNG: người dùng tự xóa */
  async deleteTweet(user_id: string, tweet_id: string) {
    const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(tweet_id) })
    if (!tweet) throw new Error('Tweet not found')
    if (tweet.user_id.toString() !== user_id) throw new Error('Permission denied')

    await databaseService.tweets.deleteOne({ _id: new ObjectId(tweet_id) })
    await Promise.all([
      databaseService.likes.deleteMany({ tweet_id: new ObjectId(tweet_id) }),
      databaseService.bookmarks.deleteMany({ tweet_id: new ObjectId(tweet_id) }),
      databaseService.tweets.deleteMany({ parent_id: new ObjectId(tweet_id) })
    ])
  }

  /** XÓA MỀM: Admin duyệt report */
  async softDeleteByAdmin(tweet_id: string, admin_user_id: string, reason: string) {
  const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(tweet_id) })
  if (!tweet) throw new Error('Tweet not found')

  await databaseService.tweets.updateOne(
    { _id: new ObjectId(tweet_id) },
    { $set: { 
        is_deleted: true, 
        deleted_by: new ObjectId(admin_user_id), 
        deleted_reason: reason, 
        updated_at: new Date() 
      } 
    }
  )
}

async updateTweet(user_id: string, tweet_id: string, updateData: Partial<TweetRequestBody>) {
  const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(tweet_id) })

  if (!tweet) {
    throw new ErrorWithStatus({ status: HTTP_STATUS.NOT_FOUND, message: TWEET_MESSAGES.TWEET_NOT_FOUND })
  }

  if (tweet.user_id.toString() !== user_id) {
    throw new ErrorWithStatus({ status: HTTP_STATUS.FORBIDDEN, message: TWEET_MESSAGES.UPDATE_PERMISSION_DENIED })
  }

  if (tweet.is_deleted) {
    throw new ErrorWithStatus({ status: HTTP_STATUS.BAD_REQUEST, message: 'Cannot update deleted tweet' })
  }

  let hashtags: ObjectId[] = tweet.hashtags

  if (updateData.hashtags) {
    hashtags = await this.checkAndCreateHashtags(updateData.hashtags)
  }

  await databaseService.tweets.updateOne(
    { _id: new ObjectId(tweet_id) },
    {
      $set: {
        content: updateData.content ?? tweet.content,
        audience: updateData.audience ?? tweet.audience,
        hashtags,
        mentions: updateData.mentions?.map((id) => new ObjectId(id)) ?? tweet.mentions,
        medias: updateData.medias ?? tweet.medias,
        updated_at: new Date()
      }
    }
  )

  const updatedTweet = await databaseService.tweets.findOne({ _id: new ObjectId(tweet_id) })
  return updatedTweet
}


  async increaseView(tweet_id: string, user_id: string | undefined): Promise<Tweet | null> {
    const result = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id), is_deleted: false },
      { $inc: { guest_views: 1, user_views: 1 }, $set: { updated_at: new Date() } },
      { returnDocument: 'after' }
    )
    return result.value
  }

  async getTweetChildren({
    tweet_id,
    page,
    limit,
    tweet_type,
    user_id
  }: {
    tweet_id: string
    page: number
    limit: number
    tweet_type: TweetType
    user_id?: string
  }) {
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        { $match: { parent_id: new ObjectId(tweet_id), type: tweet_type, is_deleted: false } },
        { $lookup: { from: 'hashtags', localField: 'hashtags', foreignField: '_id', as: 'hashtags' } },
        { $lookup: { from: 'users', localField: 'mentions', foreignField: '_id', as: 'mentions' } },
        {
          $addFields: {
            mentions: {
              $map: {
                input: '$mentions',
                as: 'mention',
                in: {
                  _id: '$$mention._id',
                  name: '$$mention.name',
                  username: '$$mention.username',
                  email: '$$mention.email'
                }
              }
            }
          }
        },
        { $lookup: { from: 'bookmarks', localField: '_id', foreignField: 'tweet_id', as: 'bookmarks' } },
        { $lookup: { from: 'likes', localField: '_id', foreignField: 'tweet_id', as: 'likes' } },
        { $lookup: { from: 'tweets', localField: '_id', foreignField: 'parent_id', as: 'tweet_children' } },
        {
          $addFields: {
            bookmarks: { $size: '$bookmarks' },
            likes: { $size: '$likes' },
            retweet_count: {
              $size: {
                $filter: { input: '$tweet_children', as: 'item', cond: { $eq: ['$$item.type', TweetType.Retweet] } }
              }
            },
            comment_count: {
              $size: {
                $filter: { input: '$tweet_children', as: 'item', cond: { $eq: ['$$item.type', TweetType.Comment] } }
              }
            },
            quote_count: {
              $size: {
                $filter: { input: '$tweet_children', as: 'item', cond: { $eq: ['$$item.type', TweetType.QuoteTweet] } }
              }
            }
          }
        },
        { $project: { tweet_children: 0 } },
        { $skip: limit * (page - 1) },
        { $limit: limit }
      ])
      .toArray()

    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()

    const [, total] = await Promise.all([
      databaseService.tweets.updateMany({ _id: { $in: ids } }, { $inc: inc, $set: { updated_at: date } }),
      databaseService.tweets.countDocuments({ parent_id: new ObjectId(tweet_id), type: tweet_type, is_deleted: false })
    ])

    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) tweet.user_views += 1
      else tweet.guest_views += 1
    })

    return { tweets, total }
  }

  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
  const user_id_obj = new ObjectId(user_id)

  const followed_user_ids = await databaseService.followers
    .find({ user_id: user_id_obj }, { projection: { followed_user_id: 1, _id: 0 } })
    .toArray()

  const ids = followed_user_ids.map((item) => item.followed_user_id)
  ids.push(user_id_obj)

  const tweets = await databaseService.tweets.aggregate<Tweet>([
    {
      $match: {
        user_id: { $in: ids },
        is_deleted: false
      }
    },
    { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $match: {
        $or: [
          { audience: 0 },
          { $and: [{ audience: 1 }, { 'user.twitter_circle': { $in: [user_id_obj] } }] }
        ]
      }
    },
    { $sort: { created_at: -1 } },
    { $skip: limit * (page - 1) },
    { $limit: limit },

    // Hashtags & Mentions
    { $lookup: { from: 'hashtags', localField: 'hashtags', foreignField: '_id', as: 'hashtags' } },
    { $lookup: { from: 'users', localField: 'mentions', foreignField: '_id', as: 'mentions' } },
    {
      $addFields: {
        mentions: {
          $map: {
            input: '$mentions',
            as: 'mention',
            in: {
              _id: '$$mention._id',
              name: '$$mention.name',
              username: '$$mention.username',
              email: '$$mention.email'
            }
          }
        }
      }
    },

    // Tổng số bookmarks, likes
    { $lookup: { from: 'bookmarks', localField: '_id', foreignField: 'tweet_id', as: 'bookmarks' } },
    { $addFields: { bookmarks: { $size: '$bookmarks' } } },
    { $lookup: { from: 'likes', localField: '_id', foreignField: 'tweet_id', as: 'likes' } },
    { $addFields: { likes: { $size: '$likes' } } },

    // User đã like hay chưa
    {
      $lookup: {
        from: 'likes',
        let: { tweetId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$tweet_id', '$$tweetId'] },
                  { $eq: ['$user_id', user_id_obj] }
                ]
              }
            }
          }
        ],
        as: 'my_like'
      }
    },
    { $addFields: { is_liked: { $gt: [{ $size: '$my_like' }, 0] } } },

    // Kiểm tra đã retweet chưa
    {
      $lookup: {
        from: 'tweets',
        let: { tweetId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$parent_id', '$$tweetId'] },
                  { $eq: ['$user_id', user_id_obj] },
                  { $eq: ['$type', 1] } // 1 = Retweet
                ]
              }
            }
          }
        ],
        as: 'my_retweet'
      }
    },
    { $addFields: { is_retweeted: { $gt: [{ $size: '$my_retweet' }, 0] } } },

    // Kiểm tra đã quote chưa
    {
      $lookup: {
        from: 'tweets',
        let: { tweetId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$parent_id', '$$tweetId'] },
                  { $eq: ['$user_id', user_id_obj] },
                  { $eq: ['$type', 3] } // 3 = Quote
                ]
              }
            }
          }
        ],
        as: 'my_quote'
      }
    },
    { $addFields: { is_quoted: { $gt: [{ $size: '$my_quote' }, 0] } } },

    // Tổng số retweet/comment/quote:
    {
      $lookup: {
        from: 'tweets',
        localField: '_id',
        foreignField: 'parent_id',
        as: 'tweet_children'
      }
    },
    {
      $addFields: {
        retweet_count: {
          $size: {
            $filter: {
              input: '$tweet_children',
              as: 'item',
              cond: { $eq: ['$$item.type', 1] }
            }
          }
        },
        comment_count: {
          $size: {
            $filter: {
              input: '$tweet_children',
              as: 'item',
              cond: { $eq: ['$$item.type', 2] }
            }
          }
        },
        quote_count: {
          $size: {
            $filter: {
              input: '$tweet_children',
              as: 'item',
              cond: { $eq: ['$$item.type', 3] }
            }
          }
        }
      }
    },

    // Clean data output
    {
      $project: {
        tweet_children: 0,
        my_like: 0,
        my_retweet: 0,
        my_quote: 0,
        'user.password': 0,
        'user.email_verify_token': 0,
        'user.forgot_password_token': 0,
        'user.twitter_circle': 0,
        'user.date_of_birth': 0
      }
    }
  ]).toArray()

  // Xử lý tăng view:
  const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId)
  const date = new Date()

  await databaseService.tweets.updateMany(
    { _id: { $in: tweet_ids } },
    {
      $inc: { user_views: 1 },
      $set: { updated_at: date }
    }
  )

  tweets.forEach((tweet) => {
    tweet.updated_at = date
    tweet.user_views += 1
  })

  const total = await databaseService.tweets.countDocuments({
    user_id: { $in: ids },
    is_deleted: false
  })

  return {
    tweets,
    total
  }
}

}

const tweetsService = new TweetsService()
export default tweetsService
