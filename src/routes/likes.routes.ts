import { Router } from 'express'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { likeTweetController, unlikeTweetController } from '~/controller/likes.controllers'
import { wrapRequestHandler } from '~/utils/handlers'

const likesRouter = Router()

/**
 * Descript  : Like a tweet
 * Path : /
 * Method : POST
 * Body : LikeTweetReqBody
 * Headers : Authorization<Bearer access_token>
 */
likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(likeTweetController)
)

/**
 * Descript  : Unlike a tweet
 * Path : /:tweet_id
 * Method : DELETE
 * Headers : Authorization<Bearer access_token>
 */
likesRouter.delete(
  '/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unlikeTweetController)
)

export default likesRouter
