import { ObjectId, WithId } from "mongodb";
import databaseService from "./database.services";
import Bookmark from "~/models/schemas/Bookmarks.schemas";

class BookmarksService {
  async bookmarkTweet(user_id: string, tweet_Id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      { 
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_Id)
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_Id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );
    return result as WithId<Bookmark>;
  }

  async unBookmarkTweet(user_id: string, tweetId: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweetId)
    });
    return result;
  }

  async getBookmarks(user_id: string, limit: number, page: number) {
    const user_id_obj = new ObjectId(user_id);

    const bookmarks = await databaseService.bookmarks
      .find({ user_id: user_id_obj })
      .skip(limit * (page - 1))
      .limit(limit)
      .toArray();

    const tweet_ids = bookmarks.map((item) => item.tweet_id);

    if (tweet_ids.length === 0) {
      return { tweets: [], total: 0 };
    }

    const tweets = await databaseService.tweets
      .aggregate([
        { $match: { _id: { $in: tweet_ids } } },
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
      .toArray();

    const total = await databaseService.bookmarks.countDocuments({ user_id: user_id_obj });

    return {
      tweets,
      total
    }
  }
}

const bookmarksService = new BookmarksService();
export default bookmarksService;
