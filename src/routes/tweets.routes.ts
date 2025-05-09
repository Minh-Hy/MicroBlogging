import { Router } from "express"
import { createTweetController, getTweetChildrenController, getTweetController } from "~/controller/tweets.controllers"
import { audienceValidator, createTweetValidator, getTweetChildrenValidator, tweetIdValidator } from "~/middlewares/tweets.middlewares"

import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from "~/middlewares/users.middlewares"
import { wrapRequestHandler } from "~/utils/handlers"


const tweetsRouter = Router()

/**
 * Descript  : Create new tweet
 * Path : /
 * Method : POST
 * Body : TweetRequestBody
 * Headers : Authorization<Bearer access_token>
 */
tweetsRouter.post('/', accessTokenValidator,
   verifiedUserValidator,
   createTweetValidator, 
   wrapRequestHandler(createTweetController))
  

/**
 * Descript  : get tweet detail 
 * Path : /:tweet_id
 * Method : GET
 * Headers : Authorization<Bearer access_token>
 */
tweetsRouter.get('/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator), 
  audienceValidator,
  wrapRequestHandler(getTweetController))
  /**
 * Descript  : get tweet children 
 * Path : /:tweet_id/children
 * Method : GET
 * Headers : Authorization<Bearer access_token>
 * Query : {
 *   - page: number
 *  - limit: number
 *  - tweet_type : TweetType}
 */
tweetsRouter.get('/:tweet_id/children',
  tweetIdValidator,
   getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator), 
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController))


export default tweetsRouter