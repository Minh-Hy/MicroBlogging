import { ObjectId } from 'mongodb';
import databaseService from './database.services';
import Bookmark from '~/models/schemas/Bookmarks.schemas';

class BookmarksService {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    return result;
  }

  async unBookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    });
    return result;
  }

  async getBookmarks(user_id: string, limit: number, page: number) {
    const pipeline = [
      {
        $match: {
          user_id: new ObjectId(user_id)
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: 'tweet_id',
          foreignField: '_id',
          as: 'tweet'
        }
      },
      {
        $unwind: '$tweet'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'tweet.user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'likes',
          localField: 'tweet._id',
          foreignField: 'tweet_id',
          as: 'likes'
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: 'tweet._id',
          foreignField: 'parent_id',
          as: 'tweet_children'
        }
      },
      {
        $addFields: {
          like_count: { $size: '$likes' },
          comment_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', 1] }
              }
            }
          },
          retweet_count: {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'item',
                cond: { $eq: ['$$item.type', 2] }
              }
            }
          }
        }
      },
      {
        $project: {
          tweet_children: 0,
          likes: 0,
          'user.password': 0,
          'user.email_verify_token': 0,
          'user.forgot_password_token': 0,
          'user.twitter_circle': 0,
          'user.date_of_birth': 0
        }
      },
      { $skip: limit * (page - 1) },
      { $limit: limit }
    ];

    const result = await databaseService.bookmarks.aggregate(pipeline).toArray();

    const total = await databaseService.bookmarks.countDocuments({ user_id: new ObjectId(user_id) });

    return {
      tweets: result,
      total
    };
  }
}

const bookmarksService = new BookmarksService();
export default bookmarksService;
