import { Router } from 'express';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
import { getNotificationsController, markNotificationAsReadController } from '~/controller/notification.controllers';

const notificationsRouter = Router();

notificationsRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getNotificationsController)
);

notificationsRouter.patch(
  '/:notification_id/read',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(markNotificationAsReadController)
);

export default notificationsRouter;
