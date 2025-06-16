import { ObjectId } from "mongodb";
import databaseService from "./database.services";
import { TweetType } from "~/constants/enums";

class MyActivityService {
  async getMyTweets({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const userObjectId = new ObjectId(user_id);
    const skip = (page - 1) * limit;

    const tweets = await databaseService.tweets
      .find({ user_id: userObjectId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await databaseService.tweets.countDocuments({ user_id: userObjectId });

    return { tweets, total };
  }

  async getMyLikes({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const userObjectId = new ObjectId(user_id);
    const skip = (page - 1) * limit;

    const likes = await databaseService.likes
      .aggregate([
        { $match: { user_id: userObjectId } },
        {
          $lookup: {
            from: "tweets",
            localField: "tweet_id",
            foreignField: "_id",
            as: "tweet"
          }
        },
        { $unwind: "$tweet" },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    const total = await databaseService.likes.countDocuments({ user_id: userObjectId });

    return { tweets: likes.map(like => like.tweet), total };
  }

  async getMyComments({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const userObjectId = new ObjectId(user_id);
    const skip = (page - 1) * limit;

    const comments = await databaseService.tweets
      .find({ user_id: userObjectId, type: TweetType.Comment })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await databaseService.tweets.countDocuments({ user_id: userObjectId, type: TweetType.Comment });

    return { tweets: comments, total };
  }
}

const myActivityService = new MyActivityService();
export default myActivityService;
