
import { TweetType } from '~/constants/enums';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response} from "express-serve-static-core"
import {ParamsDictionary} from 'express-serve-static-core'
import { Pagination, TweetParam, TweetQuery, TweetRequestBody } from "~/models/requests/tweets.requests"
import { TokenPayload } from "~/models/requests/user.requests";
import tweetsService from "~/services/tweets.services";
import { TWEET_MESSAGES, USERS_MESSAGES } from '~/constants/messages';


export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {

  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body);
  res.json({
    message : TWEET_MESSAGES.TWEET_CREATED_SUCCESS,
    result
  })
};

export const deleteTweetController = async (
  req: Request,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.params as { tweet_id: string };

  await tweetsService.deleteTweet(user_id, tweet_id);
  res.json({
    message: TWEET_MESSAGES.DELETE_TWEET_SUCCESS,
  });
};

export const softDeleteTweetByAdminController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params as { tweet_id: string }
  const { reason } = req.body as { reason: string }
  const { user_id, role } = req.decoded_authorization as TokenPayload

  if (role !== 'admin') {
     res.status(403).json({ message: TWEET_MESSAGES.FORBIDDEN_ACTION })
  }

  if (!reason || reason.trim() === '') {
     res.status(400).json({ message: TWEET_MESSAGES.REASON_REQUIRED })
  }

  await tweetsService.softDeleteByAdmin(tweet_id, user_id, reason)

   res.json({
    message: TWEET_MESSAGES.SOFT_DELETE_TWEET_SUCCESS,
  })
}

export const updateTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params as { tweet_id: string }
  const { user_id } = req.decoded_authorization as TokenPayload

  const updatedTweet = await tweetsService.updateTweet(user_id, tweet_id, req.body)
  res.json({
    message: TWEET_MESSAGES.UPDATE_TWEET_SUCCESS,
    result: updatedTweet
  })
}


export const getTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {
  // Thực hiện quẻy db chỗ này là đang thực hiện lần thứ 2 
  const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id);
  const tweet = {
    ...req.tweet,
    guest_views: result!.guest_views,
    user_views: result!.user_views,
    updated_at: result!.updated_at,
  }
  res.json({
    message : TWEET_MESSAGES.GET_TWEET_SUCCESS,
    result : tweet
  })
};

export const getTweetChildrenController = async (
  req: Request<TweetParam, any, any, TweetQuery>,
  res: Response
) => {
  const tweet_type = Number(req.query.tweet_type) as TweetType
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const user_id = req.decoded_authorization?.user_id
  const {total, tweets} = await tweetsService.getTweetChildren({
      tweet_id: req.params.tweet_id,
      page, 
      limit, 
      tweet_type,
      user_id
    });
  res.json({
    message : USERS_MESSAGES.GET_TWEET_CHILDREN_SUCCESS,
    result : {
      tweets,
      tweet_type,
      page,
      limit,
      total_page : Math.ceil(total / limit),

    }
  })
};

export const getNewFeedsController = async (req : Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const page = Number(req.query.page)
  const limit = Number(req.query.limit)
  const result = await tweetsService.getNewFeeds({
    user_id, 
    limit, 
    page
  })
  res.json({
    message: USERS_MESSAGES.GET_NEW_FEEDS_SUCCESS,
    result : {
      tweet : result.tweets,
      limit,
      page,
      total_page : Math.ceil(result.total / limit)
    }
  })
}