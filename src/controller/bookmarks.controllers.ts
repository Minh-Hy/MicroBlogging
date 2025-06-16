/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { BOOKMARK_MESSAGES } from '~/constants/messages';
import { BookmarkTweetReqBody } from '~/models/requests/bookmarks.requests';
import { TokenPayload } from '~/models/requests/user.requests';
import bookmarksService from '~/services/bookmarks.services';

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await bookmarksService.bookmarkTweet(user_id, req.body.tweet_id);
  res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESS,
    result
  });
};

export const unBookmarkTweetController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.params;
  const result = await bookmarksService.unBookmarkTweet(user_id, tweet_id);
  res.json({
    message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESS,
    result
  });
};

export const getBookmarksController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const limit = parseInt(req.query.limit as string) || 10;
  const page = parseInt(req.query.page as string) || 1;

  const result = await bookmarksService.getBookmarks(user_id, limit, page);
  res.json({
    message: BOOKMARK_MESSAGES.GET_BOOKMARKS_SUCCESS,
    result: {
      tweets: result.tweets,
      total: result.total,
      page,
      limit,
      total_page: Math.ceil(result.total / limit)
    }
  });
};
