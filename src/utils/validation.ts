import express from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';
import httpStatus from '~/constants/httpStatus';
import { EntityError, ErrorWithStatus } from '~/models/Errors';

// Middleware validate request body
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req);
    const errors = validationResult(req);

    // ✅ Nếu không có lỗi, tiếp tục xử lý request
    if (errors.isEmpty()) {
      return next();
    }

    // ✅ Chuyển lỗi thành object
    const errorsObject = errors.mapped();
    const entityError = new EntityError({ errors: {} });

    for (const key in errorsObject) {
      const { msg } = errorsObject[key];

      // ✅ Nếu lỗi không phải do validation, chuyển lỗi đến error handler
      if (msg instanceof ErrorWithStatus && msg.status !== httpStatus.UNPROCESSABLE_ENTITY) {
        return next(msg); // ✅ Ngăn chặn gọi next() nhiều lần
      }

      entityError.errors[key] = errorsObject[key];
    }

    // ✅ Nếu headers đã được gửi, không gọi next() nữa
    if (!res.headersSent) {
      return next(entityError);
    }
  };
};
