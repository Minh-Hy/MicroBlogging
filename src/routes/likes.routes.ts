import { Router } from "express"
import { likeTweetController, unlikeTweetController } from "~/controller/likes.controllers"
import { tweetIdValidator } from "~/middlewares/tweets.middlewares"

import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"


const likesRouter = Router()

/**
 * Descript  : like a tweet
 * Path : /
 * Method : POST
 * Body : TweetRequestBody
 * Headers : Authorization<Bearer access_token>
 */
likesRouter.post('', 
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController))
  /**
 * Descript  : unlike a tweet
 * Path : /
 * Method : DELETE

 * Headers : Authorization<Bearer access_token>
 */
likesRouter.delete('/tweets/:tweet_id', 
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unlikeTweetController))












export default likesRouter