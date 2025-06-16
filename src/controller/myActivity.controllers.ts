import { Request, Response } from "express";
import myActivityService from "~/services/myActivity.services";
import { TokenPayload } from "~/models/requests/user.requests";

export const getMyTweetsController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const limit = parseInt(req.query.limit as string) || 20;
  const page = parseInt(req.query.page as string) || 1;

  const result = await myActivityService.getMyTweets({ user_id, limit, page });

  res.json({
    message: "Get my tweets successfully",
    result: {
      tweets: result.tweets,
      page,
      limit,
      total_page: Math.ceil(result.total / limit)
    }
  });
};

export const getMyLikesController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const limit = parseInt(req.query.limit as string) || 20;
  const page = parseInt(req.query.page as string) || 1;

  const result = await myActivityService.getMyLikes({ user_id, limit, page });

  res.json({
    message: "Get my likes successfully",
    result: {
      tweets: result.tweets,
      page,
      limit,
      total_page: Math.ceil(result.total / limit)
    }
  });
};

export const getMyCommentsController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const limit = parseInt(req.query.limit as string) || 20;
  const page = parseInt(req.query.page as string) || 1;

  const result = await myActivityService.getMyComments({ user_id, limit, page });

  res.json({
    message: "Get my comments successfully",
    result: {
      tweets: result.tweets,
      page,
      limit,
      total_page: Math.ceil(result.total / limit)
    }
  });
};
