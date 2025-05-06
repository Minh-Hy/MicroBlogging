import { Router } from "express"
import { createTweetController, getTweetController } from "~/controller/tweets.controllers"
import { createTweetValidator, tweetIdValidator } from "~/middlewares/tweets.middlewares"

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
 * Descript  : Create tweet detail 
 * Path : /:tweet_id
 * Method : GET
 * Headers : Authorization<Bearer access_token>
 */
tweetsRouter.get('/:tweet_id',
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator), 
  tweetIdValidator,
  wrapRequestHandler(getTweetController))


export default tweetsRouter