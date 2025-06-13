import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '~/models/requests/user.requests';
import HTTP_STATUS from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';

export const isAdminValidator = (req: Request, res: Response, next: NextFunction) => {
  const user = req.decoded_authorization as TokenPayload;

  if (user.role !== 'admin') {
    return next(
      new ErrorWithStatus({
        message: 'You are not authorized to access this resource.',
        status: HTTP_STATUS.FORBIDDEN
      })
    );
  }

  next();
};
