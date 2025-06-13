import { Request, Response } from 'express';
import SearchServices from '~/services/search.services';

export const searchController = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const page = parseInt(req.query.page as string) || 1;
  const query = req.query.content as string;
  const user_id = req.decoded_authorization?.user_id as string;

  const [users, tweetResult] = await Promise.all([
    SearchServices.searchUsers(query, 10),
    SearchServices.searchTweets({ limit, page, content: query, user_id })
  ]);

  res.json({
    message: 'Search successfully',
    result: {
      users,
      tweets: tweetResult.tweets,
      limit,
      page,
      total_page: Math.ceil(tweetResult.total / limit)
    }
  });
};
