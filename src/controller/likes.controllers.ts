/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/user.requests'
import likesService from '~/services/likes.services'
import { LikeTweetReqBody } from '~/models/requests/likes.requests'

export const likeTweetController = async (
  req: Request<any, any, LikeTweetReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.body

  const result = await likesService.likeTweet(user_id, tweet_id)
  res.json({
    message: 'Like tweet success',
    result
  })
}

export const unlikeTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params

  const result = await likesService.unlikeTweet(user_id, tweet_id)
  res.json({
    message: 'Unlike tweet success',
    result
  })
}
