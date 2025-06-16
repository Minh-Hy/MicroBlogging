import { Router } from "express"
import { createTweetController, getNewFeedsController, getTweetChildrenController, getTweetController, deleteTweetController } from "~/controller/tweets.controllers"
import { audienceValidator, createTweetValidator, getTweetChildrenValidator, paginationValidator, tweetIdValidator } from "~/middlewares/tweets.middlewares"

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
 * Descript  : Delete tweet
 * Path      : /tweets/:tweet_id
 * Method    : DELETE
 * Header    : { Authorization: Bearer <access token> }
 */
tweetsRouter.delete(
  '/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(deleteTweetController)
);

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
  paginationValidator,
  getTweetChildrenValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator), 
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController))
    /**
 * Descript  : get new feed 
 * Path : /new-feeds
 * Method : GET
 * Headers : Authorization<Bearer access_token>
 * Query : {
 *   - page: number
 *  - limit: number}
 */
tweetsRouter.get('/',
  paginationValidator,
  accessTokenValidator,
  verifiedUserValidator, 
  wrapRequestHandler(getNewFeedsController))



export default tweetsRouter