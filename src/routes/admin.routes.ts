import { Router } from 'express';
import {
  getAllUsersController,
  banUserController,
  unbanUserController,
  deleteUserController,
  getAllTweetsController,
  deleteTweetController,
  getAllReportsController,
  updateReportStatusController,
  dashboardController
} from '~/controller/admin.controllers';
import { wrapRequestHandler } from '~/utils/handlers';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';

// ⚠️ Tùy hệ thống role, có thể thêm middleware kiểm tra quyền Admin ở đây nếu cần

const adminRouter = Router();

// User management
adminRouter.get(
  '/users',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getAllUsersController)
);

adminRouter.patch(
  '/users/:userId/ban',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(banUserController)
);

adminRouter.patch(
  '/users/:userId/unban',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(unbanUserController)
);

adminRouter.delete(
  '/users/:userId',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(deleteUserController)
);

// Tweets management
adminRouter.get(
  '/tweets',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getAllTweetsController)
);

adminRouter.delete(
  '/tweets/:tweetId',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(deleteTweetController)
);

// Reports management
adminRouter.get(
  '/reports',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getAllReportsController)
);

adminRouter.patch(
  '/reports/:reportId',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(updateReportStatusController)
);

// Dashboard
adminRouter.get(
  '/dashboard',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(dashboardController)
);

export default adminRouter;
