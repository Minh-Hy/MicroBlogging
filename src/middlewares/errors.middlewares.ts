import { Request, Response, NextFunction } from "express";
import HTTP_STATUS from "~/constants/httpStatus";
import { omit } from 'lodash';
import { ErrorWithStatus } from "~/models/Errors";


export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, 'status'));
  }

  // Thay thế đoạn này:
  const errorDetails = Object.getOwnPropertyNames(err).reduce((acc: Record<string, any>, key) => {
    acc[key] = err[key];
    return acc;
  }, {});
  

  // Trả về phản hồi lỗi
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorinfo: omit(errorDetails, ['stack']) // Chỉ gửi thông tin cần thiết
  });
};

