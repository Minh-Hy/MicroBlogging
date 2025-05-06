import { ObjectId, WithId } from "mongodb";
import databaseService from "./database.services";
import Bookmark from "~/models/schemas/Bookmarks.schemas";

class BookmarksService {
  async bookmarkTweet(user_id : string, tweet_Id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      { 
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_Id)
      },
      {
        $setOnInsert: new Bookmark ({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_Id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after',
      })
  return result as WithId<Bookmark>;
  }

  async unBookmarkTweet(user_id : string, tweetId: string) {
    const result = await databaseService.bookmarks.findOneAndDelete(
      { 
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweetId)
      },
      )
  return result
  }
}

const bookmarksService = new BookmarksService();
export default bookmarksService;