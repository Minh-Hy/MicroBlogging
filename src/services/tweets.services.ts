import { TweetRequestBody } from "~/models/requests/tweets.requests";
import databaseService from "./database.services";
import Tweet from "~/models/schemas/Tweet.schemas";
import { ObjectId, WithId } from "mongodb";
import Hashtag from "~/models/schemas/Hashtags.schemas";


class TweetsService {
  async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(hashtags.map((hashtag) => {
      //Tim hashtag trong db neu co thi lay, neu khong thi tao moi
      return databaseService.hashtags.findOneAndUpdate(
        { name: hashtag },
        {
          $setOnInsert: new Hashtag({ name : hashtag})
        },
        {
          upsert: true,
          returnDocument: 'after',
        }

      )
    })
    )
    return hashtagDocuments.map((hashtag) =>  (hashtag as WithId<Hashtag>)._id);
  }
  async createTweet(user_id: string, body: TweetRequestBody){
    const hashtags = await this.checkAndCreateHashtags(body.hashtags)
    const result = await databaseService.tweets.insertOne(new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags: hashtags, // cho nay chua lam
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id,
      type: body.type,
      user_id: new ObjectId(user_id),
    }))

    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
  return tweet
  }
}


const tweetsServiec = new TweetsService();
export default tweetsServiec;