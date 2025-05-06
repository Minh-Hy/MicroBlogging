/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { LIKE_MESSAGES } from "~/constants/messages";
import { LikeTweetReqBody } from "~/models/requests/likes.requests";
import { TokenPayload } from "~/models/requests/user.requests";
import likesService from "~/services/likes.services";



export const likeTweetController = async (
  req: Request<ParamsDictionary, any, LikeTweetReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await likesService.likeTweet(user_id, req.body.tweet_id);
  res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESS,
    result
  });
};

export const unlikeTweetController = async (
  req: Request,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await likesService.unlikeTweet(user_id, req.params.tweet_id);
  res.json({
    message: LIKE_MESSAGES.UNLIKE_SUCCESS,
    result
  });
};
