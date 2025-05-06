/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response} from "express"
import {ParamsDictionary} from 'express-serve-static-core'
import { BOOKMARK_MESSAGES } from "~/constants/messages";
import { BookmarkTweetReqBody } from "~/models/requests/bookmarks.requests"
import { TokenPayload } from "~/models/requests/user.requests";
import bookmarksService from "~/services/bookmarks.services";


export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await bookmarksService.bookmarkTweet(user_id, req.body.tweet_id);
  res.json({
    message : BOOKMARK_MESSAGES.BOOKMARK_SUCCESS,
    result
  })
};

export const unBookmarkTweetController = async (
  req: Request,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await bookmarksService.unBookmarkTweet(user_id, req.params.tweet_id);
  res.json({
    message : BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESS,
    result
  })
};