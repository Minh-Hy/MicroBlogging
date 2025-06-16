import { Router } from 'express';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import likesController from '~/controller/likes.controllers';
import { wrapRequestHandler } from '~/utils/handlers';

const likesRouter = Router();

likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(likesController.likeTweet)
);

likesRouter.delete(
  '/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(likesController.unlikeTweet)
);

export default likesRouter;
