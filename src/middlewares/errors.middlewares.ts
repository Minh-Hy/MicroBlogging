import { Request, Response, NextFunction } from "express";
import HTTP_STATUS from "~/constants/httpStatus";
import { omit } from 'lodash';
import { ErrorWithStatus } from "~/models/Errors";


export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    res.status(err.status).json(omit(err, 'status'))
  }
  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, {
      enumerable: true
    })})
  res.status(HTTP_STATUS.INTERNAL_SEVER_ERROR).json({
    message : err.message,
    errorinfo : omit(err, ['stack'])
  })
}