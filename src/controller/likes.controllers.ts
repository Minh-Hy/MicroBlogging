/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { TokenPayload } from '~/models/requests/user.requests';
import likesService from '~/services/likes.services';
import { LikeTweetReqBody } from '~/models/requests/likes.requests';

class LikesController {
  async likeTweet(req: Request<any, any, LikeTweetReqBody>, res: Response) {
    const { tweet_id } = req.body;
    const { user_id } = req.decoded_authorization as TokenPayload;

    const result = await likesService.likeTweet(user_id, tweet_id);
    res.json({ message: 'Like tweet success', result });
  }

  async unlikeTweet(req: Request, res: Response) {
    const { tweet_id } = req.params;
    const { user_id } = req.decoded_authorization as TokenPayload;

    const result = await likesService.unlikeTweet(user_id, tweet_id);
    res.json({ message: 'Unlike tweet success', result });
  }
}

const likesController = new LikesController();
export default likesController;
