import { Router } from 'express';
import { wrapRequestHandler } from '~/utils/handlers';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { isAdminValidator } from '~/middlewares/admin.middlewares';
import adminController from '~/controller/admin.controllers';

const adminRouter = Router();

adminRouter.get(
  '/users',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(adminController.getAllUsers)
);

adminRouter.delete(
  '/users/:userId',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(adminController.banUser)
);

adminRouter.get(
  '/tweets',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(adminController.getAllTweets)
);

adminRouter.delete(
  '/tweets/:tweetId',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(adminController.deleteTweet)
);

adminRouter.get(
  '/reports',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(adminController.getAllReports)
);

adminRouter.patch(
  '/reports/:reportId',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(adminController.updateReportStatus)
);

adminRouter.get(
  '/dashboard',
  accessTokenValidator,
  verifiedUserValidator,
  isAdminValidator,
  wrapRequestHandler(adminController.dashboard)
);



export default adminRouter;
