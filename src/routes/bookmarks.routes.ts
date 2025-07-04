import { getBookmarksController } from './../controller/bookmarks.controllers';
import { Router } from "express"
import { bookmarkTweetController, unBookmarkTweetController } from "~/controller/bookmarks.controllers"
import { tweetIdValidator } from "~/middlewares/tweets.middlewares"

import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"


const bookmarksRouter = Router()

/**
 * Descript  : Bookmark a tweet
 * Path : /
 * Method : POST
 * Body : TweetRequestBody
 * Headers : Authorization<Bearer access_token>
 */
bookmarksRouter.post('', 
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkTweetController))

  /**
 * Descript  : unBookmark a tweet
 * Path : /:tweet_id
 * Method : DELETE
 * Headers : Authorization<Bearer access_token>
 */
bookmarksRouter.delete('/tweets/:tweet_id', 
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unBookmarkTweetController))
 /* Descript  : Get bookmarks (with pagination)
 * Path : /bookmarks
 * Method : GET
 * Header : {Authorization: Bearer <access token>}
 * Query : ?limit=20&page=1
 */
bookmarksRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getBookmarksController)
);

  export default bookmarksRouter

