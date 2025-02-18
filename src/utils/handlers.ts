import { Request, Response, NextFunction, RequestHandler } from "express"

export const wrapRequestHandler = (func: RequestHandler): RequestHandler =>{
  return async (req: Request, res: Response, next: NextFunction) =>{
    try {
      return await func(req, res, next)
    } catch (error) {
      next(error)
    }
 
  }
}