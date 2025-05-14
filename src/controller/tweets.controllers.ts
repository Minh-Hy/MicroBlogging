import { TweetType } from '~/constants/enums';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response} from "express"
import {ParamsDictionary} from 'express-serve-static-core'
import { Pagination, TweetParam, TweetQuery, TweetRequestBody } from "~/models/requests/tweets.requests"
import { TokenPayload } from "~/models/requests/user.requests";
import tweetsService from "~/services/tweets.services";


export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsService.createTweet(user_id, req.body);
  res.json({
    message : "Tweet created successfully",
    result
  })
};

export const getTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {
  // Thực hiện quẻy db chỗ này là đang thực hiện lần thứ 2 
  const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id);
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updated_at: result.updated_at,
  }
  res.json({
    message : "Get tweet successfully",
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
    message : "Get tweet Children successfully",
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
    message: "Get new feeds successfully",
    result : {
      tweet : result.tweets,
      limit,
      page,
      total_page : Math.ceil(result.total / limit)
    }
  })
}