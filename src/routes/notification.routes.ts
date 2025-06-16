import { Router } from 'express';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import notificationsController from '~/controller/notification.controllers';
import { wrapRequestHandler } from '~/utils/handlers';

const notificationsRouter = Router();

notificationsRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(notificationsController.getNotifications)
);

notificationsRouter.patch(
  '/:notification_id/read',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(notificationsController.markAsRead)
);

export default notificationsRouter;
