/* eslint-disable @typescript-eslint/no-unused-vars */
import notificationsService from '~/services/notification.services'
import { TweetRequestBody } from '~/models/requests/tweets.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schemas'
import { ObjectId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtags.schemas'
import { TweetType } from '~/constants/enums'
import { NotificationType } from '~/models/other'

class TweetsService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        //Tim hashtag trong db neu co thi lay, neu khong thi tao moi
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )
    return hashtagDocuments
      .map((result) => result.value?._id)
      .filter((id): id is ObjectId => id !== undefined && id !== null)
  }
  async createTweet(user_id: string, body: TweetRequestBody) {
      console.log('=== Create Tweet Called ===', body.type, body.parent_id)
    const hashtags = await this.checkAndCreateHashtags(body.hashtags)

    const tweetObj = new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags: hashtags,
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id,
      type: body.type,
      user_id: new ObjectId(user_id)
    })

    
    const result = await databaseService.tweets.insertOne(tweetObj)
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })

    // ✅ Sau khi tạo tweet, tự động tạo notification nếu cần
    await this.createInteractionNotification(user_id, body.type, body.parent_id ?? undefined, tweetObj._id)

    return tweet
  }

  private async createInteractionNotification(
    actorUserId: string,
    tweetType: TweetType,
    parentId?: string,
    newTweetId?: ObjectId
  ) {
      console.log('=== Create Interaction Notification Called ===', tweetType, parentId)
    const notificationType = this.mapTweetTypeToNotificationType(tweetType)

    if (!notificationType || !parentId) return

    const parentTweet = await databaseService.tweets.findOne({ _id: new ObjectId(parentId) })
    console.log('parentId:', parentId)
console.log('parentTweet:', parentTweet)
console.log('actorUserId:', actorUserId)
console.log('ownerUserId:', parentTweet?.user_id.toString())

    if (parentTweet && parentTweet.user_id.toString() !== actorUserId) {
      await notificationsService.createNotificationAndEmit({
        user_id: parentTweet.user_id.toString(),
        sender_id: actorUserId,
        type: notificationType,
        content: '', // (tùy chỉnh message nếu muốn)
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

  async deleteTweet(user_id: string, tweet_id: string) {
    const tweet = await databaseService.tweets.findOne({ _id: new ObjectId(tweet_id) })
    if (!tweet) {
      throw new Error('Tweet not found')
    }

    if (tweet.user_id.toString() !== user_id) {
      throw new Error('Permission denied: You can only delete your own tweets.')
    }

    // Xóa tweet
    await databaseService.tweets.deleteOne({ _id: new ObjectId(tweet_id) })

    // Xóa các like, bookmark, comment, retweet liên quan (nếu có)
    await Promise.all([
      databaseService.likes.deleteMany({ tweet_id: new ObjectId(tweet_id) }),
      databaseService.bookmarks.deleteMany({ tweet_id: new ObjectId(tweet_id) }),
      databaseService.tweets.deleteMany({ parent_id: new ObjectId(tweet_id) }) // xóa children tweet
    ])
  }
  async increaseView(tweet_id: string, user_id: string | undefined): Promise<Tweet | null> {
    const result = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
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
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
          }
        },
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'mentions',
            foreignField: '_id',
            as: 'mentions'
          }
        },
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
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },
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
            bookmarks: {
              $size: '$bookmarks'
            },
            likes: {
              $size: '$likes'
            },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Retweet]
                  }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Comment]
                  }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.QuoteTweet]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_children: 0
          }
        },
        {
          $skip: limit * (page - 1) // Cong thuc phan trang
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()
    const [, total] = await Promise.all([
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      ),
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      })
    ])
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    return {
      tweets,
      total
    }
  }

  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id)

    const followed_user_ids = await databaseService.followers
      .find(
        {
          user_id: user_id_obj
        },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray()
    const ids = followed_user_ids.map((item) => item.followed_user_id)
    //Mong muon newFeeds se lay luon ca tweet cua minh
    ids.push(user_id_obj)
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        // {
        //   '$match': {
        //     'user_id': { $in: ids }
        //   }
        // },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user'
          }
        },
        {
          $match: {
            $or: [
              { audience: 0 },
              {
                $and: [
                  { audience: 1 },
                  {
                    'user.twitter_circle': {
                      $in: [user_id_obj]
                    }
                  }
                ]
              }
            ]
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'hashtags',
            localField: 'hashtags',
            foreignField: '_id',
            as: 'hashtags'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'mentions',
            foreignField: '_id',
            as: 'mentions'
          }
        },
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
        {
          $lookup: {
            from: 'bookmarks',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'bookmarks'
          }
        },
        {
          $lookup: {
            from: 'bookmarks',
            let: { tweetId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$tweet_id', '$$tweetId'] }, { $eq: ['$user_id', new ObjectId(user_id)] }]
                  }
                }
              }
            ],
            as: 'my_bookmark'
          }
        },
        {
          $addFields: {
            is_bookmarked: { $gt: [{ $size: '$my_bookmark' }, 0] }
          }
        },

        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'tweet_id',
            as: 'likes'
          }
        },
        {
          $lookup: {
            from: 'likes',
            let: { tweetId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$tweet_id', '$$tweetId'] }, { $eq: ['$user_id', user_id_obj] }]
                  }
                }
              }
            ],
            as: 'my_like'
          }
        },
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
                      { $eq: ['$type', TweetType.Retweet] }
                    ]
                  }
                }
              }
            ],
            as: 'my_retweet'
          }
        },
        {
          $addFields: {
            is_retweeted: { $gt: [{ $size: '$my_retweet' }, 0] }
          }
        },
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
                      { $eq: ['$type', TweetType.QuoteTweet] }
                    ]
                  }
                }
              }
            ],
            as: 'my_quote'
          }
        },
        {
          $addFields: {
            is_quoted: { $gt: [{ $size: '$my_quote' }, 0] }
          }
        },

        {
          $addFields: {
            is_liked: { $gt: [{ $size: '$my_like' }, 0] }
          }
        },

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
            bookmarks: { $size: '$bookmarks' },
            likes: { $size: '$likes' },
            retweet_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.Retweet] }
                }
              }
            },
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.Comment] }
                }
              }
            },
            quote_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: { $eq: ['$$item.type', TweetType.QuoteTweet] }
                }
              }
            }
          }
        },
        {
          $project: {
            tweet_children: 0,
            'user.password': 0,
            'user.email_verify_token': 0,
            'user.forgot_password_token': 0,
            'user.twitter_circle': 0,
            'user.date_of_birth': 0
          }
        }
      ])
      .toArray()

    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()
    const [, total] = await Promise.all([
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: tweet_ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      ),
      databaseService.tweets
        .aggregate([
          // {
          //   '$match': {
          //     'user_id': {
          //       $in: ids
          //     }
          //   }
          // },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      $or: [
                        { 'user._id': user_id_obj }, // ✅ là chính chủ
                        { 'user.twitter_circle': user_id_obj } // ✅ nằm trong twitter_circle]
                      ]
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])
    tweets.forEach((tweet) => {
      tweet.updated_at = date
      tweet.user_views += 1
    })
    return {
      tweets,
      total: total[0]?.total || 0
    }
  }
}

const tweetsService = new TweetsService()
export default tweetsService
