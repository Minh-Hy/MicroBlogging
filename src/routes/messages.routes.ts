import { Router } from 'express';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import messagesController from '~/controller/messages.controllers';
import { wrapRequestHandler } from '~/utils/handlers';

const messagesRouter = Router();

messagesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(messagesController.sendMessage)
);

messagesRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(messagesController.getConversation)
);

messagesRouter.patch(
  '/read',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(messagesController.markAsRead)
);

export default messagesRouter;
