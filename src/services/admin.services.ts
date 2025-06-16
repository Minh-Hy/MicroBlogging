import { TweetType } from '~/constants/enums';
import databaseService from '~/services/database.services';
import { ObjectId } from 'mongodb';
import { UserVerifyStatus } from '~/constants/enums';

class AdminService {
  async getAllUsers() {
    return await databaseService.users.find({}, {
      projection: {
        password: 0,
        email_verify_token: 0,
        forgot_password_token: 0
      }
    }).toArray();
  }

  async banUser(userId: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { verify: UserVerifyStatus.Banned } }
    );
  }

  async unbanUser(userId: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { verify: UserVerifyStatus.Verified } }  // Giả sử Unban trả lại trạng thái Verified
    );
  }

  async deleteUser(userId: string) {
    await databaseService.users.deleteOne({ _id: new ObjectId(userId) });
  }

   async getAllTweets(limit: number, page: number) {
    const tweets = await databaseService.tweets
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
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
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray();

    const total = await databaseService.tweets.countDocuments();

    return {
      tweets,
      total
    };
  }

  async deleteTweet(tweetId: string) {
    await databaseService.tweets.deleteOne({ _id: new ObjectId(tweetId) });
  }

  async getAllReports() {
    return await databaseService.reports.find().sort({ created_at: -1 }).toArray();
  }

  async updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved') {
    await databaseService.reports.updateOne(
      { _id: new ObjectId(reportId) },
      { $set: { status } }
    );
  }

  async dashboard() {
    const [userCount, tweetCount, reportCount] = await Promise.all([
      databaseService.users.countDocuments(),
      databaseService.tweets.countDocuments(),
      databaseService.reports.countDocuments()
    ]);

    return {
      userCount,
      tweetCount,
      reportCount
    };
  }
}

export default new AdminService();
