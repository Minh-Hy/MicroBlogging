/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response} from "express"
import {ParamsDictionary} from 'express-serve-static-core'
import { TweetRequestBody } from "~/models/requests/tweets.requests"
import { TokenPayload } from "~/models/requests/user.requests";
import tweetsServiec from "~/services/tweets.services";

export const createTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetsServiec.createTweet(user_id, req.body);
  res.json({
    message : "Tweet created successfully",
    result
  })
};

export const getTweetController = async (
  req: Request<ParamsDictionary, any, TweetRequestBody>,
  res: Response
) => {
  res.json({
    message : "Get tweet successfully",
  })
};